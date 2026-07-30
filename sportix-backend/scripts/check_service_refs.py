"""
Assert that every service function a router calls actually exists, and that every
create_document supplies the required created_at.

    python -m scripts.check_service_refs

Two failure modes this catches, both of which shipped in this codebase:

  1. A router calling a function nobody wrote. auth.py referenced
     auth_service.login_user, send_reset_email and change_password, and
     settings.py referenced delete_account, while none of the four existed --
     so four endpoints raised AttributeError and returned 500. Nothing in the
     test suite noticed, because nothing called them.

  2. A create_document without created_at. The canonical schema makes created_at
     required on every collection, so any write that omits it is rejected with a
     400 at runtime. Import-time checks cannot see this; a static pass can.
"""
from __future__ import annotations

import ast
import importlib
import pathlib
import sys

# Writes where created_at is legitimately absent, with a reason.
CREATED_AT_EXEMPT = {
    # None currently: every collection in the schema requires created_at.
}


def check_service_references() -> tuple[list[str], int]:
    problems: list[str] = []
    checked = 0
    for path in sorted(pathlib.Path("app/routers").rglob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if not (isinstance(node, ast.Attribute)
                    and isinstance(node.value, ast.Name)
                    and node.value.id.endswith("_service")):
                continue
            checked += 1
            module_name = f"app.services.{node.value.id}"
            try:
                module = importlib.import_module(module_name)
            except ModuleNotFoundError:
                problems.append(f"{path.as_posix()}:{node.lineno}: no module {module_name}")
                continue
            if not hasattr(module, node.attr):
                problems.append(
                    f"{path.as_posix()}:{node.lineno}: "
                    f"{node.value.id}.{node.attr}() does not exist"
                )
    return sorted(set(problems)), checked


def check_created_at() -> tuple[list[str], int]:
    """Every create_document literal must carry created_at."""
    problems: list[str] = []
    checked = 0
    targets = [p for d in ("app/services", "app/routers", "app/utils")
               for p in sorted(pathlib.Path(d).rglob("*.py"))]

    for path in targets:
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if not (isinstance(node, ast.Call)
                    and isinstance(node.func, ast.Attribute)
                    and node.func.attr == "create_document"):
                continue

            # The payload is the last positional arg or the `data` keyword.
            payload = None
            for kw in node.keywords:
                if kw.arg == "data":
                    payload = kw.value
            if payload is None and len(node.args) >= 4:
                payload = node.args[3]
            if payload is None and len(node.args) == 3:
                payload = node.args[2]

            if not isinstance(payload, ast.Dict):
                # Built elsewhere (a variable or a comprehension); not statically
                # checkable, so it is skipped rather than guessed at.
                continue

            checked += 1
            keys = {k.value for k in payload.keys
                    if isinstance(k, ast.Constant) and isinstance(k.value, str)}
            has_spread = any(k is None for k in payload.keys)   # {**something}
            if "created_at" in keys or has_spread:
                continue
            location = f"{path.as_posix()}:{node.lineno}"
            if location in CREATED_AT_EXEMPT:
                continue
            problems.append(f"{location}: create_document without created_at")
    return sorted(set(problems)), checked


def main() -> int:
    ref_problems, refs_checked = check_service_references()
    ca_problems, ca_checked = check_created_at()

    if ref_problems:
        print(f"UNRESOLVED SERVICE REFERENCES -- {len(ref_problems)}:\n")
        for p in ref_problems:
            print(f"  [x] {p}")
        print()
    else:
        print(f"ALL SERVICE REFERENCES RESOLVE ({refs_checked} checked)")

    if ca_problems:
        print(f"\nMISSING created_at -- {len(ca_problems)}:\n")
        for p in ca_problems:
            print(f"  [x] {p}")
        print("\ncreated_at is required on every collection, so these writes are "
              "rejected at runtime. Use app.utils.formatters.now_iso().")
    else:
        print(f"ALL create_document CALLS SET created_at ({ca_checked} literal payloads)")

    return 1 if (ref_problems or ca_problems) else 0


if __name__ == "__main__":
    sys.exit(main())
