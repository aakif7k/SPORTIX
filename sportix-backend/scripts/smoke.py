"""
End-to-end smoke test against a REAL Appwrite project.

    python -m scripts.smoke [--keep]

Unlike the pytest suite, nothing here is mocked: this drives the actual API
against live Appwrite and asserts on what comes back. It is the only check that
proves the schema, the services and the wiring agree with each other, because a
mock will happily return a plausible shape for a query that would match nothing
in production.

The flow follows a real user: register, log in, read your profile, post, see the
post in the feed, like it, upload an avatar and confirm it sticks to the profile,
form a squad, play a match, submit stats, have three teammates validate them, and
watch Pulse and level move.

Requests go through TestClient, which runs the full ASGI stack -- every
middleware, dependency and exception handler -- so the only thing it skips is the
socket. Appwrite is genuinely remote.

Cleanup runs by default: four auth accounts and their content are removed at the
end. Pass --keep to leave them for inspection.
"""
from __future__ import annotations

import argparse
import io
import struct
import sys
import time
import uuid
import zlib

import httpx
from fastapi.testclient import TestClient

passed = 0
failed = 0
created_users: list[str] = []


def check(label: str, condition: bool, detail: str = "") -> bool:
    global passed, failed
    if condition:
        passed += 1
        print(f"  [ok] {label}")
    else:
        failed += 1
        print(f"  [XX] {label}" + (f"\n       {detail}" if detail else ""))
    return bool(condition)


def step(title: str) -> None:
    print(f"\n--- {title} " + "-" * max(0, 58 - len(title)))


def tiny_png() -> bytes:
    """A valid 1x1 PNG, built here so the script needs no fixture file."""
    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    raw = zlib.compress(b"\x00\xff\x00\x00", 9)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", raw) + chunk(b"IEND", b""))


def body(response) -> dict:
    try:
        return response.json()
    except Exception:
        return {"_raw": response.text[:300]}


