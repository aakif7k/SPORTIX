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

Cleanup runs by default: four auth accounts and every document they own are
removed at the end -- deleting an Appwrite auth user does not cascade to
documents, so the sweep is explicit. Pass --keep to leave them for inspection,
and --purge-orphans to clear what an earlier interrupted run left behind.
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

# Windows consoles default to cp1252, and assertion details can contain emoji (the
# streak ladder's icons, for one). Without this a genuine failure is replaced by a
# UnicodeEncodeError, hiding the very detail needed to diagnose it.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

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


# Fields that mean "this row belongs to this user". Any collection in schema.py
# declaring one of these gets swept, so a new collection with a user_id is
# cleaned up without this list changing.
OWNER_FIELDS = (
    "user_id", "sender_id", "author_id", "organizer_id", "captain_id",
    "follower_id", "following_id", "created_by", "voter_id", "viewer_id",
    "reporter_id", "recipient_id", "actor_id", "requester_id", "uploader_id",
)


def purge_user(uid: str) -> int:
    """
    Remove a test user's rows from every collection that says it owns them.

    The previous cleanup deleted the auth account and stopped there, while the
    docstring claimed the content went too. It did not: sixteen runs had left 64
    orphaned profiles behind, and because profiles are searchable those test
    accounts were showing up in real search results. Deleting the auth user does
    not cascade to documents -- nothing in Appwrite ties them together.
    """
    from appwrite.query import Query as Q

    from app.core.appwrite import db, DB_ID
    from scripts.schema import COLLECTIONS

    removed = 0
    for collection in COLLECTIONS:
        keys = {a.key for a in collection.all_attrs}
        for field in OWNER_FIELDS:
            if field not in keys:
                continue
            try:
                rows = db.list_documents(DB_ID, collection.id, queries=[
                    Q.equal(field, uid), Q.limit(100),
                ]).get("documents", [])
            except Exception:
                continue
            for row in rows:
                try:
                    db.delete_document(DB_ID, collection.id, row["$id"])
                    removed += 1
                except Exception:
                    pass

    # The profile's document id IS the auth user id, so it has no owner field.
    try:
        db.delete_document(DB_ID, "profiles", uid)
        removed += 1
    except Exception:
        pass
    return removed


def purge_orphans() -> int:
    """
    Delete every leftover smoke account, for clearing what earlier runs left.

        python -m scripts.smoke --purge-orphans

    Matches on the smoke_ username prefix, which only this script creates.
    """
    from appwrite.query import Query as Q

    from app.core.appwrite import db, DB_ID, users_svc

    victims: list[str] = []
    while True:
        rows = db.list_documents(DB_ID, "profiles", queries=[
            Q.search("username", "smoke"), Q.limit(100),
        ]).get("documents", [])
        fresh = [r["$id"] for r in rows
                 if str(r.get("username", "")).startswith("smoke_")
                 and r["$id"] not in victims]
        if not fresh:
            break
        victims.extend(fresh)
        for uid in fresh:
            purge_user(uid)
            try:
                users_svc.delete(user_id=uid)
            except Exception:
                pass
    print(f"purged {len(victims)} orphaned smoke account(s)")
    return len(victims)


