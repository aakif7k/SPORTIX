"""
Idempotent Appwrite provisioner.

    python -m scripts.provision_appwrite [--timeout 180] [--only collection_id]

Creates the database, every collection, attribute and index in scripts.schema,
plus the three storage buckets. Safe to run repeatedly: an existing resource is
reported as `[=] exists` rather than failing, so a second run is all `[=]`.

Appwrite creates attributes asynchronously. An index cannot be created until
every attribute it references reports status "available", so each collection
waits for its attributes to settle before its indexes are built.

Output is deliberately ASCII-only: the Windows console this runs on is cp1252
and would raise UnicodeEncodeError on box-drawing or check-mark characters.
"""
from __future__ import annotations

import argparse
import sys
import time

from appwrite.exception import AppwriteException
from appwrite.permission import Permission
from appwrite.query import Query
from appwrite.role import Role
from appwrite.enums.index_type import IndexType
from appwrite.enums.compression import Compression

from app.core.appwrite import db, storage_svc, DB_ID
from app.core.config import settings
from scripts.schema import ADJUSTMENTS, BUCKETS, COLLECTIONS, Attr, Bucket, Collection, Index, summary

INDEX_TYPES = {"key": IndexType.KEY, "unique": IndexType.UNIQUE, "fulltext": IndexType.FULLTEXT}

created = existed = failed = 0


def _ok(msg: str) -> None:
    global created
    created += 1
    print(f"  [+] {msg}")


def _same(msg: str) -> None:
    global existed
    existed += 1
    print(f"  [=] {msg}")


def _err(msg: str) -> None:
    global failed
    failed += 1
    print(f"  [x] {msg}")


def _is_conflict(e: AppwriteException) -> bool:
    return getattr(e, "code", 0) == 409


# ── Database ──────────────────────────────────────────────────────────────────
def ensure_database() -> None:
    print(f"Database {DB_ID}")
    try:
        db.get(DB_ID)
        _same(f"database {DB_ID}")
    except AppwriteException as e:
        if getattr(e, "code", 0) != 404:
            _err(f"database {DB_ID}: {e.message}")
            return
        try:
            db.create(DB_ID, "SPORTiX")
            _ok(f"database {DB_ID}")
        except AppwriteException as e2:
            if _is_conflict(e2):
                _same(f"database {DB_ID}")
            else:
                _err(f"database {DB_ID}: {e2.message}")


# ── Collections ───────────────────────────────────────────────────────────────
def collection_permissions(c: Collection) -> list[str]:
    """
    No client may ever create, update or delete: the server API key bypasses
    permissions, so every write goes through FastAPI. Read is granted only where
    a browser realtime subscription needs it.
    """
    return [Permission.read(Role.users())] if c.read == "users" else []


def ensure_collection(c: Collection) -> bool:
    try:
        db.create_collection(
            DB_ID, c.id, c.name,
            permissions=collection_permissions(c),
            document_security=c.doc_security,
            enabled=True,
        )
        _ok(f"collection {c.id}")
    except AppwriteException as e:
        if not _is_conflict(e):
            _err(f"collection {c.id}: {e.message}")
            return False
        _same(f"collection {c.id}")
        # Keep permissions in step with the schema even for an existing collection.
        try:
            db.update_collection(
                DB_ID, c.id, c.name,
                permissions=collection_permissions(c),
                document_security=c.doc_security,
                enabled=True,
            )
        except AppwriteException as e2:
            _err(f"collection {c.id} permissions: {e2.message}")
    return True


def ensure_attribute(c: Collection, a: Attr) -> None:
    label = f"{c.id}.{a.key} ({a.kind}{'[]' if a.array else ''})"
    try:
        if a.kind == "string":
            db.create_string_attribute(DB_ID, c.id, a.key, a.size, a.required,
                                       default=a.default, array=a.array or None)
        elif a.kind == "enum":
            db.create_enum_attribute(DB_ID, c.id, a.key, a.elements, a.required,
                                     default=a.default, array=a.array or None)
        elif a.kind == "int":
            db.create_integer_attribute(DB_ID, c.id, a.key, a.required,
                                        default=a.default, array=a.array or None)
        elif a.kind == "float":
            db.create_float_attribute(DB_ID, c.id, a.key, a.required,
                                      default=a.default, array=a.array or None)
        elif a.kind == "bool":
            db.create_boolean_attribute(DB_ID, c.id, a.key, a.required,
                                        default=a.default, array=a.array or None)
        elif a.kind == "datetime":
            db.create_datetime_attribute(DB_ID, c.id, a.key, a.required,
                                         default=a.default, array=a.array or None)
        elif a.kind == "url":
            db.create_url_attribute(DB_ID, c.id, a.key, a.required,
                                    default=a.default, array=a.array or None)
        elif a.kind == "email":
            db.create_email_attribute(DB_ID, c.id, a.key, a.required,
                                      default=a.default, array=a.array or None)
        else:
            _err(f"{label}: unknown kind")
            return
        _ok(label)
    except AppwriteException as e:
        if _is_conflict(e):
            _same(label)
        else:
            _err(f"{label}: {e.message}")


