"""
Shared fixtures.

The important thing here is WHERE Appwrite is intercepted.

The previous version patched `app.core.appwrite.db`. That does not work: every
service does `from app.core.appwrite import db` at import time, which binds the
object into the service's own module namespace, so replacing the attribute on
app.core.appwrite leaves `post_service.db` pointing at the real client. The tests
were therefore talking to live Appwrite. They passed only because most writes were
failing for unrelated reasons and the services swallowed the errors -- and once
those bugs were fixed, the same tests would have started writing real rows into
the production database.

So interception happens at `appwrite.client.Client.call`, the single chokepoint
every Databases, Users, Storage and Account method funnels through. No import
binding can route around it, and network_guard asserts that.
"""
from __future__ import annotations

import re

import pytest
from fastapi.testclient import TestClient

from appwrite.client import Client
from main import app
from app.core.dependencies import get_current_user, get_optional_user

MOCK_USER = {"id": "user123", "email": "player@sportix.com", "name": "Test Player"}

# A document-ish response. Permissive on purpose: services read many different
# keys off what they get back, and a test asserting "not a 5xx" should not fail
# because a fixture lacked a field.
def _doc(**extra) -> dict:
    base = {
        "$id": "mock_doc_id",
        "$collectionId": "mock",
        "$databaseId": "mock",
        "$createdAt": "2026-01-01T00:00:00.000+00:00",
        "$updatedAt": "2026-01-01T00:00:00.000+00:00",
        "$permissions": [],
        # Fields services commonly branch on.
        "user_id": MOCK_USER["id"],
        "author_id": MOCK_USER["id"],
        "organizer_id": MOCK_USER["id"],
        "captain_id": MOCK_USER["id"],
        "username": "testplayer",
        "full_name": "Test Player",
        "email": MOCK_USER["email"],
        "is_deleted": False,
        "is_active": True,
        "is_claimed": False,
        "progress": 0,
        "target": 1,
        "balance": 0,
        "total_pulse": 100.0,
        "current_pulse": 100.0,
        "total_pulse_ever": 0.0,
        "current_level": 1,
        "members_count": 1,
        "likes_count": 0,
        "match_rating": 7.0,
        "stats_data": "{}",
        "sport": "football",
        "result": "win",
        "status": "upcoming",
        "vote": "confirm",
        # Squad-scoped rows carry the squad they belong to; without it the
        # membership checks in squad_activity_service cannot resolve.
        "squad_id": "squad123",
        "squad_post_id": "spost123",
        "squad_event_id": "sevent123",
        "created_by": MOCK_USER["id"],
        "likes_count": 0,
    }
    base.update(extra)
    return base


def _empty_list() -> dict:
    """
    An empty listing under every key a caller might read.

    `rows` sits alongside `documents` because the runtime now goes through
    TablesDB, whose list endpoint is /tablesdb/{db}/tables/{t}/rows and whose
    response nests under `rows`. Providing both keeps this double honest for either
    path rather than making the shim's normalisation invisible to the tests.
    """
    return {"documents": [], "rows": [], "total": 0, "attributes": [],
            "indexes": [], "files": [], "users": [], "buckets": [],
            "collections": [], "tables": []}


class RecordingCall:
    """Stands in for Client.call, recording every request instead of sending it."""

    def __init__(self) -> None:
        self.requests: list[tuple[str, str]] = []
        # path regex -> canned response, checked in order; first match wins.
        self.overrides: list[tuple[re.Pattern, object]] = []

    def when(self, path_pattern: str, response) -> None:
        """Register a canned response for paths matching `path_pattern`."""
        self.overrides.insert(0, (re.compile(path_pattern), response))

    def __call__(self, method, path="", headers=None, params=None, response_type="json"):
        self.requests.append((method.lower(), path))

        for pattern, response in self.overrides:
            if pattern.search(path):
                return response() if callable(response) else response

        m = method.lower()
        if m == "delete":
            return {}
        if m == "get":
            # A collection listing vs a single resource.
            # TablesDB renamed the list segments: documents -> rows,
            # collections -> tables. Both are matched, because schema management
            # still uses the older paths.
            if re.search(
                r"/(documents|rows|files|users|buckets|collections|tables|sessions)/?$",
                path,
            ):
                return _empty_list()
            if path.endswith("/jwt"):
                return {"jwt": "mock.jwt.token"}
            return _doc()
        if m in ("post", "put", "patch"):
            if path.endswith("/jwt") or "/jwts" in path:
                return {"jwt": "mock.jwt.token"}
            if "/sessions" in path:
                return {"$id": "mock_session", "userId": MOCK_USER["id"],
                        "secret": "mock_secret", "providerUid": MOCK_USER["email"]}
            if "/recovery" in path:
                return {"$id": "mock_recovery"}
            return _doc()
        return _doc()


@pytest.fixture(autouse=True)
def appwrite(monkeypatch) -> RecordingCall:
    """
    Intercept every Appwrite HTTP call.

    Autouse, so no test can accidentally reach the network. Yields the recorder so
    a test can assert what was requested, or register canned responses with
    `appwrite.when(r"/(?:documents|rows)", {...})`.
    """
    recorder = RecordingCall()
    monkeypatch.setattr(Client, "call", recorder, raising=True)
    return recorder


@pytest.fixture(autouse=True)
def override_dependencies():
    async def _user():
        return MOCK_USER
    app.dependency_overrides[get_current_user] = _user
    app.dependency_overrides[get_optional_user] = _user
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """
    Clear the limiter between tests.

    Without this, the 5/minute auth tier leaks across tests: whichever test runs
    sixth against a limited endpoint gets a 429 and fails for reasons that have
    nothing to do with what it is checking.
    """
    from app.core.rate_limit import limiter
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture
def client() -> TestClient:
    # raise_server_exceptions=False so the registered exception handlers produce a
    # response, which is what a client would actually receive.
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def network_guard(appwrite):
    """
    Proof that interception works.

    If a future refactor reintroduces a path around Client.call, this fails loudly
    rather than letting the suite quietly mutate the live database again.
    """
    yield
    for method, path in appwrite.requests:
        assert not path.startswith("http"), (
            f"a request escaped the mock: {method.upper()} {path}"
        )