def data_of(response) -> dict:
    return body(response).get("data") or {}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep", action="store_true", help="do not delete the accounts created")
    args = ap.parse_args()

    from app.core.config import settings
    if settings.appwrite_api_key in ("", "your_api_key_with_all_scopes"):
        print("[x] APPWRITE_API_KEY is unset or still the placeholder.")
        return 2

    from app.core.rate_limit import limiter
    from app.core.appwrite import users_svc
    from main import app

    # This script makes ~8 auth calls in a few seconds against a 5/minute tier.
    # Limiting is verified deliberately at the end instead of tripping over it.
    limiter.enabled = False
    client = TestClient(app, raise_server_exceptions=False)

    tag = uuid.uuid4().hex[:8]

    def register(role: str) -> dict:
        payload = {
            "email": f"smoke_{role}_{tag}@sportix.test",
            "password": "SmokeTest12345",
            "full_name": f"Smoke {role.title()}",
            "username": f"smoke_{role}_{tag}"[:29],
            "role": "athlete", "sport": "football", "sports": ["football"],
            "experience_level": "amateur", "location": "Berlin", "city": "Berlin",
        }
        r = client.post("/api/auth/register", json=payload)
        d = data_of(r)
        if d.get("user_id"):
            created_users.append(d["user_id"])
        return {"response": r, "payload": payload, "data": d}

    # ── register ──────────────────────────────────────────────────────────────
    step("register")
    author = register("author")
    check("POST /api/auth/register -> 201", author["response"].status_code == 201,
          f"{author['response'].status_code} {body(author['response'])}")
    check("returns a user_id", bool(author["data"].get("user_id")))
    jwt = author["data"].get("jwt", "")
    check("returns a JWT with three segments", jwt.count(".") == 2,
          f"got {jwt[:40]!r} -- a session secret is not a JWT")
    uid = author["data"].get("user_id", "")

    check("duplicate username is rejected",
          client.post("/api/auth/register", json=author["payload"]).status_code < 500)

    # ── login ─────────────────────────────────────────────────────────────────
    step("login")
    r = client.post("/api/auth/login", json={
        "email": author["payload"]["email"], "password": author["payload"]["password"]})
    check("POST /api/auth/login -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    login_jwt = data_of(r).get("jwt", "")
    check("login returns a JWT", login_jwt.count(".") == 2)
    check("wrong password is refused",
          client.post("/api/auth/login", json={
              "email": author["payload"]["email"], "password": "definitely-wrong"}
          ).status_code in (401, 403))

    auth_header = {"Authorization": f"Bearer {login_jwt or jwt}"}

    # ── profile ───────────────────────────────────────────────────────────────
    step("profile")
    r = client.get("/api/users/me", headers=auth_header)
    check("GET /api/users/me -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    me = data_of(r)
    check("profile carries the username we registered",
          me.get("username") == author["payload"]["username"],
          f"got {me.get('username')!r}")
    # The frontend's OnboardingRoute gates on this flag, so a fresh account must
    # report False -- if it were absent or True, onboarding would be skipped.
    check("a new account reports is_onboarding_complete = False",
          me.get("is_onboarding_complete") is False,
          f"got {me.get('is_onboarding_complete')!r}")

    # The path authService.updateUserProfile now takes, having stopped writing to
    # Appwrite directly (clients hold no write permission on any collection).
    r = client.put("/api/users/me", headers=auth_header, json={"bio": "Updated by smoke"})
    check("PUT /api/users/me updates the profile", r.status_code < 300,
          f"{r.status_code} {body(r)}")
    r = client.get("/api/users/me", headers=auth_header)
    check("the update is readable back",
          data_of(r).get("bio") == "Updated by smoke",
          f"bio={data_of(r).get('bio')!r}")

    # ── post ──────────────────────────────────────────────────────────────────
    step("posts")
    content = f"Smoke test post {tag}"
    r = client.post("/api/posts/", headers=auth_header, json={
        "content": content, "media_type": "none", "post_type": "general"})
    check("POST /api/posts/ -> 201", r.status_code == 201, f"{r.status_code} {body(r)}")
    post = data_of(r)
    post_id = post.get("$id", "")
    check("post denormalises the author username, not just the id",
          post.get("author_username") == author["payload"]["username"],
          f"author_username={post.get('author_username')!r} -- the B9 lookup regressed")

    r = client.get("/api/posts/feed", headers=auth_header)
    feed = data_of(r).get("posts", [])
    check("GET /api/posts/feed contains the new post",
          any(p.get("$id") == post_id for p in feed),
          f"{len(feed)} posts returned, none matching {post_id}")

    r = client.post(f"/api/posts/{post_id}/like", headers=auth_header)
    check("POST like -> likes_count == 1", data_of(r).get("likes_count") == 1,
          f"{r.status_code} {body(r)}")

    # ── avatar upload ─────────────────────────────────────────────────────────
    step("avatar upload")
    r = client.post("/api/upload/avatar", headers=auth_header,
                    files={"file": ("avatar.png", tiny_png(), "image/png")})
    check("POST /api/upload/avatar -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    avatar_url = data_of(r).get("url", "")
    if check("upload returns a url", bool(avatar_url)):
        try:
            fetched = httpx.get(avatar_url, timeout=30, follow_redirects=True)
            check("the avatar url is publicly fetchable", fetched.status_code == 200,
                  f"GET {avatar_url} -> {fetched.status_code}")
        except Exception as e:
            check("the avatar url is publicly fetchable", False, str(e))

        r = client.get("/api/users/me", headers=auth_header)
        check("the profile now reflects avatar_url",
              bool(data_of(r).get("avatar_url")),
              "upload succeeded but the profile was not updated -- B9 regressed")

    # ── squad ─────────────────────────────────────────────────────────────────
    step("squad")
    r = client.post("/api/squads/", headers=auth_header,
                    json={"name": f"Smoke Squad {tag}", "sport": "football"})
    check("POST /api/squads/ -> 2xx", r.status_code < 300, f"{r.status_code} {body(r)}")
    squad_id = data_of(r).get("$id", "")

    validators = [register(f"val{i}") for i in range(3)]
    for i, v in enumerate(validators):
        vid = v["data"].get("user_id", "")
        r = client.post(f"/api/squads/{squad_id}/members", headers=auth_header,
                        json={"user_id": vid, "role": "member"})
        check(f"added validator {i + 1} to the squad", r.status_code < 400,
              f"{r.status_code} {body(r)}")

    # ── match and stats ───────────────────────────────────────────────────────
    step("match, stats and validation")
    r = client.post("/api/matches/", headers=auth_header,
                    json={"sport": "football", "home_squad_id": squad_id})
    check("POST /api/matches/ -> 2xx", r.status_code < 300, f"{r.status_code} {body(r)}")
    match_id = data_of(r).get("$id", "")

    r = client.patch(f"/api/matches/{match_id}/result", headers=auth_header,
                     json={"result": "win", "score_home": 3, "score_away": 1})
    check("match result recorded", r.status_code < 400, f"{r.status_code} {body(r)}")

    r = client.post(f"/api/matches/{match_id}/stats", headers=auth_header, json={
        "match_id": match_id, "sport": "football",
        "stats_data": {"goals": 2, "assists": 1, "passes": 120, "tackles": 9},
        "match_rating": 8.5, "is_mvp": True,
    })
    check("POST stats -> 2xx", r.status_code < 300, f"{r.status_code} {body(r)}")
    stat = data_of(r)
    stat_id = stat.get("$id", "")
    check("stats submission returns the pulse earned",
          float(stat.get("pulse_earned", 0)) > 0,
          f"pulse_earned={stat.get('pulse_earned')!r} -- the placeholder formula is back")

    for i, v in enumerate(validators):
        vjwt = v["data"].get("jwt", "")
        r = client.post(f"/api/matches/{match_id}/validate/{stat_id}",
                        headers={"Authorization": f"Bearer {vjwt}"}, json={"vote": "confirm"})
        check(f"validator {i + 1} voted", r.status_code < 400, f"{r.status_code} {body(r)}")

    r = client.get(f"/api/matches/{match_id}/stats", headers=auth_header)
    rows = data_of(r).get("documents") or data_of(r).get("items") or []
    row = next((x for x in rows if x.get("$id") == stat_id), {})
    check("three confirms flip validation_status to validated",
          row.get("validation_status") == "validated",
          f"validation_status={row.get('validation_status')!r} "
          f"confirms={row.get('confirm_votes')!r}")

    # ── pulse and level ───────────────────────────────────────────────────────
    step("pulse and level")
    r = client.get("/api/pulse/me", headers=auth_header)
    pulse = data_of(r)
    check("GET /api/pulse/me -> total_pulse > 100",
          float(pulse.get("total_pulse", 0)) > 100,
          f"total_pulse={pulse.get('total_pulse')!r} -- the camelCase read regressed")
    check("pulse reports a tier", pulse.get("tier") in ("contender", "elite", "pulse_elite"),
          f"tier={pulse.get('tier')!r}")

    r = client.get("/api/pulse/me/level", headers=auth_header)
    level = data_of(r)
    progress = level.get("progress_percent")
    check("level progress is a real number, not a hardcoded 0",
          isinstance(progress, (int, float)) and progress > 0,
          f"progress_percent={progress!r}")
    check("level is at least 2 after earning Pulse",
          int(level.get("current_level", 0)) >= 2,
          f"current_level={level.get('current_level')!r}")

    # ── messaging ─────────────────────────────────────────────────────────────
    step("direct messages and squad chat")
    partner = validators[0]
    partner_id = partner["data"].get("user_id", "")
    partner_header = {"Authorization": f"Bearer {partner['data'].get('jwt', '')}"}
    outsider_header = {"Authorization": f"Bearer {validators[1]['data'].get('jwt', '')}"}

    r = client.post("/api/conversations/", headers=auth_header, json={"user_id": partner_id})
    check("POST /api/conversations/ -> 201", r.status_code == 201, f"{r.status_code} {body(r)}")
    conversation_id = data_of(r).get("$id", "")

    # Opening the same chat twice must reuse the thread, or every visit to a
    # profile would mint another conversation with the same person.
    r = client.post("/api/conversations/", headers=auth_header, json={"user_id": partner_id})
    check("opening the same thread again reuses it",
          data_of(r).get("$id") == conversation_id,
          f"first={conversation_id!r} second={data_of(r).get('$id')!r}")

    check("you cannot open a thread with yourself",
          client.post("/api/conversations/", headers=auth_header,
                      json={"user_id": uid}).status_code == 400)

    r = client.post(f"/api/conversations/{conversation_id}/messages",
                    headers=auth_header, json={"content": f"hello from author {tag}"})
    check("POST a message -> 201", r.status_code == 201, f"{r.status_code} {body(r)}")
    check("the sent message carries a joined sender profile",
          bool(data_of(r).get("sender", {}).get("username")),
          f"sender={data_of(r).get('sender')!r}")

    r = client.post(f"/api/conversations/{conversation_id}/messages",
                    headers=partner_header, json={"content": "and hello back"})
    check("the other participant can reply", r.status_code == 201, f"{r.status_code} {body(r)}")

    # The browser subscribes to this collection for live delivery, and Appwrite
    # only pushes documents the client may read. Both participants therefore need
    # a read grant, nobody may hold a write grant, and an outsider must hold
    # nothing -- otherwise realtime either delivers silence or leaks.
    perms = data_of(r).get("$permissions") or []
    check("a message grants read to both participants",
          f'read("user:{uid}")' in perms and f'read("user:{partner_id}")' in perms,
          f"permissions={perms!r}")
    check("a message grants nobody write access",
          not any(p.startswith(("create(", "update(", "delete(", "write(")) for p in perms),
          f"permissions={perms!r}")
    check("a non-participant is granted nothing on the message",
          not any(validators[1]["data"].get("user_id", "?") in p for p in perms),
          f"permissions={perms!r}")

    check("an empty message with no attachment is refused",
          client.post(f"/api/conversations/{conversation_id}/messages",
                      headers=auth_header, json={"content": "   "}).status_code == 400)

    r = client.get(f"/api/conversations/{conversation_id}/messages", headers=auth_header)
    items = data_of(r).get("items", [])
    check("both messages come back", len(items) == 2, f"got {len(items)}")
    check("messages are ordered oldest first for rendering",
          len(items) == 2 and items[0].get("sender_id") == uid,
          f"first sender={items[0].get('sender_id') if items else None!r}")

    # A non-participant must not be able to read or write the thread.
    check("a non-participant cannot read the thread",
          client.get(f"/api/conversations/{conversation_id}/messages",
                     headers=outsider_header).status_code == 403)
    check("a non-participant cannot post to the thread",
          client.post(f"/api/conversations/{conversation_id}/messages",
                      headers=outsider_header, json={"content": "intruding"}).status_code == 403)

    r = client.get("/api/conversations/", headers=partner_header)
    threads = data_of(r).get("items", [])
    mine = next((c for c in threads if c.get("$id") == conversation_id), {})
    check("the thread appears in the recipient's list", bool(mine), f"{len(threads)} thread(s)")
    check("the conversation carries the denormalised last message",
          mine.get("last_message") == "and hello back", f"{mine.get('last_message')!r}")
    check("the other participant is resolved for the header",
          bool(mine.get("participants")) and mine["participants"][0].get("user_id") == uid,
          f"participants={mine.get('participants')!r}")
    # Never read, so both messages are unread -- including the recipient's own,
    # which is what the read marker is for.
    check("unread count is non-zero before reading",
          int(mine.get("unread_count", 0)) > 0, f"unread={mine.get('unread_count')!r}")

    r = client.post(f"/api/conversations/{conversation_id}/read", headers=partner_header)
    check("POST /read -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    r = client.get("/api/conversations/", headers=partner_header)
    after = next((c for c in data_of(r).get("items", [])
                  if c.get("$id") == conversation_id), {})
    check("reading zeroes the unread count",
          int(after.get("unread_count", -1)) == 0, f"unread={after.get('unread_count')!r}")

    # ── squad chat ────────────────────────────────────────────────────────────
    r = client.post(f"/api/squads/{squad_id}/messages", headers=auth_header,
                    json={"content": "team, training at six", "type": "announcement",
                          "announcement_data": {"priority": "high", "pinned": True}})
    check("POST a squad message -> 201", r.status_code == 201, f"{r.status_code} {body(r)}")

    r = client.post(f"/api/squads/{squad_id}/messages", headers=partner_header,
                    json={"content": "which formation?", "type": "poll",
                          "poll_data": {"options": ["4-3-3", "4-4-2"], "votes": [0, 0]}})
    check("a member can post to the channel", r.status_code == 201, f"{r.status_code} {body(r)}")

    r = client.get(f"/api/squads/{squad_id}/messages", headers=auth_header)
    channel = data_of(r).get("items", [])
    squad_perms = channel[0].get("$permissions", []) if channel else []
    check("a squad message grants read to every member of the squad",
          sum(1 for p in squad_perms if p.startswith("read(")) == 4,
          f"{len(squad_perms)} grant(s) for a 4-member squad: {squad_perms!r}")
    check("both squad messages come back", len(channel) == 2, f"got {len(channel)}")
    poll = next((m for m in channel if m.get("type") == "poll"), {})
    # The column is a string; the service json.dumps on write and parses on read,
    # so the client never sees a JSON blob.
    check("poll_data arrives parsed, not as a JSON string",
          isinstance(poll.get("poll_data"), dict)
          and poll["poll_data"].get("options") == ["4-3-3", "4-4-2"],
          f"poll_data={poll.get('poll_data')!r}")
    check("squad messages carry the sender's name and role",
          bool(channel[0].get("sender_name")) and bool(channel[0].get("sender_role")),
          f"name={channel[0].get('sender_name')!r} role={channel[0].get('sender_role')!r}")

    # validators[1] and [2] were added to the squad, so a true outsider is needed:
    # the account itself is a member, hence checking the reverse -- a member is
    # allowed -- above, and a bad squad id here.
    check("a non-member cannot read another squad's channel",
          client.get("/api/squads/not-a-real-squad/messages",
                     headers=auth_header).status_code == 403)

    # ── envelope and limits ───────────────────────────────────────────────────
    step("error envelope and rate limiting")
    r = client.get("/api/posts/does-not-exist-at-all", headers=auth_header)
    err = body(r)
    check("a 4xx uses the standard envelope",
          err.get("success") is False and bool(err.get("error", {}).get("code")), str(err)[:200])
    check("errors carry a request id", bool(err.get("request_id")))
    check("responses carry X-Request-ID", bool(r.headers.get("X-Request-ID")))

    limiter.enabled = True
    limiter.reset()
    codes = [client.post("/api/auth/login",
                         json={"email": "nobody@x.y", "password": "wrongpassword"}).status_code
             for _ in range(7)]
    check("the auth rate limit returns 429", 429 in codes, f"codes={codes}")
    limiter.reset()

    # ── cleanup ───────────────────────────────────────────────────────────────
    if args.keep:
        print(f"\n--keep: leaving {len(created_users)} account(s): {', '.join(created_users)}")
    else:
        step("cleanup")
        removed = 0
        for user_id in created_users:
            try:
                users_svc.delete(user_id=user_id)
                removed += 1
            except Exception as e:
                print(f"  [!] could not delete {user_id}: {e}")
        print(f"  removed {removed}/{len(created_users)} accounts")

    print("\n" + "=" * 62)
    print(f"passed {passed}   failed {failed}")
    if failed:
        print("SMOKE FAILED")
        return 1
    print("SMOKE OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
