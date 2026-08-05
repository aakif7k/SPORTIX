"""
Registration, login, password recovery and account deletion.

Four of these functions did not exist at all -- login_user, send_reset_email,
change_password and delete_account -- while routers/auth.py and
routers/settings.py already called them, so those four endpoints raised
AttributeError and returned 500. The test suite never caught it because it never
exercised them.

A note on how sessions are created. Appwrite's email/password session endpoint is
a *client* endpoint: it must be called without an API key, or Appwrite treats the
caller as the server and refuses. So credential checks go through a keyless
client, and the JWT the SPA needs afterwards is minted with the API key via
Users.create_jwt. register_user previously returned session["secret"] as the JWT,
which is a session secret and not a JWT at all -- Authorization: Bearer <that>
would have been rejected by every protected endpoint.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from appwrite.client import Client
from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.query import Query
from appwrite.services.account import Account

from app.core.appwrite import client, db, users_svc
from app.core.config import settings
from app.schemas.user import UserCreate
from app.services import pulse_math
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

# Appwrite JWTs are short-lived. The SPA refreshes before expiry; this value is
# only advisory metadata in the response.
JWT_TTL_SECONDS = 15 * 60


def _keyless_client() -> Client:
    """
    A client that identifies the project but carries no API key.

    Required for the endpoints Appwrite treats as client-side (creating an
    email/password session, requesting a recovery email).
    """
    c = Client()
    c.set_endpoint(settings.appwrite_endpoint)
    c.set_project(settings.appwrite_project_id)
    return c


def _mint_jwt(user_id: str) -> str:
    """A real JWT for the API, minted with the server key."""
    try:
        return users_svc.create_jwt(user_id=user_id).get("jwt", "")
    except AppwriteException:
        logger.exception("could not mint a JWT for %s", user_id)
        return ""


def _expires_at() -> str:
    return (datetime.now(timezone.utc) + timedelta(seconds=JWT_TTL_SECONDS)).isoformat()


def _verify_credentials(email: str, password: str) -> dict:
    """
    Confirm an email/password pair by creating then discarding a session.

    Raises PermissionError on bad credentials so the router maps it to 403/401
    rather than leaking Appwrite's message.
    """
    acct = Account(_keyless_client())
    try:
        return acct.create_email_password_session(email=email, password=password)
    except AppwriteException as e:
        logger.info("failed login for %s: %s", email, e.message)
        raise PermissionError("Incorrect email or password.") from e


# ── Registration ──────────────────────────────────────────────────────────────
async def register_user(payload: UserCreate) -> dict:
    account_svc = Account(client)
    db_id = settings.appwrite_database_id

    # Username must be unique. The collection has a unique index on it, but
    # checking first turns a 409 into a readable message.
    try:
        existing = db.list_documents(
            db_id, settings.collection_users,
            queries=[Query.equal("username", [payload.username.lower().strip()])],
        )
        if existing["total"] > 0:
            raise ValueError("Username already taken. Choose another.")
    except ValueError:
        raise
    except AppwriteException:
        logger.warning("username availability check failed; relying on the unique index",
                       exc_info=True)

    try:
        user = account_svc.create(
            user_id=ID.unique(),
            email=payload.email,
            password=payload.password,
            name=payload.full_name,
        )
    except AppwriteException as e:
        if getattr(e, "code", 0) == 409 or "already exists" in str(e.message).lower():
            raise ValueError("An account with this email already exists.") from e
        raise ValueError(f"Registration failed: {e.message}") from e

    uid = user["$id"]
    now = now_iso()

    # The profiles document id IS the auth user id (see B9). Failing to create it
    # leaves an auth account with no profile, which the app cannot render, so
    # this one is fatal rather than logged-and-ignored.
    try:
        db.create_document(
            db_id, settings.collection_users, document_id=uid,
            data={
                "email": payload.email,
                "username": payload.username.lower().strip(),
                "full_name": payload.full_name,
                "role": payload.role,
                "sport": payload.sport,
                "sports": payload.sports,
                "experience_level": payload.experience_level,
                "location": payload.location,
                "city": payload.city,
                "bio": "",
                "is_open_to_recruit": False,
                "is_verified": False,
                "is_active": True,
                "is_onboarding_complete": False,
                "level": 1,
                "pulse_score": 100.0,
                "coins_balance": 0,
                "login_streak": 0,
                "followers_count": 0,
                "following_count": 0,
                "posts_count": 0,
                "created_at": now,
            },
        )
    except AppwriteException as e:
        logger.error("profile creation failed for %s; rolling back the auth account", uid)
        try:
            users_svc.delete(uid)
        except AppwriteException:
            logger.exception("could not roll back auth account %s -- it now has no profile", uid)
        raise ValueError(f"Could not create your profile: {e.message}") from e

    _init_gamification_rows(db_id, uid, now)

    return {
        "user_id": uid,
        "email": payload.email,
        "username": payload.username.lower().strip(),
        "jwt": _mint_jwt(uid),
        "expires_at": _expires_at(),
        "message": "Account created successfully",
    }


def _init_gamification_rows(db_id: str, uid: str, now: str) -> None:
    """
    Seed the per-user Pulse, level, coins and streak rows.

    Each is best-effort: the service layer creates them on demand if absent, so a
    failure here degrades rather than blocks registration. All four previously
    omitted created_at, which the schema requires, so every one of them would
    have been rejected.
    """
    progress = pulse_math.level_progress(0)   # a new account has earned nothing
    rows = [
        (settings.collection_pulse_scores, {
            "user_id": uid, "total_pulse": 100.0,
            "match_performance": 0.0, "consistency": 0.0, "team_chemistry": 0.0,
            "reliability": 0.0, "activity": 0.0, "leadership": 0.0,
            "tier": pulse_math.tier_for(100.0),
            "updated_at": now, "created_at": now,
        }),
        (settings.collection_user_levels, {
            "user_id": uid,
            "current_level": progress["level"],
            "current_pulse": 100.0,
            # Level tracks lifetime earned, which starts at zero.
            "total_pulse_ever": 0.0,
            "pulse_for_next": progress["max_pulse"],
            "level_ups_count": 0,
            "prestige_rank": progress["title"],
            "updated_at": now, "created_at": now,
        }),
        (settings.collection_user_coins, {
            "user_id": uid, "balance": 0, "total_earned": 0, "total_spent": 0,
            "updated_at": now, "created_at": now,
        }),
        (settings.collection_user_streaks, {
            "user_id": uid, "current_streak": 0, "longest_streak": 0,
            "updated_at": now, "created_at": now,
        }),
    ]
    for collection, data in rows:
        try:
            db.create_document(db_id, collection, ID.unique(), data)
        except AppwriteException:
            logger.warning("could not initialise %s for %s", collection, uid, exc_info=True)


# ── Login ─────────────────────────────────────────────────────────────────────
async def login_user(email: str, password: str) -> dict:
    """Verify credentials, mint a JWT, and advance the login streak."""
    session = _verify_credentials(email, password)
    uid = session.get("userId") or session.get("user_id", "")

    profile = {}
    try:
        profile = db.get_document(settings.appwrite_database_id,
                                  settings.collection_users, uid)
    except AppwriteException:
        logger.warning("no profile document for %s at login", uid)

    if profile.get("is_banned"):
        raise PermissionError("This account has been suspended.")
    if profile.get("is_active") is False:
        raise PermissionError("This account has been deactivated.")

    # Signing in counts as activity for the daily streak.
    try:
        from app.services import mission_service
        await mission_service._update_streak(uid)
    except Exception:
        logger.warning("could not update login streak for %s", uid, exc_info=True)

    return {
        "user_id": uid,
        "email": email,
        "username": profile.get("username", ""),
        "jwt": _mint_jwt(uid),
        "expires_at": _expires_at(),
    }


async def get_google_oauth_url() -> str:
    """
    Returns the Appwrite Google OAuth URL.
    SETUP REQUIRED in Appwrite Console:
    1. Go to Auth → Providers → Google
    2. Enable Google provider
    3. Add Client ID and Client Secret from Google Cloud Console
    4. Authorized redirect URI in Google Console:
       {endpoint}/account/sessions/oauth2/callback/google/{project_id}
    """
    base = settings.appwrite_endpoint
    project = settings.appwrite_project_id
    success = f"{settings.frontend_url}/auth/callback"
    failure = f"{settings.frontend_url}/login?error=oauth_failed"
    return (
        f"{base}/account/sessions/oauth2/google"
        f"?project={project}"
        f"&success={success}"
        f"&failure={failure}"
    )


# ── Password recovery and change ──────────────────────────────────────────────
async def send_reset_email(email: str) -> dict:
    """
    Ask Appwrite to email a recovery link.

    Always reports success: telling an anonymous caller whether an address is
    registered is an account-enumeration oracle.
    """
    acct = Account(_keyless_client())
    reset_url = f"{settings.frontend_url}/reset-password"
    try:
        acct.create_recovery(email=email, url=reset_url)
    except AppwriteException as e:
        logger.info("recovery request for %s did not send: %s", email, e.message)
    return {"message": "If that address has an account, a reset link is on its way."}


async def change_password(user_id: str, old_password: str, new_password: str) -> dict:
    """
    Change a password after proving the current one.

    The old password is verified by attempting a session with it, because
    Users.update_password is a privileged call that would otherwise let a stolen
    JWT change the password without knowing the current one.
    """
    if old_password == new_password:
        raise ValueError("The new password must be different from the current one.")

    try:
        auth_user = users_svc.get(user_id=user_id)
    except AppwriteException as e:
        raise FileNotFoundError("Account not found.") from e

    _verify_credentials(auth_user["email"], old_password)   # raises on mismatch

    try:
        users_svc.update_password(user_id=user_id, password=new_password)
    except AppwriteException as e:
        raise ValueError(f"Could not update the password: {e.message}") from e

    logger.info("password changed for %s", user_id)
    return {"message": "Password updated."}


# ── Deletion ──────────────────────────────────────────────────────────────────
async def delete_account(user_id: str) -> dict:
    """
    Deactivate the profile, then remove the auth account.

    The profile is soft-deleted rather than dropped so that content already
    denormalised onto posts, comments and squads keeps resolving to a name
    instead of becoming an orphan.
    """
    db_id = settings.appwrite_database_id
    try:
        db.update_document(db_id, settings.collection_users, user_id, {
            "is_active": False,
            "is_open_to_recruit": False,
            "updated_at": now_iso(),
        })
    except AppwriteException:
        logger.warning("no profile to deactivate for %s; deleting the auth account anyway",
                       user_id, exc_info=True)

    try:
        users_svc.delete(user_id=user_id)
    except AppwriteException as e:
        raise ValueError(f"Could not delete the account: {e.message}") from e

    logger.info("account deleted for %s", user_id)
    return {"message": "Account deleted."}


async def username_taken(username: str) -> bool:
    """
    Whether a username is already registered.

    Compared case-insensitively by lowering both sides, because the unique index
    on profiles.username is exact and two accounts differing only in case would
    otherwise both be allowed through.
    """
    wanted = username.strip().lower()
    if not wanted:
        return True
    res = db.list_documents(
        settings.appwrite_database_id, settings.collection_users,
        queries=[Query.equal("username", wanted), Query.limit(1)],
    )
    return int(res.get("total", 0)) > 0
