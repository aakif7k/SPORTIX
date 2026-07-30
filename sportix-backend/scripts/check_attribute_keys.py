"""
Assert that every Appwrite attribute key the services use exists ON THE
COLLECTION IT IS USED AGAINST.

    python -m scripts.check_attribute_keys [-v]

A grep for camelCase only proves the *shape* of a key. It cannot tell you that
`participants_count` should be `current_participants`, or that
`event_participants` has no `status` column even though other collections do.
Appwrite punishes those two cases asymmetrically: a bad key in a write is a loud
400, but a bad key in Query.equal silently matches zero documents. That is how
the feed, search and Pulse reads all came to return empty rather than fail.

So this resolves the target collection for each db call -- following
`settings.collection_x` references and module-level aliases like
`COLL = settings.collection_user_levels` -- and validates each key against that
collection's attributes only.

Keys that are not database attributes at all are listed in
ALLOWED_NON_ATTRIBUTES with a reason.
"""
from __future__ import annotations

import argparse
import ast
import pathlib
import sys

from app.core.config import settings
from scripts.schema import COLLECTIONS

SYSTEM = {"$id", "$createdAt", "$updatedAt", "$permissions", "$collectionId",
          "$databaseId", "$sequence"}

# Not Appwrite attributes. Each entry needs a reason.
ALLOWED_NON_ATTRIBUTES = {
    # Keys inside the stats_data JSON blob, produced by the frontend stat forms.
    "goals", "assists", "passes", "tackles", "saves",
    "runs", "wickets", "catches",
    "points", "rebounds", "steals", "blocks",
    "contribution", "personalBest", "positionFinished",
}

ATTRS = {c.id: {a.key for a in c.all_attrs} | SYSTEM for c in COLLECTIONS}

# settings attribute name -> collection id, e.g. collection_events -> "events"
SETTING_TO_COLLECTION = {
    name: value
    for name, value in settings.model_dump().items()
    if name.startswith("collection_") and isinstance(value, str)
}

DB_WRITE_CALLS = {"create_document", "update_document"}
DB_READ_CALLS = {"list_documents", "get_document", "delete_document"}


