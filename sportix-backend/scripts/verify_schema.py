"""
Assert the live Appwrite schema matches scripts.schema exactly.

    python -m scripts.verify_schema [--json]

Reads collection metadata from Appwrite and checks, per collection:
  - the collection exists
  - client create/update/delete is granted to nobody
  - every attribute exists with the expected type, size, required flag,
    array flag, enum elements and default
  - every index exists with the expected type, attributes and order
  - the three buckets exist with the expected limits, extensions and access

Prints `SCHEMA OK -- <summary>` and exits 0, or a precise per-difference diff
and exits 1. Output is ASCII-only for the cp1252 Windows console.
"""
from __future__ import annotations

import argparse
import json
import sys

from appwrite.exception import AppwriteException

from app.core.appwrite import db, storage_svc, DB_ID
from app.core.config import settings
from scripts.schema import BUCKETS, COLLECTIONS, Attr, Collection, summary

# schema kind -> the (type, format) pair Appwrite actually reports back.
# Read off a live attribute of each kind rather than assumed: note that datetime
# is its own top-level type with an empty format, while url/email/enum are
# strings distinguished by format.
EXPECTED_TYPE = {
    "string": ("string", None),
    "enum": ("string", "enum"),
    "int": ("integer", None),
    "float": ("double", None),
    "bool": ("boolean", None),
    "datetime": ("datetime", None),
    "url": ("string", "url"),
    "email": ("string", "email"),
}

diffs: list[str] = []


def bad(msg: str) -> None:
    diffs.append(msg)


def check_attribute(c: Collection, want: Attr, live: dict) -> None:
    where = f"{c.id}.{want.key}"
    exp_type, exp_format = EXPECTED_TYPE[want.kind]

    if live.get("type") != exp_type:
        bad(f"{where}: type is {live.get('type')!r}, expected {exp_type!r}")
    if exp_format and live.get("format") != exp_format:
        bad(f"{where}: format is {live.get('format')!r}, expected {exp_format!r}")
    if bool(live.get("required")) != want.required:
        bad(f"{where}: required is {bool(live.get('required'))}, expected {want.required}")
    if bool(live.get("array")) != want.array:
        bad(f"{where}: array is {bool(live.get('array'))}, expected {want.array}")
    if live.get("status") != "available":
        bad(f"{where}: status is {live.get('status')!r}, expected 'available'")

    # size applies to plain strings only; enum/datetime/url/email are sized by Appwrite
    if want.kind == "string" and want.size is not None:
        if live.get("size") != want.size:
            bad(f"{where}: size is {live.get('size')}, expected {want.size}")

    if want.kind == "enum":
        if sorted(live.get("elements") or []) != sorted(want.elements or []):
            bad(f"{where}: elements are {live.get('elements')}, expected {want.elements}")

    live_default = live.get("default")
    if want.default is None:
        if live_default not in (None, ""):
            bad(f"{where}: default is {live_default!r}, expected none")
    else:
        # Appwrite echoes numeric defaults back as numbers, booleans as booleans.
        if isinstance(want.default, bool):
            match = bool(live_default) == want.default
        elif isinstance(want.default, (int, float)):
            match = live_default is not None and float(live_default) == float(want.default)
        else:
            match = live_default == want.default
        if not match:
            bad(f"{where}: default is {live_default!r}, expected {want.default!r}")


def check_permissions(c: Collection, live: dict) -> None:
    perms = live.get("$permissions") or []
    writes = [p for p in perms if p.split("(")[0] in ("create", "update", "delete", "write")]
    if writes:
        bad(f"{c.id}: grants client writes {writes} -- no collection may be client-writable")

    reads = [p for p in perms if p.startswith("read(")]
    if c.read == "users":
        if not any('users' in p for p in reads):
            bad(f"{c.id}: expected read(\"users\"), found {reads or 'none'}")
    else:
        if reads:
            bad(f"{c.id}: expected no client read, found {reads}")

    if bool(live.get("documentSecurity")) != c.doc_security:
        bad(f"{c.id}: documentSecurity is {bool(live.get('documentSecurity'))}, "
            f"expected {c.doc_security}")


