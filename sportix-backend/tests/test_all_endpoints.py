"""
Every route in the app is exercised and must not return 5xx.

Generated from app.routes rather than hand-written, for two reasons: a
hand-maintained list drifts the moment someone adds a route, and the bugs this
phase fixed were mostly in endpoints no test had ever called -- five of them
raised AttributeError and returned 500 while the suite stayed green.

What this does and does not prove:
  - it DOES prove every route is wired, its dependencies resolve, its service
    functions exist, and it can build a response without raising.
  - it does NOT prove the response is semantically correct. Appwrite is mocked, so
    business assertions live in the focused tests and in scripts/smoke.py, which
    runs against a real project.

4xx is an acceptable outcome: a made-up path parameter legitimately produces a
404, and a synthetic body may fail validation with a 422. Only 5xx is a failure,
because that means the handler itself broke.
"""
from __future__ import annotations

from typing import Any

import pytest
from fastapi.routing import APIRoute

from main import app

# Plausible values for path parameters, keyed by name.
PATH_VALUES: dict[str, str] = {
    "user_id": "user123",
    "target_user_id": "user456",
    "post_id": "post123",
    "comment_id": "comment123",
    "story_id": "story123",
    "reel_id": "reel123",
    "event_id": "event123",
    "squad_id": "squad123",
    "match_id": "match123",
    "stat_id": "stat123",
    "mission_id": "mission123",
    "notification_id": "notif123",
    "request_id": "req123",
    "username": "testplayer",
    "sport": "football",
}

# Minimal valid bodies for the endpoints that require one. Anything absent gets an
# empty body and is allowed to 422.
BODIES: dict[tuple[str, str], dict[str, Any]] = {
    ("POST", "/api/auth/register"): {
        "email": "new@sportix.com", "password": "supersecret1", "full_name": "New Player",
        "username": "newplayer", "role": "athlete", "sport": "football",
        "sports": ["football"], "experience_level": "amateur",
        "location": "Berlin", "city": "Berlin",
    },
    ("POST", "/api/auth/login"): {"email": "player@sportix.com", "password": "supersecret1"},
    ("POST", "/api/auth/forgot-password"): {"email": "player@sportix.com"},
    ("PUT", "/api/auth/change-password"): {
        "old_password": "supersecret1", "new_password": "evenmoresecret2",
    },
    ("POST", "/api/posts/"): {"content": "A test post", "media_type": "none", "post_type": "general"},
    ("POST", "/api/posts/{post_id}/comments"): {"content": "A test comment"},
    ("PUT", "/api/posts/{post_id}"): {"content": "An edited post"},
    ("POST", "/api/stories/"): {"media_url": "https://example.com/s.jpg", "media_type": "image"},
    ("POST", "/api/reels/"): {
        "video_url": "https://example.com/v.mp4", "caption": "A reel",
    },
    ("POST", "/api/squads/"): {"name": "Test Squad", "sport": "football"},
    ("POST", "/api/matches/"): {"sport": "football"},
    ("POST", "/api/matches/{match_id}/stats"): {
        "match_id": "match123", "sport": "football",
        "stats_data": {"goals": 2}, "match_rating": 8.0, "is_mvp": False,
    },
    ("POST", "/api/matches/{match_id}/validate/{stat_id}"): {"vote": "confirm"},
    ("POST", "/api/matches/{match_id}/retention"): {"target_id": "user456", "vote": "definitely"},
    ("POST", "/api/autosquad/generate"): {
        "sport": "football", "entry_type": "squad", "skill_level": "amateur",
    },
    ("POST", "/api/coins/award"): {"amount": 10, "reason": "test"},
    ("POST", "/api/coins/spend"): {"amount": 5, "reason": "test"},
}


def _routes() -> list[tuple[str, str]]:
    """(method, path_template) for every real API route, excluding docs."""
    out = []
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        for method in sorted(route.methods - {"HEAD", "OPTIONS"}):
            out.append((method, route.path))
    return sorted(set(out))


ROUTES = _routes()


def _concrete(path: str) -> str:
    for name, value in PATH_VALUES.items():
        path = path.replace(f"{{{name}}}", value)
    # Any parameter without a registered value still needs filling.
    while "{" in path:
        start = path.index("{")
        end = path.index("}", start)
        path = path[:start] + "placeholder" + path[end + 1:]
    return path


def test_route_table_is_complete():
    """The app should expose the documented surface, not a subset of it."""
    assert len(ROUTES) >= 122, f"only {len(ROUTES)} routes registered, expected >= 122"


@pytest.mark.parametrize("method,path", ROUTES, ids=[f"{m} {p}" for m, p in ROUTES])
def test_endpoint_does_not_500(client, method, path):
    url = _concrete(path)
    body = BODIES.get((method, path))

    if method == "GET":
        response = client.get(url)
    elif method == "DELETE":
        response = client.delete(url)
    elif method == "POST":
        response = client.post(url, json=body if body is not None else {})
    elif method == "PUT":
        response = client.put(url, json=body if body is not None else {})
    elif method == "PATCH":
        response = client.patch(url, json=body if body is not None else {})
    else:
        pytest.skip(f"unhandled method {method}")

    assert response.status_code < 500, (
        f"{method} {path} returned {response.status_code}\n{response.text[:600]}"
    )


@pytest.mark.parametrize("method,path", ROUTES, ids=[f"{m} {p}" for m, p in ROUTES])
def test_error_responses_use_the_standard_envelope(client, method, path):
    """Any 4xx must carry success:false, an error code, and a request id."""
    url = _concrete(path)
    body = BODIES.get((method, path))
    fn = {"GET": client.get, "DELETE": client.delete}.get(method)
    response = fn(url) if fn else getattr(client, method.lower())(
        url, json=body if body is not None else {}
    )

    if response.status_code < 400:
        return
    payload = response.json()
    assert payload.get("success") is False, f"{method} {path}: {payload}"
    assert payload["error"]["code"], f"{method} {path}: error.code is empty"
    assert payload.get("request_id"), f"{method} {path}: no request_id"