class Checker(ast.NodeVisitor):
    def __init__(self, path: pathlib.Path):
        self.path = str(path).replace("\\", "/")
        self.aliases: dict[str, str] = {}      # local name -> collection id
        self.problems: list[str] = []
        self.checked = 0
        self.unresolved: list[str] = []

    # ── resolving which collection a call targets ────────────────────────────
    def _collection_of(self, node: ast.AST) -> str | None:
        # settings.collection_events
        if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
            if node.value.id == "settings":
                return SETTING_TO_COLLECTION.get(node.attr)
        # a module-level alias assigned from settings.collection_*
        if isinstance(node, ast.Name):
            return self.aliases.get(node.id)
        # a bare string literal
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return node.value if node.value in ATTRS else None
        return None

    def visit_Assign(self, node: ast.Assign) -> None:
        """Record `COLL = settings.collection_user_levels` style aliases."""
        resolved = self._collection_of(node.value)
        if resolved:
            for target in node.targets:
                if isinstance(target, ast.Name):
                    self.aliases[target.id] = resolved
        self.generic_visit(node)

    # ── collecting keys ─────────────────────────────────────────────────────
    def _keys_in_queries(self, node: ast.AST) -> list[tuple[int, str]]:
        out = []
        for sub in ast.walk(node):
            if (isinstance(sub, ast.Call) and isinstance(sub.func, ast.Attribute)
                    and isinstance(sub.func.value, ast.Name)
                    and sub.func.value.id in ("Q", "Query") and sub.args):
                first = sub.args[0]
                if isinstance(first, ast.Constant) and isinstance(first.value, str):
                    out.append((sub.lineno, first.value))
        return out

    @staticmethod
    def _serialised_dicts(node: ast.AST) -> set[int]:
        """
        Dict literals that are being serialised to a string, e.g.
        json.dumps({...}). Their keys are blob contents stored inside a single
        string column, not attribute names, so they must not be validated.
        """
        excluded: set[int] = set()
        for sub in ast.walk(node):
            if (isinstance(sub, ast.Call) and isinstance(sub.func, ast.Attribute)
                    and sub.func.attr in ("dumps", "dump")):
                for inner in ast.walk(sub):
                    if isinstance(inner, ast.Dict):
                        excluded.add(id(inner))
        return excluded

    def _keys_in_dicts(self, node: ast.AST) -> list[tuple[int, str]]:
        excluded = self._serialised_dicts(node)
        out = []
        for sub in ast.walk(node):
            if isinstance(sub, ast.Dict) and id(sub) not in excluded:
                for k in sub.keys:
                    if isinstance(k, ast.Constant) and isinstance(k.value, str):
                        out.append((getattr(k, "lineno", sub.lineno), k.value))
        return out

    def visit_Call(self, node: ast.Call) -> None:
        if isinstance(node.func, ast.Attribute) and node.func.attr in (DB_WRITE_CALLS | DB_READ_CALLS):
            args = list(node.args)
            kw = {k.arg: k.value for k in node.keywords if k.arg}

            # signature is (database_id, collection_id, ...)
            coll_node = args[1] if len(args) > 1 else kw.get("collection_id")
            collection = self._collection_of(coll_node) if coll_node is not None else None

            keys: list[tuple[int, str]] = []
            if "queries" in kw:
                keys += self._keys_in_queries(kw["queries"])
            for a in args[2:]:
                keys += self._keys_in_dicts(a)
            for name in ("data", "queries"):
                if name in kw and name != "queries":
                    keys += self._keys_in_dicts(kw[name])
            if "data" in kw:
                keys += self._keys_in_dicts(kw["data"])

            if collection is None and keys:
                self.unresolved.append(
                    f"{self.path}:{node.lineno}: cannot resolve target collection "
                    f"({len(keys)} key(s) unchecked)"
                )
            elif collection:
                valid = ATTRS.get(collection, set())
                for lineno, key in keys:
                    self.checked += 1
                    if key in ALLOWED_NON_ATTRIBUTES or key in valid:
                        continue
                    hint = ""
                    elsewhere = sorted(c for c, a in ATTRS.items() if key in a)
                    if elsewhere:
                        hint = f" (exists on: {', '.join(elsewhere[:3])})"
                    self.problems.append(
                        f"{self.path}:{lineno}: {collection!r} has no attribute "
                        f"{key!r}{hint}"
                    )
        self.generic_visit(node)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("-v", "--verbose", action="store_true",
                    help="also list db calls whose collection could not be resolved")
    args = ap.parse_args()

    problems: list[str] = []
    unresolved: list[str] = []
    checked = 0

    # Routers are scanned too: a db call in a router is just as capable of
    # naming a column that does not exist, and one auth_uid site survived an
    # earlier sweep precisely because only services were checked.
    targets = [p for d in ("app/services", "app/routers", "app/core", "app/utils")
               for p in sorted(pathlib.Path(d).rglob("*.py"))]
    for path in targets:
        c = Checker(path)
        c.visit(ast.parse(path.read_text(encoding="utf-8")))
        problems += c.problems
        unresolved += c.unresolved
        checked += c.checked

    if args.verbose and unresolved:
        print(f"{len(unresolved)} db call(s) with an unresolvable collection:")
        for u in unresolved:
            print(f"  [?] {u}")
        print()

    if problems:
        print(f"WRONG ATTRIBUTE KEYS -- {len(problems)} problem(s):\n")
        for p in problems:
            print(f"  [x] {p}")
        print(f"\nChecked {checked} key uses across {len(COLLECTIONS)} collections.")
        print("Fix the key, add the attribute to scripts/schema.py, or add it to "
              "ALLOWED_NON_ATTRIBUTES with a reason.")
        return 1

    print(f"ATTRIBUTE KEYS OK -- {checked} key uses validated against their own "
          f"collection ({len(COLLECTIONS)} collections)")
    if unresolved:
        print(f"note: {len(unresolved)} db call(s) had an unresolvable collection; "
              f"re-run with -v to list them")
    return 0


if __name__ == "__main__":
    sys.exit(main())