def verify_collection(c: Collection) -> None:
    try:
        live = db.get_collection(DB_ID, c.id)
    except AppwriteException as e:
        bad(f"{c.id}: collection missing ({e.message})")
        return

    check_permissions(c, live)

    live_attrs = {a["key"]: a for a in live.get("attributes", [])}
    for want in c.all_attrs:
        found = live_attrs.get(want.key)
        if found is None:
            bad(f"{c.id}.{want.key}: attribute missing")
            continue
        check_attribute(c, want, found)

    extra_attrs = sorted(set(live_attrs) - {a.key for a in c.all_attrs})
    if extra_attrs:
        bad(f"{c.id}: undeclared attributes present: {', '.join(extra_attrs)}")

    live_idx = {i["key"]: i for i in live.get("indexes", [])}
    for want_i in c.indexes:
        found_i = live_idx.get(want_i.key)
        if found_i is None:
            bad(f"{c.id}.{want_i.key}: index missing "
                f"({want_i.type} on {'+'.join(want_i.attributes)})")
            continue
        if found_i.get("type") != want_i.type:
            bad(f"{c.id}.{want_i.key}: index type is {found_i.get('type')!r}, "
                f"expected {want_i.type!r}")
        if list(found_i.get("attributes") or []) != want_i.attributes:
            bad(f"{c.id}.{want_i.key}: index attributes are {found_i.get('attributes')}, "
                f"expected {want_i.attributes}")
        if want_i.orders:
            live_orders = [o for o in (found_i.get("orders") or []) if o]
            if [o.upper() for o in live_orders] != [o.upper() for o in want_i.orders]:
                bad(f"{c.id}.{want_i.key}: index orders are {found_i.get('orders')}, "
                    f"expected {want_i.orders}")

    extra_idx = sorted(set(live_idx) - {i.key for i in c.indexes})
    if extra_idx:
        bad(f"{c.id}: undeclared indexes present: {', '.join(extra_idx)}")


def verify_buckets() -> None:
    for b in BUCKETS:
        try:
            live = storage_svc.get_bucket(b.id)
        except AppwriteException as e:
            bad(f"bucket {b.id}: missing ({e.message})")
            continue

        expected_bytes = b.max_size_mb * 1024 * 1024
        if live.get("maximumFileSize") != expected_bytes:
            bad(f"bucket {b.id}: maximumFileSize is {live.get('maximumFileSize')}, "
                f"expected {expected_bytes}")
        if sorted(live.get("allowedFileExtensions") or []) != sorted(b.extensions):
            bad(f"bucket {b.id}: extensions are {live.get('allowedFileExtensions')}, "
                f"expected {b.extensions}")

        perms = live.get("$permissions") or []
        writes = [p for p in perms if p.split("(")[0] in ("create", "update", "delete", "write")]
        if writes:
            bad(f"bucket {b.id}: grants client writes {writes} -- uploads must go through FastAPI")
        has_any_read = any(p.startswith("read(") and "any" in p for p in perms)
        if b.public_read and not has_any_read:
            bad(f"bucket {b.id}: expected read(\"any\"), found {perms or 'none'}")
        if not b.public_read and has_any_read:
            bad(f"bucket {b.id}: must NOT grant read(\"any\") -- proofs are server-mediated")


def main() -> int:
    ap = argparse.ArgumentParser(description="Verify the live Appwrite schema against scripts.schema.")
    ap.add_argument("--json", action="store_true", help="emit the diff list as JSON")
    args = ap.parse_args()

    if settings.appwrite_api_key in ("", "your_api_key_with_all_scopes"):
        print("[x] APPWRITE_API_KEY is unset or still the placeholder in sportix-backend/.env")
        return 2

    for c in COLLECTIONS:
        verify_collection(c)
    verify_buckets()

    if args.json:
        print(json.dumps({"ok": not diffs, "diffs": diffs}, indent=2))
        return 1 if diffs else 0

    if diffs:
        print(f"SCHEMA MISMATCH -- {len(diffs)} difference(s):\n")
        for d in diffs:
            print(f"  [x] {d}")
        print(f"\nExpected: {summary()}")
        print("Run `python -m scripts.provision_appwrite` to create anything missing.")
        return 1

    print(f"SCHEMA OK -- {summary()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
