"""
Assert the pydantic request models agree with the database columns.

    python -m scripts.check_schema_alignment

check_attribute_keys proves a key EXISTS on the collection it is written to. It
says nothing about whether the value will fit, and that gap hid a whole class of
bug: EventCreate accepted format values of duo/squad/open against a column that
takes solo/team/tournament/league, a skill_level defaulting to "casual" against a
five-level enum, `rules` as a string against a string[] column, and entry_fee and
prize_pool as floats against string(80). Creating an event through the documented
API could not succeed on any of six fields, and every static check still passed.

For each pydantic field whose name matches a column on the collection its model
writes to, this compares:
  - enum members, which must be a subset of the column's allowed values
  - list vs scalar, against the column's array flag
  - str vs numeric, against the column's kind

Models are mapped to collections explicitly below, because a schema module name
does not reliably imply one.
"""
from __future__ import annotations

import enum
import sys
import typing

from pydantic import BaseModel

from scripts.schema import COLLECTIONS

ATTRS = {c.id: {a.key: a for a in c.all_attrs} for c in COLLECTIONS}

# Fields the model takes as a dict and the service serialises into a string
# column with json.dumps. Legitimate — Appwrite has no JSON type — but it has to
# be declared, or a genuine dict/string mismatch would hide among them. Note that
# Dict[str, Any] previously slipped through this check by accident while a bare
# `dict` was caught, so the two are now treated identically.
SERIALISED_BLOBS: set[tuple[str, str]] = {
    ("squad_messages", "poll_data"),
    ("squad_messages", "tactical_data"),
    ("squad_messages", "announcement_data"),
    ("player_stats", "stats_data"),
    ("autosquad_requests", "params"),
    ("generated_squads", "squad_data"),
    ("profiles", "notification_prefs"),
    ("profiles", "privacy"),
    ("profiles", "sport_preferences"),
}

# model path -> the collection the service writes it to
MODEL_COLLECTIONS: list[tuple[str, str, str]] = [
    ("app.schemas.event", "EventCreate", "events"),
    ("app.schemas.event", "EventUpdate", "events"),
    ("app.schemas.post", "PostCreate", "posts"),
    ("app.schemas.post", "PostUpdate", "posts"),
    ("app.schemas.post", "ReelCreate", "reels"),
    ("app.schemas.post", "StoryCreate", "stories"),
    ("app.schemas.squad", "SquadCreate", "squads"),
    ("app.schemas.squad", "RoleUpdate", "squad_members"),
    ("app.schemas.match", "StatsSubmission", "player_stats"),
    ("app.schemas.user", "UserUpdate", "profiles"),
    ("app.schemas.squad", "SquadEventCreate", "squad_events"),
    ("app.schemas.squad", "SquadEventVote", "squad_event_votes"),
    ("app.schemas.squad", "SquadPostCreate", "squad_posts"),
    ("app.schemas.match", "MatchCreate", "matches"),
    ("app.schemas.event", "EventJoin", "event_participants"),
    ("app.schemas.message", "MessageCreate", "messages"),
    ("app.schemas.message", "SquadMessageCreate", "squad_messages"),
]


def _unwrap_optional(annotation):
    """Strip Optional[...] / X | None down to the inner type."""
    origin = typing.get_origin(annotation)
    if origin is typing.Union or str(origin) == "<class 'types.UnionType'>":
        args = [a for a in typing.get_args(annotation) if a is not type(None)]
        if len(args) == 1:
            return args[0]
    return annotation


def _is_list(annotation) -> bool:
    return typing.get_origin(_unwrap_optional(annotation)) in (list, set, tuple)


def _element(annotation):
    inner = _unwrap_optional(annotation)
    args = typing.get_args(inner)
    return args[0] if args else inner


def check_model(module_path: str, model_name: str, collection: str) -> list[str]:
    problems: list[str] = []
    module = __import__(module_path, fromlist=[model_name])
    model = getattr(module, model_name, None)
    if model is None or not issubclass(model, BaseModel):
        return [f"{module_path}.{model_name}: not a pydantic model"]

    columns = ATTRS.get(collection)
    if columns is None:
        return [f"{model_name}: unknown collection {collection!r}"]

    for field_name, field in model.model_fields.items():
        column = columns.get(field_name)
        if column is None:
            continue        # request-only field (event_date, is_ai_managed, ...)

        annotation = field.annotation
        where = f"{model_name}.{field_name} -> {collection}.{field_name}"

        # array vs scalar
        if _is_list(annotation) != column.array:
            problems.append(
                f"{where}: model is {'a list' if _is_list(annotation) else 'scalar'} "
                f"but the column is {'an array' if column.array else 'scalar'}"
            )
            continue

        target = _element(annotation) if column.array else _unwrap_optional(annotation)

        # A mapping stored as a JSON string.
        is_mapping = target is dict or typing.get_origin(target) is dict
        if is_mapping:
            if (collection, field_name) in SERIALISED_BLOBS:
                if column.kind != "string":
                    problems.append(
                        f"{where}: serialised as JSON but the column is "
                        f"{column.kind}, not string"
                    )
                continue
            problems.append(
                f"{where}: model is a mapping but the column is {column.kind}. "
                f"If the service json.dumps it, add it to SERIALISED_BLOBS."
            )
            continue

        # enum membership
        if isinstance(target, type) and issubclass(target, enum.Enum):
            values = {m.value for m in target}
            allowed = set(column.elements or [])
            if column.kind != "enum":
                problems.append(f"{where}: model is an enum but the column is {column.kind}")
            elif not values <= allowed:
                problems.append(
                    f"{where}: model allows {sorted(values - allowed)} which the column rejects "
                    f"(column accepts {sorted(allowed)})"
                )
            continue

        # a plain str where the column is an enum means unvalidated input
        if column.kind == "enum" and target is str:
            problems.append(
                f"{where}: model accepts any string, but the column only accepts "
                f"{sorted(column.elements or [])} -- use an Enum"
            )
            continue

        # scalar kind
        expected = {
            "string": (str,), "enum": (str,), "url": (str,), "email": (str,),
            "datetime": (str,), "int": (int,), "float": (int, float), "bool": (bool,),
        }.get(column.kind)
        if expected and isinstance(target, type) and target not in expected:
            # bool is a subclass of int in Python; only flag genuine mismatches.
            if not (column.kind in ("int", "float") and target is bool):
                problems.append(
                    f"{where}: model is {target.__name__} but the column is {column.kind}"
                )

    return problems


def main() -> int:
    problems: list[str] = []
    checked = 0
    for module_path, model_name, collection in MODEL_COLLECTIONS:
        try:
            problems += check_model(module_path, model_name, collection)
            checked += 1
        except (ImportError, AttributeError) as e:
            problems.append(f"{module_path}.{model_name}: {e}")

    if problems:
        print(f"SCHEMA MISALIGNMENT -- {len(problems)} problem(s):\n")
        for p in problems:
            print(f"  [x] {p}")
        print("\nA request the model accepts must be storable in the column it "
              "writes to, or the endpoint 400s at runtime for input it advertised.")
        return 1

    print(f"REQUEST MODELS ALIGNED -- {checked} models checked against their collections")
    return 0


if __name__ == "__main__":
    sys.exit(main())