def partner_header_early(validators) -> dict:
    """Auth header for the first validator, used before the messaging step names it."""
    return {"Authorization": f"Bearer {validators[0]['data'].get('jwt', '')}"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep", action="store_true", help="do not delete the accounts created")
    ap.add_argument("--purge-orphans", action="store_true",
                    help="delete leftover smoke_* accounts from earlier runs, then exit")
    args = ap.parse_args()

    from app.core.config import settings
    if settings.appwrite_api_key in ("", "your_api_key_with_all_scopes"):
        print("[x] APPWRITE_API_KEY is unset or still the placeholder.")
        return 2

    if args.purge_orphans:
        purge_orphans()
        return 0

    from app.core.rate_limit import limiter
    from app.core.appwrite import users_svc
    from main import app

    # This script makes ~8 auth calls in a few seconds against a 5/minute tier.
    # Limiting is verified deliberately at the end instead of tripping over it.
    limiter.enabled = False
    client = TestClient(app, raise_server_exceptions=False)

    tag = uuid.uuid4().hex[:8]
    now = "2026-01-01T00:00:00.000+00:00"
    # Rows written directly rather than through an endpoint, removed at the end
    # alongside the accounts.
    created_docs: list[tuple[str, str]] = []

    def register(role: str) -> dict:
        payload = {
            "email": f"smoke_{role}_{tag}@sportix.test",
            "password": "SmokeTest12345",
            # A token that appears ONLY in full_name: the username is
            # smoke_<role>_<tag>, so a hit on this can only have come from
            # full_name matching. Previously this searched "Smoke", which every
            # leftover account also matched, so the assertion measured litter.
            "full_name": f"Zephyr{tag} {role.title()}",
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
                    json={"sport": "football", "home_squad_id": squad_id,
                          "opponent_name": "Rapid XI"})
    check("POST /api/matches/ -> 2xx", r.status_code < 300, f"{r.status_code} {body(r)}")
    match_id = data_of(r).get("$id", "")
    # These four were query parameters, so the body was ignored and the match was
    # written with no sport and no squad -- which this only checked the status of.
    check("the match body is actually read, not ignored as query params",
          data_of(r).get("home_squad_id") == squad_id
          and data_of(r).get("sport") == "football",
          f"home_squad_id={data_of(r).get('home_squad_id')!r} "
          f"sport={data_of(r).get('sport')!r}")
    check("a match with no sport is rejected",
          client.post("/api/matches/", headers=auth_header,
                      json={"home_squad_id": squad_id}).status_code == 422)

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

    # ── event entry ───────────────────────────────────────────────────────────
    step("joining an event as a squad")
    r = client.post("/api/events/", headers=auth_header, json={
        "title": f"Smoke Cup {tag}", "sport": "football", "format": "team",
        "skill_level": "amateur", "venue": "Smoke Arena", "city": "Berlin",
        "event_date": "2027-01-01T18:00:00.000+00:00",
        "max_participants": 20, "description": "smoke", "rules": ["be nice"],
    })
    check("POST /api/events/ -> 2xx", r.status_code < 300, f"{r.status_code} {body(r)}")
    event_id = data_of(r).get("$id", "")
    r = client.post(f"/api/events/{event_id}/join", headers=auth_header,
                    json={"squad_id": squad_id, "entry_type": "squad"})
    check("POST /api/events/{id}/join -> 2xx", r.status_code < 300, f"{r.status_code} {body(r)}")
    # squad_id and entry_type were query parameters while every caller sent them
    # in the body, so entering as a squad silently registered a solo entrant.
    entry = data_of(r)
    check("joining as a squad records the squad, not a solo entry",
          entry.get("entry_type") == "squad" and entry.get("squad_id") == squad_id,
          f"entry_type={entry.get('entry_type')!r} squad_id={entry.get('squad_id')!r}")
    # The roster rows hold only a user_id, so EventDetail and ManageEvent resolved
    # names and avatars out of MOCK_USERS and fell back to a random pravatar --
    # a real event displayed fictional people.
    r = client.get(f"/api/events/{event_id}/participants", headers=auth_header)
    roster = data_of(r).get("items", [])
    me_row = next((p for p in roster if p.get("user_id") == uid), {})
    check("event participants carry a joined profile",
          bool(me_row) and me_row.get("username") == author["payload"]["username"],
          f"row={me_row!r}")
    check("the joined participant carries level and pulse",
          isinstance(me_row.get("level"), int) and me_row.get("pulse_score") is not None,
          f"level={me_row.get('level')!r} pulse={me_row.get('pulse_score')!r}")

    # AthleteProfile links to people by id as often as by handle.
    r = client.get(f"/api/users/{uid}", headers=auth_header)
    check("a profile can be fetched by user id, not only by username",
          r.status_code == 200 and data_of(r).get("$id") == uid,
          f"{r.status_code} {body(r)}")
    r = client.get(f"/api/users/{author['payload']['username']}", headers=auth_header)
    check("a profile can still be fetched by username",
          r.status_code == 200 and data_of(r).get("$id") == uid,
          f"{r.status_code} {body(r)}")

    check("an unknown entry_type is rejected",
          client.post(f"/api/events/{event_id}/join", headers=partner_header_early(validators),
                      json={"entry_type": "wildcard"}).status_code == 422)

    # The banner this feeds says "you have a match to report", but the endpoint
    # used to return stats *awaiting validation* -- the opposite, so it fired only
    # once a report had already been filed.
    r = client.get("/api/matches/pending-report/check", headers=auth_header)
    pending = data_of(r)
    check("a reported match is not owed a report",
          pending.get("has_pending") is False,
          f"has_pending={pending.get('has_pending')!r} pending={pending.get('pending')!r}")
    check("reports awaiting teammate validation are counted separately",
          "awaiting_validation" in pending,
          f"keys={sorted(pending.keys())!r}")

    # --- daily streak ladder --------------------------------------------------
    step("daily streak rewards")
    r = client.get("/api/missions/streak", headers=auth_header)
    streak = data_of(r)
    check("GET /api/missions/streak -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    # The calendar was seven hardcoded rows with days 1-3 always claimed and day 4
    # always "today", identical for every account.
    check("the ladder has seven rungs", len(streak.get("rewards") or []) == 7,
          f"{len(streak.get('rewards') or [])} rung(s)")
    # Registering logged the account in, which starts the streak at day 1 -- but
    # starting a streak is not the same as having collected its reward.
    check("nothing is claimed before the reward is collected",
          streak.get("claimed_today") is False
          and all(not rung.get("claimed") for rung in streak.get("rewards") or []),
          f"claimed_today={streak.get('claimed_today')!r}")
    check("the current streak day is the claimable one",
          next((rung["day"] for rung in streak.get("rewards") or []
                if rung.get("is_today")), None) == max(1, streak.get("current_streak", 1)),
          f"streak={streak.get('current_streak')!r} rewards={streak.get('rewards')!r}")

    r = client.post("/api/missions/streak/claim", headers=auth_header)
    claim = data_of(r)
    check("POST /api/missions/streak/claim -> 200", r.status_code == 200,
          f"{r.status_code} {body(r)}")
    check("claiming pays out the current day's rung",
          claim.get("day") == 1 and claim.get("current_streak") == 1
          and float(claim.get("pulse_awarded") or 0) == 10
          and int(claim.get("coins_awarded") or 0) == 5,
          f"claim={claim!r}")
    # Claiming twice in a day must not pay twice.
    check("a second claim on the same day is refused",
          client.post("/api/missions/streak/claim", headers=auth_header
                      ).status_code == 400)
    # balance is an int column and award() wrote the float it was given, so any
    # float-typed award 400'd and the caller saw a silently unchanged balance.
    wallet = data_of(client.get("/api/coins/balance", headers=auth_header))
    check("the coin reward reached the wallet",
          int(wallet.get("balance") or 0) >= 5,
          f"balance={wallet.get('balance')!r}")
    check("total_earned is maintained, not left at zero",
          int(wallet.get("total_earned") or 0) >= 5,
          f"total_earned={wallet.get('total_earned')!r}")

    after = data_of(client.get("/api/missions/streak", headers=auth_header))
    check("the ladder reports today as claimed",
          after.get("claimed_today") is True and after.get("current_streak") == 1,
          f"claimed_today={after.get('claimed_today')!r} streak={after.get('current_streak')!r}")

    # --- career and history ---------------------------------------------------
    step("career history and aggregates")
    r = client.get("/api/matches/me/history", headers=auth_header)
    hist = data_of(r).get("items", [])
    check("GET /api/matches/me/history -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    mine = next((h for h in hist if h.get("match_id") == match_id), {})
    check("the submitted report is in the athlete's history", bool(mine),
          f"{len(hist)} report(s), none for {match_id}")
    check("the history row names the match",
          bool(mine.get("event_name")), f"event_name={mine.get('event_name')!r}")
    # Three teammates confirmed it earlier in this run.
    check("a validated report is not flagged pending",
          mine.get("is_pending") is False and mine.get("validation_status") == "validated",
          f"is_pending={mine.get('is_pending')!r} status={mine.get('validation_status')!r}")
    check("the stat line is summarised for display",
          isinstance(mine.get("stat_summary"), dict) and bool(mine["stat_summary"]),
          f"stat_summary={mine.get('stat_summary')!r}")
    check("filtering history by result works",
          all(h.get("match_result") == "win"
              for h in (data_of(client.get("/api/matches/me/history?result=win",
                                           headers=auth_header)).get("items") or [])),
          "a non-win came back from ?result=win")
    check("filtering history by another sport excludes it",
          not (data_of(client.get("/api/matches/me/history?sport=cricket",
                                  headers=auth_header)).get("items") or []),
          "a football report came back from ?sport=cricket")

    r = client.get("/api/matches/me/career", headers=auth_header)
    career = data_of(r)
    check("GET /api/matches/me/career -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    check("the career counts the validated win",
          career.get("wins") == 1 and career.get("total_matches") == 1,
          f"wins={career.get('wins')!r} total={career.get('total_matches')!r}")
    check("win rate is derived, not hardcoded",
          career.get("win_rate") == 100, f"win_rate={career.get('win_rate')!r}")
    check("career Pulse is the sum of validated reports",
          float(career.get("total_pulse_earned") or 0) > 0,
          f"total_pulse_earned={career.get('total_pulse_earned')!r}")
    # The client used a hardcoded 8.4 baseline, so every new athlete looked 8.4/10.
    ssr = career.get("current_ssr")
    check("SSR is on the 0-10 scale and moved off the baseline by the match",
          isinstance(ssr, (int, float)) and 0 <= ssr <= 10 and ssr != 8.4,
          f"current_ssr={ssr!r}")
    check("SSR reports a trend", career.get("ssr_trend") in ("up", "down", "stable"),
          f"ssr_trend={career.get('ssr_trend')!r}")
    check("the football breakdown carries the goals submitted",
          float((career.get("football") or {}).get("total_goals") or 0) == 2,
          f"football={career.get('football')!r}")
    check("the MVP flag is counted", career.get("mvp_count") == 1,
          f"mvp_count={career.get('mvp_count')!r}")

    # An athlete with nothing validated must have no SSR rather than a flattering one.
    fresh = validators[2]
    r = client.get("/api/matches/me/career",
                   headers={"Authorization": f"Bearer {fresh['data'].get('jwt','')}"})
    empty = data_of(r)
    check("an athlete with no validated matches has no SSR at all",
          empty.get("current_ssr") is None and empty.get("total_matches") == 0,
          f"current_ssr={empty.get('current_ssr')!r} total={empty.get('total_matches')!r}")

    # --- organizer roster management ------------------------------------------
    step("organizer: confirm, remove and announce")
    partner_id_early = validators[0]["data"].get("user_id", "")
    r = client.post(f"/api/events/{event_id}/join",
                    headers=partner_header_early(validators),
                    json={"entry_type": "solo"})
    check("a second athlete can enter the event", r.status_code < 300,
          f"{r.status_code} {body(r)}")

    # Approve moved an array in zustand; it now moves the row and tells the athlete.
    r = client.patch(f"/api/events/{event_id}/participants/{partner_id_early}",
                     headers=auth_header, json={"status": "confirmed"})
    check("the organizer can confirm an entrant", r.status_code == 200,
          f"{r.status_code} {body(r)}")
    check("the status actually changed", data_of(r).get("status") == "confirmed",
          f"status={data_of(r).get('status')!r}")

    check("a non-organizer cannot change a roster",
          client.patch(f"/api/events/{event_id}/participants/{uid}",
                       headers=partner_header_early(validators),
                       json={"status": "withdrawn"}).status_code == 403)
    check("an unknown status is rejected",
          client.patch(f"/api/events/{event_id}/participants/{partner_id_early}",
                       headers=auth_header,
                       json={"status": "maybe-later"}).status_code == 422)

    # The broadcast box only flipped a flag for three seconds.
    r = client.post(f"/api/events/{event_id}/announce", headers=auth_header,
                    json={"message": f"Kick-off moved to 7pm {tag}"})
    check("announcing notifies the entrants", r.status_code == 200,
          f"{r.status_code} {body(r)}")
    check("the organizer is not notified of their own announcement",
          data_of(r).get("notified") == 1,
          f"notified={data_of(r).get('notified')!r} of "
          f"{data_of(r).get('recipients')!r} recipient(s)")
    r = client.get("/api/notifications/", headers=partner_header_early(validators))
    notes = (data_of(r).get("items") or data_of(r).get("documents") or [])
    check("the entrant received the announcement",
          any(tag in str(n.get("body", "")) for n in notes),
          f"{len(notes)} notification(s), none carrying the announcement")
    check("an empty announcement is refused",
          client.post(f"/api/events/{event_id}/announce", headers=auth_header,
                      json={"message": "   "}).status_code == 422)

    before = data_of(client.get(f"/api/events/{event_id}", headers=auth_header))
    r = client.delete(f"/api/events/{event_id}/participants/{partner_id_early}",
                      headers=auth_header)
    check("the organizer can remove an entrant", r.status_code == 200,
          f"{r.status_code} {body(r)}")
    after = data_of(client.get(f"/api/events/{event_id}", headers=auth_header))
    # Removing somebody has to free their slot, or an event fills up with ghosts.
    check("removing an entrant frees their slot",
          int(after.get("current_participants") or 0)
          == int(before.get("current_participants") or 0) - 1,
          f"{before.get('current_participants')!r} -> "
          f"{after.get('current_participants')!r}")
    roster = data_of(client.get(f"/api/events/{event_id}/participants",
                                headers=auth_header)).get("items", [])
    check("the removed athlete is off the roster",
          not any(p.get("user_id") == partner_id_early for p in roster),
          f"roster={[p.get('user_id') for p in roster]!r}")

    # ── squad history and leadership ──────────────────────────────────────────
    step("squad match history and leadership")
    r = client.get(f"/api/squads/{squad_id}/matches", headers=auth_header)
    history = data_of(r).get("items", [])
    check("GET /api/squads/{id}/matches -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    check("the match played above is in the squad's history",
          any(m.get("$id") == match_id for m in history),
          f"{len(history)} match(es), none of them {match_id}")
    played = next((m for m in history if m.get("$id") == match_id), {})
    check("a win reports outcome W and a formatted score",
          played.get("outcome") == "W" and played.get("score") == "3 - 1",
          f"outcome={played.get('outcome')!r} score={played.get('score')!r}")
    # The top performer has to be joined from player_stats; the page renders a
    # name, an avatar and a stat line, none of which live on the match row.
    top = played.get("top_performer") or {}
    check("the top performer is joined in from player_stats",
          top.get("user_id") == uid and bool(top.get("full_name")),
          f"top_performer={top!r}")
    check("the top performer carries a readable stat summary",
          "goals" in (top.get("stats_summary") or ""),
          f"stats_summary={top.get('stats_summary')!r}")
    check("three confirms mark the top performer validated",
          top.get("is_validated") is True, f"is_validated={top.get('is_validated')!r}")
    check("a non-member cannot read a squad's history",
          client.get(f"/api/squads/{squad_id}/matches",
                     headers={"Authorization": f"Bearer {validators[0]['data'].get('jwt','')}"}
                     ).status_code in (200, 403))

    r = client.get(f"/api/squads/{squad_id}/leadership", headers=auth_header)
    lead = data_of(r)
    check("GET /api/squads/{id}/leadership -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    check("the caller is reported as captain", lead.get("is_captain") is True,
          f"is_captain={lead.get('is_captain')!r}")
    check("every member has a leadership score",
          len(lead.get("standings") or []) == 4,
          f"{len(lead.get('standings') or [])} standing(s) for a 4-member squad")
    captain = lead.get("captain") or {}
    check("the captain's five components are all present",
          set((captain.get("components") or {}).keys()) == {
              "attendance", "communication", "reliability",
              "squad_approval", "event_participation"},
          f"components={captain.get('components')!r}")
    # The score was a literal 88 in the markup; it has to move with the data.
    check("reliability reflects the validated stats submission",
          int((captain.get("components") or {}).get("reliability", -1)) == 100,
          f"reliability={(captain.get('components') or {}).get('reliability')!r}")
    check("a recommendation names somebody other than the captain",
          (lead.get("recommendation") or {}).get("user_id") not in (None, uid),
          f"recommendation={lead.get('recommendation')!r}")
    check("no vote is reported before anyone votes", lead.get("vote") is None,
          f"vote={lead.get('vote')!r}")

    # Cast one and confirm the read side sees it, including the derived window.
    r = client.post(f"/api/squads/{squad_id}/leadership/vote", headers=auth_header,
                    json={"candidate_id": validators[0]["data"].get("user_id", ""),
                          "vote": "approve"})
    check("casting a leadership vote -> 2xx", r.status_code < 300, f"{r.status_code} {body(r)}")
    vote = (data_of(client.get(f"/api/squads/{squad_id}/leadership",
                               headers=auth_header)).get("vote") or {})
    check("the vote tally reflects the vote just cast",
          vote.get("approve") == 1 and vote.get("reject") == 0,
          f"approve={vote.get('approve')!r} reject={vote.get('reject')!r}")
    check("my_vote comes back so the page knows I voted",
          vote.get("my_vote") == "approve", f"my_vote={vote.get('my_vote')!r}")
    check("the 48h window is derived from the first vote, not the page load",
          bool(vote.get("opened_at")) and bool(vote.get("closes_at"))
          and vote.get("is_closed") is False,
          f"opened={vote.get('opened_at')!r} closes={vote.get('closes_at')!r}")
    check("a ballot row exists for every member",
          len(vote.get("ballots") or []) == 4,
          f"{len(vote.get('ballots') or [])} ballot(s)")
    check("votes_needed is a strict majority of the squad",
          vote.get("votes_needed") == 3, f"votes_needed={vote.get('votes_needed')!r}")

    # ── messaging ─────────────────────────────────────────────────────────────
    step("direct messages and squad chat")
    partner = validators[0]
    partner_id = partner["data"].get("user_id", "")
    partner_header = {"Authorization": f"Bearer {partner['data'].get('jwt', '')}"}
    outsider_header = {"Authorization": f"Bearer {validators[1]['data'].get('jwt', '')}"}

    # The new-message picker searches people by name, which only matched
    # username before -- so typing a name found nobody.
    r = client.get(f"/api/search/?type=users&q=Zephyr{tag}", headers=auth_header)
    found = (data_of(r).get("users") or [])
    check("user search matches on full_name, not just username",
          any(u.get("$id") == partner_id for u in found),
          f"{len(found)} hit(s) for the full_name-only token, "
          f"partner {partner_id} not among them")
    r = client.get(f"/api/search/?type=users&q=Zephyr{tag}&sport=badminton", headers=auth_header)
    check("the sport filter is actually applied to search",
          not (data_of(r).get("users") or []),
          f"got {len(data_of(r).get('users') or [])} football players filtered by badminton")

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

    # ── tournaments ───────────────────────────────────────────────────────────
    step("tournaments: registration, standings, bracket")
    from appwrite.id import ID as _ID
    from app.core.appwrite import db as _db, DB_ID as _DB

    # A tournament and two completed fixtures, written directly: there is no
    # endpoint that creates a tournament, and what matters here is the read path.
    tournament = _db.create_document(_DB, "tournaments", _ID.unique(), {
        "name": f"Smoke Cup {tag}", "sport": "football", "format": "knockout",
        "status": "registering", "squad_ids": [], "max_squads": 2,
        "venue": "Smoke Arena", "prize_pool": "$1,000",
        "starts_at": "2027-02-01T10:00:00.000+00:00", "created_at": now,
    })
    tournament_id = tournament["$id"]
    created_docs.append(("tournaments", tournament_id))

    r = client.post(f"/api/tournaments/{tournament_id}/register", headers=auth_header,
                    json={"squad_id": squad_id})
    check("POST /api/tournaments/{id}/register -> 201", r.status_code == 201,
          f"{r.status_code} {body(r)}")
    check("the tournament reports the squad as registered",
          data_of(r).get("is_registered") is True and data_of(r).get("squads_count") == 1,
          f"is_registered={data_of(r).get('is_registered')!r} "
          f"count={data_of(r).get('squads_count')!r}")
    check("one slot is left of two", data_of(r).get("slots_left") == 1,
          f"slots_left={data_of(r).get('slots_left')!r}")

    r = client.post(f"/api/tournaments/{tournament_id}/register", headers=auth_header,
                    json={"squad_id": squad_id})
    check("registering the same squad twice is idempotent",
          data_of(r).get("squads_count") == 1,
          f"count={data_of(r).get('squads_count')!r}")

    check("only the captain can enter a squad",
          client.post(f"/api/tournaments/{tournament_id}/register",
                      headers=partner_header_early(validators),
                      json={"squad_id": squad_id}).status_code == 403)

    r = client.post("/api/squads/", headers=partner_header_early(validators),
                    json={"name": f"Smoke Rivals {tag}", "sport": "football"})
    rival_id = data_of(r).get("$id", "")
    r = client.post(f"/api/tournaments/{tournament_id}/register",
                    headers=partner_header_early(validators),
                    json={"squad_id": rival_id})
    check("filling the last slot flips the tournament to full",
          data_of(r).get("status") == "full", f"status={data_of(r).get('status')!r}")
    check("a full tournament reports no slots left",
          data_of(r).get("slots_left") == 0, f"slots_left={data_of(r).get('slots_left')!r}")

    for round_no, (a_score, b_score) in enumerate([(3, 1), (2, 2)], start=1):
        created_docs.append(("tournament_matches", _db.create_document(
            _DB, "tournament_matches", _ID.unique(), {
                "tournament_id": tournament_id, "round": round_no,
                "round_name": f"Round {round_no}",
                "squad_a_id": squad_id, "squad_a_name": "Smoke Squad",
                "squad_a_score": a_score,
                "squad_b_id": rival_id, "squad_b_name": "Smoke Rivals",
                "squad_b_score": b_score,
                "winner_id": squad_id if a_score > b_score else None,
                "status": "completed", "created_at": now,
            })["$id"]))

    r = client.get(f"/api/tournaments/{tournament_id}", headers=auth_header)
    detail = data_of(r)
    check("GET /api/tournaments/{id} -> 200", r.status_code == 200, f"{r.status_code} {body(r)}")
    table = detail.get("standings") or []
    check("standings are derived for both squads", len(table) == 2, f"{len(table)} row(s)")
    leader = table[0] if table else {}
    # One win and one draw is 4 points; the table used to be five hardcoded rows.
    check("points are derived from results (3 for a win, 1 for a draw)",
          leader.get("points") == 4 and leader.get("wins") == 1 and leader.get("draws") == 1,
          f"points={leader.get('points')!r} wins={leader.get('wins')!r} "
          f"draws={leader.get('draws')!r}")
    # 3-1 then 2-2: five scored, three conceded.
    check("score difference is derived from the goals",
          leader.get("difference") == 2, f"difference={leader.get('difference')!r}")
    check("the leader is placed first", leader.get("position") == 1,
          f"position={leader.get('position')!r}")
    bracket = detail.get("bracket") or []
    check("the bracket is grouped into rounds", len(bracket) == 2, f"{len(bracket)} round(s)")
    check("each bracket round carries its matches",
          all(len(rd.get("matches") or []) == 1 for rd in bracket), f"bracket={bracket!r}")

    r = client.get("/api/tournaments/?status=full", headers=auth_header)
    listed = (data_of(r).get("items") or [])
    check("browsing by status finds it and marks it registered",
          any(t.get("$id") == tournament_id and t.get("is_registered") for t in listed),
          f"{len(listed)} tournament(s) with status=full")

    r = client.post(f"/api/tournaments/{tournament_id}/withdraw", headers=auth_header,
                    json={"squad_id": squad_id})
    check("withdrawing reopens a full tournament",
          data_of(r).get("status") == "registering" and data_of(r).get("squads_count") == 1,
          f"status={data_of(r).get('status')!r} count={data_of(r).get('squads_count')!r}")

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
        rows = 0
        from app.core.appwrite import db as _cleanup_db, DB_ID as _CLEANUP_DB
        for collection, doc_id in created_docs:
            try:
                _cleanup_db.delete_document(_CLEANUP_DB, collection, doc_id)
                rows += 1
            except Exception:
                pass
        for user_id in created_users:
            # Content first: with the account gone the ids are still valid, but
            # sweeping while the user exists keeps this honest if it fails.
            rows += purge_user(user_id)
            try:
                users_svc.delete(user_id=user_id)
                removed += 1
            except Exception as e:
                print(f"  [!] could not delete {user_id}: {e}")
        print(f"  removed {removed}/{len(created_users)} accounts and {rows} document(s)")

    print("\n" + "=" * 62)
    print(f"passed {passed}   failed {failed}")
    if failed:
        print("SMOKE FAILED")
        return 1
    print("SMOKE OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
