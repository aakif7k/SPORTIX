"""
Assert that no write endpoint takes its payload as query parameters.

    python -m scripts.check_request_bodies

FastAPI decides where a parameter comes from by its type: a scalar with no
Query/Path/Body marker becomes a query parameter, a pydantic model becomes the
request body. So a handler written as

    @router.post("/")
    async def create_match(sport: str = "", home_squad_id: str | None = None): ...

silently ignores a JSON body. The client sends the right data, the endpoint
returns 201, and the row is written with defaults. Nothing fails loudly.

This was found six times during the events and squads work and fixed each time by
hand, and then POST /api/matches/ turned out to have exactly the same shape — a
match created through the documented API had no squad and no sport, which made a
squad's match history permanently empty. One-at-a-time fixes were not going to
find the rest, so this checks all of them at once.

A scalar on a write route is allowed only when it is explicitly declared:
  * part of the path (a Path parameter, or named in the route's own path string)
  * marked Query(...), which says the author meant a query string
  * a dependency, e.g. user=Depends(get_current_user)
  * pagination and other read-ish modifiers on a write route are still flagged,
    because those belong on GETs.
"""
from __future__ import annotations

import ast
import pathlib
import re
import sys

ROUTERS = pathlib.Path(__file__).resolve().parents[1] / "app" / "routers"

WRITE_METHODS = {"post", "put", "patch", "delete"}

# Names that are wiring rather than payload.
INFRASTRUCTURE = {"request", "response", "user", "background_tasks"}

# Markers that make the author's intent explicit.
EXPLICIT_SOURCES = {"Query", "Path", "Body", "Form", "File", "UploadFile", "Depends", "Header",
                    "Cookie", "Security"}


def _decorator_route(node: ast.AST) -> tuple[str, str] | None:
    """(method, path) if this decorator is a router write, else None."""
    if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Attribute):
        return None
    method = node.func.attr.lower()
    if method not in WRITE_METHODS:
        return None
    target = node.func.value
    if not (isinstance(target, ast.Name) and target.id == "router"):
        return None
    path = ""
    if node.args and isinstance(node.args[0], ast.Constant):
        path = str(node.args[0].value)
    return method, path


def _source_of(annotation: ast.AST | None, default: ast.AST | None) -> str | None:
    """The explicit parameter source, if the author gave one."""
    for node in (default, annotation):
        if node is None:
            continue
        for sub in ast.walk(node):
            if isinstance(sub, ast.Call) and isinstance(sub.func, ast.Name) \
                    and sub.func.id in EXPLICIT_SOURCES:
                return sub.func.id
            if isinstance(sub, ast.Name) and sub.id in EXPLICIT_SOURCES:
                return sub.id
    return None


# FastAPI reads any non-scalar annotation from the body without a marker, so a
# `payload: dict` handler is already correct and must not be reported.
BODY_SHAPED = {"dict", "list", "Dict", "List", "set", "tuple"}


def _is_model(annotation: ast.AST | None) -> bool:
    """
    True when FastAPI will read this parameter from the request body: a pydantic
    model, or any non-scalar container.
    """
    if annotation is None:
        return False
    node = annotation
    if isinstance(node, ast.Subscript):  # Optional[Model], Dict[str, Any]
        if isinstance(node.value, ast.Name) and node.value.id in BODY_SHAPED:
            return True
        return any(_is_model(child) for child in ast.walk(node.slice)
                   if isinstance(child, ast.Name))
    if isinstance(node, ast.Name):
        if node.id in BODY_SHAPED:
            return True
        return node.id[:1].isupper() and node.id not in {
            "Optional", "List", "Dict", "Any", "None", "Request", "Response",
            "UploadFile", "BackgroundTasks",
        }
    return False


def main() -> int:
    problems: list[str] = []
    checked = 0

    for path in sorted(ROUTERS.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))

        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue

            route = next(
                (r for r in (_decorator_route(d) for d in node.decorator_list) if r), None)
            if route is None:
                continue
            method, route_path = route
            checked += 1

            path_params = set(re.findall(r"\{(\w+)\}", route_path))
            args = node.args
            defaults: list[ast.AST | None] = (
                [None] * (len(args.args) - len(args.defaults)) + list(args.defaults))

            has_model = any(_is_model(a.annotation) for a in args.args)

            for arg, default in zip(args.args, defaults):
                name = arg.arg
                if name in path_params or name in INFRASTRUCTURE or name == "self":
                    continue
                if _source_of(arg.annotation, default):
                    continue
                if _is_model(arg.annotation):
                    continue

                where = f"{path.name}:{node.lineno} {method.upper()} {route_path}"
                hint = ("the body it declares is ignored"
                        if has_model else "any JSON body sent is ignored")
                problems.append(
                    f"  [x] {where}\n"
                    f"      `{name}` is an undeclared scalar, so FastAPI reads it from the "
                    f"query string;\n      {hint}. Move it into a request model, or mark it "
                    f"Query(...) if it truly belongs in the URL."
                )

    if problems:
        print(f"QUERY-PARAM PAYLOADS -- {len(problems)} problem(s):\n")
        print("\n".join(problems))
        return 1

    print(f"NO WRITE ENDPOINT TAKES ITS PAYLOAD FROM THE QUERY STRING "
          f"({checked} write routes checked)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