def _all_attributes(collection_id: str) -> list[dict]:
    """
    Every attribute, following pagination.

    list_attributes defaults to 25 per page. profiles has 30 attributes and
    events 27, so an unpaginated call silently omitted the tail and made those
    attributes look like they had never been created.
    """
    out: list[dict] = []
    offset = 0
    page = 100  # Appwrite's maximum
    while True:
        batch = db.list_attributes(
            DB_ID, collection_id, queries=[Query.limit(page), Query.offset(offset)]
        )["attributes"]
        out.extend(batch)
        if len(batch) < page:
            return out
        offset += page


def wait_for_attributes(c: Collection, timeout: int) -> bool:
    """Block until every attribute reports 'available'. Indexes need this."""
    wanted = {a.key for a in c.all_attrs}
    deadline = time.time() + timeout
    while True:
        try:
            listed = _all_attributes(c.id)
        except AppwriteException as e:
            _err(f"{c.id}: cannot list attributes: {e.message}")
            return False

        status = {a["key"]: a.get("status") for a in listed if a["key"] in wanted}
        pending = [k for k, s in status.items() if s == "processing"]
        broken = [k for k, s in status.items() if s == "failed"]
        missing = sorted(wanted - set(status))

        if broken:
            _err(f"{c.id}: attributes failed to create: {', '.join(sorted(broken))}")
            return False
        if not pending and not missing:
            return True
        if time.time() > deadline:
            detail = []
            if pending:
                detail.append(f"still processing: {', '.join(sorted(pending))}")
            if missing:
                detail.append(f"never appeared: {', '.join(missing)}")
            _err(f"{c.id}: timed out after {timeout}s waiting for attributes ({'; '.join(detail)})")
            return False
        time.sleep(1)


def ensure_index(c: Collection, i: Index) -> None:
    label = f"{c.id}.{i.key} [{i.type} {'+'.join(i.attributes)}]"
    try:
        db.create_index(DB_ID, c.id, i.key, INDEX_TYPES[i.type], i.attributes, orders=i.orders)
        _ok(label)
    except AppwriteException as e:
        if _is_conflict(e):
            _same(label)
        else:
            _err(f"{label}: {e.message}")


# ── Buckets ───────────────────────────────────────────────────────────────────
def ensure_bucket(b: Bucket) -> None:
    # Read-only for clients where the media is public; never writable, since all
    # uploads are proxied through FastAPI.
    permissions = [Permission.read(Role.any())] if b.public_read else []
    try:
        storage_svc.create_bucket(
            b.id, b.name,
            permissions=permissions,
            file_security=not b.public_read,
            enabled=True,
            maximum_file_size=b.max_size_mb * 1024 * 1024,
            allowed_file_extensions=b.extensions,
            compression=Compression.GZIP if b.compression == "gzip" else Compression.NONE,
            encryption=b.encryption,
            antivirus=b.antivirus,
        )
        _ok(f"bucket {b.id} ({b.max_size_mb}MB, {'public read' if b.public_read else 'server-only'})")
    except AppwriteException as e:
        if _is_conflict(e):
            _same(f"bucket {b.id}")
        else:
            _err(f"bucket {b.id}: {e.message}")


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(description="Provision the SPORTiX Appwrite schema (idempotent).")
    ap.add_argument("--timeout", type=int, default=180,
                    help="seconds to wait per collection for attributes to become available")
    ap.add_argument("--only", metavar="COLLECTION_ID",
                    help="provision a single collection (for iterating on one table)")
    args = ap.parse_args()

    if settings.appwrite_api_key in ("", "your_api_key_with_all_scopes"):
        print("[x] APPWRITE_API_KEY is unset or still the placeholder in sportix-backend/.env")
        print("    Create a server API key with full scopes in the Appwrite console")
        print("    (Overview -> Integrations -> API Keys) and set APPWRITE_API_KEY.")
        return 2

    print(f"Endpoint : {settings.appwrite_endpoint}")
    print(f"Project  : {settings.appwrite_project_id}")
    print(f"Schema   : {summary()}")
    if ADJUSTMENTS:
        print(f"\n{len(ADJUSTMENTS)} spec reconciliations (required+default is invalid in Appwrite):")
        for a in ADJUSTMENTS:
            print(f"  - {a}")
    print()

    ensure_database()

    targets = [c for c in COLLECTIONS if not args.only or c.id == args.only]
    if args.only and not targets:
        print(f"[x] no collection with id {args.only!r}")
        return 2

    for c in targets:
        print(f"\nCollection {c.id}  "
              f"(read={c.read}, document_security={c.doc_security}, "
              f"{len(c.all_attrs)} attrs, {len(c.indexes)} indexes)")
        if not ensure_collection(c):
            continue
        for a in c.all_attrs:
            ensure_attribute(c, a)
        if c.indexes:
            if wait_for_attributes(c, args.timeout):
                for i in c.indexes:
                    ensure_index(c, i)
            else:
                print(f"  [!] skipping {len(c.indexes)} indexes for {c.id}: attributes not ready")

    if not args.only:
        print("\nStorage buckets")
        for b in BUCKETS:
            ensure_bucket(b)

    print(f"\n{'-' * 62}")
    print(f"created {created}   exists {existed}   failed {failed}")
    if failed:
        print("PROVISION INCOMPLETE -- see [x] lines above")
        return 1
    print("PROVISION OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
