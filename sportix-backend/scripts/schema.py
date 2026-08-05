"""
Canonical SPORTiX Appwrite schema — the single source of truth.

Both scripts.provision_appwrite (creates) and scripts.verify_schema (asserts)
read this module, so they cannot drift apart.

Conventions
-----------
* Every attribute key is snake_case. Appwrite's own system fields ($id,
  $createdAt, $updatedAt, $permissions, $collectionId, $databaseId) are never
  redeclared here.
* A profiles document id IS the Appwrite auth user $id. There is no auth_uid.
* Every collection carries created_at (required) plus updated_at (optional),
  written by the server. $createdAt is used for ordering; created_at carries
  domain time where the two differ.

Two rules Appwrite imposes that the schema spec did not account for
--------------------------------------------------------------------
1. A required attribute may not declare a default value. Nine spec entries were
   written as both required and defaulted (e.g. events.status* def=upcoming).
   Attr flips those to optional-with-default, which preserves the intended
   behaviour, and records each one in ADJUSTMENTS so the change is visible
   rather than silent.
2. Appwrite cannot cap the length of an array attribute. The spec's
   `sports string[](20)` notation is kept as `array_cap` for documentation and
   for the server to enforce, but it is not a database constraint.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import Any

# ── Sizes ─────────────────────────────────────────────────────────────────────
ID = 40          # Appwrite ids are <= 36 chars
URL_ELEM = 2048  # element size for url-ish string arrays

# Populated by Attr.__post_init__ when a required+default pair is reconciled.
ADJUSTMENTS: list[str] = []


@dataclass
class Attr:
    key: str
    kind: str                      # string | enum | int | float | bool | datetime | url | email
    required: bool = False
    size: int | None = None
    elements: list[str] | None = None
    default: Any = None
    array: bool = False
    array_cap: int | None = None   # intended max length; not enforceable in Appwrite

    def __post_init__(self) -> None:
        if self.required and self.default is not None:
            ADJUSTMENTS.append(
                f"{self.key}: required+default is invalid in Appwrite; "
                f"made optional with default={self.default!r}"
            )
            self.required = False
        if self.array and self.required:
            # An array attribute cannot be required in Appwrite.
            ADJUSTMENTS.append(f"{self.key}: array attributes cannot be required; made optional")
            self.required = False


# ── Attribute constructors ────────────────────────────────────────────────────
def S(key, size, required=False, default=None):
    return Attr(key, "string", required, size=size, default=default)


def SA(key, cap, elem=ID, required=False):
    """String array. `cap` is the intended max length (documentation only)."""
    return Attr(key, "string", required, size=elem, array=True, array_cap=cap)


def E(key, elements, required=False, default=None):
    return Attr(key, "enum", required, elements=elements, default=default)


def I(key, required=False, default=None):
    return Attr(key, "int", required, default=default)


def F(key, required=False, default=None):
    return Attr(key, "float", required, default=default)


def B(key, default=None, required=False):
    return Attr(key, "bool", required, default=default)


def D(key, required=False):
    return Attr(key, "datetime", required)


def U(key, required=False):
    return Attr(key, "url", required)


def M(key, required=False):
    return Attr(key, "email", required)


def ID_(key, required=False):
    return Attr(key, "string", required, size=ID)


# ── Indexes ───────────────────────────────────────────────────────────────────
_PREFIX = {"key": "ix", "unique": "uq", "fulltext": "ft"}


@dataclass
class Index:
    type: str                       # key | unique | fulltext
    attributes: list[str]
    orders: list[str] | None = None

    @property
    def key(self) -> str:
        name = f"{_PREFIX[self.type]}_{'_'.join(self.attributes)}"
        if len(name) > 36:
            # Appwrite caps index keys at 36 chars. Truncate deterministically.
            digest = hashlib.sha1(name.encode()).hexdigest()[:6]
            name = f"{name[:29]}_{digest}"
        return name


def KEY(*attrs, orders=None):
    return Index("key", list(attrs), orders)


def UNIQUE(*attrs):
    return Index("unique", list(attrs))


def FULLTEXT(attr):
    return Index("fulltext", [attr])


def DESC(attr):
    return Index("key", [attr], ["DESC"])


# ── Collections ───────────────────────────────────────────────────────────────
# read: "users" grants Role.users() read (needed for realtime on shared data),
#       "none" grants no client permission at all (server API key bypasses).
# doc_security: per-document read grants attached by the server at create time.
@dataclass
class Collection:
    id: str
    name: str
    attrs: list[Attr]
    indexes: list[Index] = field(default_factory=list)
    read: str = "none"
    doc_security: bool = False

    def timestamps(self) -> list[Attr]:
        """created_at / updated_at, unless the collection declared them itself."""
        declared = {a.key for a in self.attrs}
        extra = []
        if "created_at" not in declared:
            extra.append(D("created_at", required=True))
        if "updated_at" not in declared:
            extra.append(D("updated_at"))
        return extra

    @property
    def all_attrs(self) -> list[Attr]:
        return self.attrs + self.timestamps()


EXPERIENCE = ["beginner", "amateur", "semi_pro", "pro", "elite"]

COLLECTIONS: list[Collection] = [
    # ── Identity ────────────────────────────────────────────────────────────
    Collection(
        "profiles", "Profiles", read="users",
        attrs=[
            S("full_name", 100, required=True), S("username", 30, required=True), M("email", required=True),
            E("role", ["athlete", "recruiter", "coach", "organizer", "admin"], required=True),
            S("sport", 50), SA("sports", 20, elem=50), S("position", 40),
            E("experience_level", EXPERIENCE, required=True),
            S("location", 120), S("city", 80), U("avatar_url"), U("cover_url"),
            S("bio", 500), U("highlight_video_url"),
            B("is_open_to_recruit", default=False), B("is_verified", default=False),
            B("is_active", default=True), B("is_onboarding_complete", default=False),
            # Admin moderation: the ban endpoint in routers/admin.py writes both.
            B("is_banned", default=False), S("ban_reason", 300),
            F("pulse_score", default=100), I("level", default=1),
            I("coins_balance", default=0), I("login_streak", default=0),
            I("followers_count", default=0), I("following_count", default=0), I("posts_count", default=0),
            S("notification_prefs", 2000), S("privacy", 2000), S("sport_preferences", 2000),
        ],
        indexes=[
            UNIQUE("username"), KEY("sport"), KEY("city"), KEY("role"),
            KEY("experience_level"), KEY("is_open_to_recruit"), DESC("pulse_score"),
            FULLTEXT("full_name"), FULLTEXT("username"),
        ],
    ),
    Collection(
        "followers", "Followers",
        attrs=[ID_("follower_id", required=True), ID_("following_id", required=True), D("created_at", required=True)],
        indexes=[UNIQUE("follower_id", "following_id"), KEY("follower_id"), KEY("following_id")],
    ),

    # ── Social ──────────────────────────────────────────────────────────────
    Collection(
        "posts", "Posts", read="users",
        attrs=[
            ID_("author_id", required=True), S("author_username", 30), S("author_full_name", 100),
            U("author_avatar_url"), S("author_sport", 50), I("author_level", default=1),
            S("content", 2000, required=True),
            SA("media_urls", 4, elem=URL_ELEM), SA("media_file_ids", 4),
            E("media_type", ["none", "image", "multi_image", "video"], required=True),
            E("post_type", ["general", "training", "highlights", "achievements", "events"], required=True),
            S("sport_tag", 50), S("location_tag", 120),
            I("likes_count", default=0), I("comments_count", default=0), I("shares_count", default=0),
            B("is_deleted", default=False), D("created_at", required=True),
        ],
        indexes=[
            KEY("author_id"), DESC("created_at"), KEY("post_type"),
            KEY("sport_tag"), KEY("is_deleted"), FULLTEXT("content"),
        ],
    ),
    Collection(
        "post_likes", "Post Likes",
        attrs=[ID_("post_id", required=True), ID_("user_id", required=True), D("created_at", required=True)],
        indexes=[UNIQUE("post_id", "user_id"), KEY("user_id")],
    ),
    Collection(
        "comments", "Comments", read="users",
        attrs=[
            ID_("post_id", required=True), ID_("author_id", required=True),
            S("author_name", 100), U("author_avatar_url"),
            S("author_username", 30),
            S("content", 500, required=True),
            B("is_deleted", default=False),
            D("created_at", required=True),
        ],
        indexes=[KEY("post_id"), DESC("created_at"), KEY("is_deleted")],
    ),
    Collection(
        "stories", "Stories", read="users",
        attrs=[
            ID_("author_id", required=True), S("author_username", 30), S("author_full_name", 100),
            U("author_avatar_url"), U("media_url", required=True), ID_("media_file_id"),
            E("media_type", ["image", "video"], required=True),
            S("caption", 300), S("sport_tag", 50), S("text_overlay", 200),
            I("view_count", default=0), D("created_at", required=True), D("expires_at", required=True),
        ],
        indexes=[KEY("author_id"), KEY("expires_at"), DESC("created_at")],
    ),
    Collection(
        "story_views", "Story Views",
        attrs=[ID_("story_id", required=True), ID_("viewer_id", required=True), D("created_at", required=True)],
        indexes=[UNIQUE("story_id", "viewer_id")],
    ),
    Collection(
        "reels", "Reels", read="users",
        attrs=[
            ID_("author_id", required=True), S("author_username", 30), S("author_full_name", 100),
            U("author_avatar_url"), S("author_sport", 50),
            U("video_url", required=True), ID_("video_file_id"),
            U("thumbnail_url"), ID_("thumbnail_file_id"),
            S("caption", 500), S("sport_tag", 50), S("music_label", 120),
            I("duration_seconds"),
            I("likes_count", default=0), I("comments_count", default=0), I("views_count", default=0),
            B("is_deleted", default=False), D("created_at", required=True),
        ],
        indexes=[KEY("author_id"), DESC("created_at"), KEY("sport_tag")],
    ),
    Collection(
        "reel_likes", "Reel Likes",
        attrs=[ID_("reel_id", required=True), ID_("user_id", required=True), D("created_at", required=True)],
        indexes=[UNIQUE("reel_id", "user_id")],
    ),

    # ── Events ──────────────────────────────────────────────────────────────
    Collection(
        "events", "Events", read="users",
        attrs=[
            S("title", 140, required=True), S("description", 2000), S("sport", 50, required=True),
            E("format", ["solo", "team", "tournament", "league"], required=True),
            E("skill_level", EXPERIENCE, required=True),
            ID_("organizer_id", required=True),
            S("venue", 200), S("location", 200),
            # Not in the spec's attribute list, but its index list declares
            # key(city). Added so that index has a column to reference.
            S("city", 80),
            F("lat"), F("lng"),
            D("starts_at", required=True), D("ends_at"), D("registration_deadline"),
            I("max_participants", required=True, default=10), I("min_participants"),
            I("current_participants", default=0),
            E("status", ["upcoming", "live", "completed", "cancelled"], required=True, default="upcoming"),
            U("banner_url"), ID_("banner_file_id"),
            E("banner_alignment", ["top", "center", "bottom"], default="center"),
            S("prize_pool", 80), S("entry_fee", 80),
            SA("rules", 20, elem=300), SA("tags", 15, elem=50),
            B("ai_team_available", default=False), B("ai_generated", default=False),
            # ManageEvent's Rules & Privacy tab has toggles for all three and no
            # columns to write them to, so every switch was local state that
            # reverted on navigation.
            B("is_public", default=True), B("is_invite_only", default=False),
            B("moderate_discussion", default=True),
            D("created_at", required=True),
        ],
        indexes=[
            KEY("sport"), KEY("status"), KEY("starts_at"), KEY("organizer_id"),
            KEY("format"), KEY("skill_level"), KEY("city"), FULLTEXT("title"),
        ],
    ),
    Collection(
        "event_participants", "Event Participants",
        attrs=[
            ID_("event_id", required=True), ID_("user_id", required=True),
            S("role", 40), ID_("crew_id"), ID_("squad_id"),
            E("entry_type", ["solo", "squad", "crew"], default="solo"),
            E("status", ["registered", "confirmed", "withdrawn"], default="registered"),
            D("joined_at", required=True),
        ],
        indexes=[UNIQUE("event_id", "user_id"), KEY("user_id"), KEY("event_id")],
    ),
    Collection(
        "event_comments", "Event Comments", read="users",
        attrs=[
            ID_("event_id", required=True), ID_("author_id", required=True),
            S("author_name", 100), U("author_avatar_url"),
            S("content", 1000, required=True), D("created_at", required=True),
        ],
        indexes=[KEY("event_id"), DESC("created_at")],
    ),
    Collection(
        "crews", "Crews", read="users",
        attrs=[
            ID_("event_id", required=True), S("name", 80, required=True), ID_("captain_id", required=True),
            U("logo_url"), I("members_count", default=1), D("created_at", required=True),
        ],
        indexes=[KEY("event_id")],
    ),
    Collection(
        "crew_members", "Crew Members",
        attrs=[
            ID_("crew_id", required=True), ID_("user_id", required=True),
            S("role", 40), S("position", 40), D("joined_at", required=True),
        ],
        indexes=[UNIQUE("crew_id", "user_id"), KEY("crew_id")],
    ),

    # ── Squads ──────────────────────────────────────────────────────────────
    Collection(
        "squads", "Squads", read="users",
        attrs=[
            S("name", 80, required=True), S("sport", 50, required=True), ID_("captain_id", required=True),
            U("logo_url"), ID_("logo_file_id"),
            S("formation", 20), S("tactical_notes", 1000),
            I("max_members", default=11), I("members_count", default=1),
            F("win_rate", default=0), F("chemistry_score", default=0), F("pulse_avg", default=0),
            F("trust", default=0), F("coordination", default=0), F("communication", default=0),
            I("matches_played", default=0), I("wins", default=0), I("losses", default=0), I("draws", default=0),
            B("xp_boost_active", default=False), F("streak_multiplier", default=1),
            D("last_active"), D("created_at", required=True),
        ],
        indexes=[KEY("captain_id"), KEY("sport"), DESC("chemistry_score"), FULLTEXT("name")],
    ),
    Collection(
        "squad_members", "Squad Members", read="users",
        attrs=[
            ID_("squad_id", required=True), ID_("user_id", required=True),
            E("role", ["captain", "vice", "strategist", "analyst", "recruiter", "member"], required=True),
            S("position", 40),
            E("readiness", ["ready", "maybe", "unavailable"], default="ready"),
            D("joined_at", required=True),
        ],
        indexes=[UNIQUE("squad_id", "user_id"), KEY("squad_id"), KEY("user_id")],
    ),
    Collection(
        "squad_messages", "Squad Messages", doc_security=True,
        attrs=[
            ID_("squad_id", required=True), ID_("sender_id", required=True),
            S("sender_name", 100), U("sender_avatar_url"), S("sender_role", 40),
            S("content", 2000, required=True),
            E("type", ["text", "announcement", "poll", "tactical", "achievement"], required=True),
            U("attachment_url"), S("poll_data", 2000), S("tactical_data", 1000),
            S("announcement_data", 1000), D("created_at", required=True),
        ],
        indexes=[KEY("squad_id"), DESC("created_at")],
    ),
    Collection(
        "leadership_votes", "Leadership Votes",
        attrs=[
            ID_("squad_id", required=True), ID_("candidate_id", required=True),
            ID_("voter_id", required=True), S("vote", 20, required=True), D("created_at", required=True),
        ],
        indexes=[UNIQUE("squad_id", "voter_id"), KEY("squad_id")],
    ),

    # ── Matches ─────────────────────────────────────────────────────────────
    Collection(
        "matches", "Matches",
        attrs=[
            ID_("event_id"), ID_("home_squad_id"), ID_("away_squad_id"), S("sport", 50, required=True),
            S("opponent_name", 120),
            E("result", ["pending", "win", "loss", "draw"], required=True, default="pending"),
            I("score_home"), I("score_away"),
            E("status", ["active", "completed", "cancelled"], required=True, default="active"),
            D("played_at"), F("chemistry_delta", default=0), D("created_at", required=True),
        ],
        indexes=[KEY("home_squad_id"), KEY("event_id"), DESC("played_at"), KEY("status")],
    ),
    Collection(
        "player_stats", "Player Stats",
        attrs=[
            ID_("match_id", required=True), ID_("user_id", required=True), S("sport", 50, required=True),
            S("stats_data", 4000, required=True),
            F("match_rating", required=True), B("is_mvp", default=False),
            U("media_proof_url"), ID_("media_proof_file_id"),
            E("validation_status", ["pending", "validated", "disputed", "partial"],
              required=True, default="pending"),
            I("confirm_votes", default=0), I("partial_votes", default=0), I("dispute_votes", default=0),
            F("pulse_earned", default=0), F("ssr_delta", default=0), F("chemistry_delta", default=0),
            D("submitted_at", required=True), D("created_at", required=True),
        ],
        indexes=[UNIQUE("match_id", "user_id"), KEY("user_id"), KEY("validation_status")],
    ),
    Collection(
        "stat_validations", "Stat Validations",
        attrs=[
            ID_("stat_id", required=True), ID_("validator_id", required=True),
            E("vote", ["confirm", "partial", "dispute"], required=True),
            S("reason", 500), D("created_at", required=True),
        ],
        indexes=[UNIQUE("stat_id", "validator_id"), KEY("stat_id")],
    ),
    Collection(
        "retention_votes", "Retention Votes",
        attrs=[
            ID_("match_id", required=True), ID_("voter_id", required=True), ID_("target_id", required=True),
            E("vote", ["definitely", "maybe", "no"], required=True), D("created_at", required=True),
        ],
        indexes=[UNIQUE("match_id", "voter_id", "target_id"), KEY("match_id")],
    ),

    # ── Pulse / levels ──────────────────────────────────────────────────────
    Collection(
        "pulse_scores", "Pulse Scores",
        attrs=[
            ID_("user_id", required=True), F("total_pulse", default=100),
            F("match_performance", default=0), F("consistency", default=0),
            F("team_chemistry", default=0), F("reliability", default=0),
            F("activity", default=0), F("leadership", default=0),
            E("tier", ["contender", "elite", "pulse_elite"], required=True, default="contender"),
            D("updated_at", required=True),
        ],
        indexes=[UNIQUE("user_id"), DESC("total_pulse")],
    ),
    Collection(
        "pulse_history", "Pulse History", doc_security=True,
        attrs=[
            ID_("user_id", required=True), F("delta", required=True), S("source", 40, required=True),
            S("reason", 300), F("score_after", required=True), ID_("reference_id"),
            D("created_at", required=True),
        ],
        indexes=[KEY("user_id"), DESC("created_at")],
    ),
    Collection(
        "user_levels", "User Levels",
        attrs=[
            ID_("user_id", required=True), I("current_level", default=1), F("current_pulse", default=100),
            F("pulse_for_next", default=150), F("total_pulse_ever", default=100),
            I("level_ups_count", default=0), S("prestige_rank", 40), D("updated_at", required=True),
        ],
        indexes=[UNIQUE("user_id"), DESC("current_level")],
    ),
    Collection(
        "level_history", "Level History",
        attrs=[
            ID_("user_id", required=True), I("old_level", required=True), I("new_level", required=True),
            D("created_at", required=True),
        ],
        indexes=[KEY("user_id")],
    ),

    # ── Coins ───────────────────────────────────────────────────────────────
    Collection(
        "user_coins", "User Coins",
        attrs=[
            ID_("user_id", required=True), I("balance", default=0),
            I("total_earned", default=0), I("total_spent", default=0), D("updated_at", required=True),
        ],
        indexes=[UNIQUE("user_id")],
    ),
    Collection(
        "coin_transactions", "Coin Transactions", doc_security=True,
        attrs=[
            ID_("user_id", required=True), I("amount", required=True),
            E("direction", ["credit", "debit"], required=True),
            S("source", 40, required=True), S("reason", 200),
            I("balance_after", required=True), D("created_at", required=True),
        ],
        indexes=[KEY("user_id"), DESC("created_at")],
    ),

    # ── Missions / streaks ──────────────────────────────────────────────────
    Collection(
        "daily_missions", "Daily Missions", read="users",
        attrs=[
            S("key", 50, required=True), S("title", 140, required=True), S("description", 500),
            I("reward_coins", required=True), F("reward_pulse", required=True),
            S("category", 40), I("target_count", default=1), B("is_active", default=True),
        ],
        indexes=[UNIQUE("key")],
    ),
    Collection(
        "user_missions", "User Missions", doc_security=True,
        attrs=[
            ID_("user_id", required=True), S("mission_key", 50, required=True),
            S("mission_date", 10, required=True),   # YYYY-MM-DD
            I("progress", default=0), I("target", default=1),
            B("is_claimed", default=False), D("claimed_at"), D("created_at", required=True),
        ],
        indexes=[UNIQUE("user_id", "mission_key", "mission_date"), KEY("user_id", "mission_date")],
    ),
    Collection(
        "user_streaks", "User Streaks",
        attrs=[
            ID_("user_id", required=True), I("current_streak", default=0), I("longest_streak", default=0),
            S("last_active_date", 10), D("updated_at", required=True),
        ],
        indexes=[UNIQUE("user_id")],
    ),

    # ── Badges ──────────────────────────────────────────────────────────────
    Collection(
        "badges", "Badges", read="users",
        attrs=[
            S("key", 50, required=True), S("name", 140, required=True), S("description", 500),
            S("icon", 10), S("category", 40),
            E("rarity", ["common", "rare", "epic", "legendary"], default="common"),
        ],
        indexes=[UNIQUE("key")],
    ),
    Collection(
        "user_badges", "User Badges", read="users",
        attrs=[
            ID_("user_id", required=True), S("badge_key", 50, required=True),
            D("earned_at", required=True), D("created_at", required=True),
        ],
        indexes=[UNIQUE("user_id", "badge_key"), KEY("user_id")],
    ),

    # ── Notifications / messaging ───────────────────────────────────────────
    Collection(
        "notifications", "Notifications", doc_security=True,
        attrs=[
            ID_("user_id", required=True),
            E("type", [
                "event_invite", "ai_match", "connection_request", "like", "comment",
                "match_reminder", "team_update", "achievement", "squad_invite",
                "stat_validated", "level_up", "mission_complete",
            ], required=True),
            S("title", 140, required=True), S("body", 500),
            ID_("actor_id"), S("actor_name", 100), U("actor_avatar_url"),
            ID_("entity_id"), S("entity_type", 30),
            B("is_read", default=False), D("created_at", required=True),
        ],
        indexes=[KEY("user_id"), KEY("user_id", "is_read"), DESC("created_at")],
    ),
    Collection(
        "conversations", "Conversations", doc_security=True,
        attrs=[
            SA("participant_ids", 10, required=False), B("is_event_chat", default=False),
            ID_("event_id"), S("event_name", 140),
            S("last_message", 300), D("last_message_at"), D("created_at", required=True),
        ],
        # No index on participant_ids: Appwrite rejects indexes on array
        # attributes. "Which conversations am I in" is answered through the
        # conversation_members join collection below, which IS indexed by user_id.
        # participant_ids stays as a convenience for rendering a thread header
        # without a second query, but must never be the basis of a lookup.
        indexes=[DESC("last_message_at")],
    ),
    Collection(
        "messages", "Messages", doc_security=True,
        attrs=[
            ID_("conversation_id", required=True), ID_("sender_id", required=True),
            S("content", 2000, required=True),
            U("media_url"), ID_("media_file_id"),
            E("media_type", ["image", "video", "file"]),
            SA("read_by", 10), D("created_at", required=True),
        ],
        indexes=[KEY("conversation_id"), DESC("created_at")],
    ),


    # ── Squad activity ──────────────────────────────────────────────────────
    # SquadOverview shipped UI for practice scheduling, a squad feed and squad
    # achievements with no collections behind any of them; the store faked all
    # three. These are those backends.
    Collection(
        "squad_events", "Squad Events", read="users",
        attrs=[
            ID_("squad_id", required=True), S("title", 140, required=True),
            E("type", ["practice", "match", "social"], required=True, default="practice"),
            D("starts_at", required=True), S("venue", 200),
            ID_("created_by", required=True),
            E("status", ["scheduled", "confirmed", "cancelled"], default="scheduled"),
            S("notes", 500), D("created_at", required=True),
        ],
        indexes=[KEY("squad_id"), KEY("starts_at"), KEY("status")],
    ),
    Collection(
        "squad_event_votes", "Squad Event Attendance", read="users",
        attrs=[
            ID_("squad_event_id", required=True), ID_("user_id", required=True),
            E("vote", ["yes", "maybe", "no"], required=True),
            D("created_at", required=True),
        ],
        indexes=[UNIQUE("squad_event_id", "user_id"), KEY("squad_event_id")],
    ),
    Collection(
        "squad_posts", "Squad Feed", read="users",
        attrs=[
            ID_("squad_id", required=True), ID_("author_id", required=True),
            S("author_name", 100), U("author_avatar_url"),
            S("content", 2000, required=True), U("media_url"),
            I("likes_count", default=0),
            B("is_deleted", default=False), D("created_at", required=True),
        ],
        indexes=[KEY("squad_id"), DESC("created_at"), KEY("is_deleted")],
    ),
    Collection(
        "squad_post_likes", "Squad Post Likes",
        attrs=[
            ID_("squad_post_id", required=True), ID_("user_id", required=True),
            D("created_at", required=True),
        ],
        indexes=[UNIQUE("squad_post_id", "user_id")],
    ),
    Collection(
        "squad_achievements", "Squad Achievements", read="users",
        attrs=[
            ID_("squad_id", required=True), S("key", 50, required=True),
            S("name", 140, required=True), S("description", 500),
            S("icon", 10), D("unlocked_at", required=True),
            D("created_at", required=True),
        ],
        indexes=[UNIQUE("squad_id", "key"), KEY("squad_id")],
    ),
    Collection(
        # The join collection conversations needs. participant_ids is an array and
        # Appwrite cannot index arrays, so "which conversations am I in" had no
        # indexed answer -- see the note on the conversations collection.
        "conversation_members", "Conversation Members", doc_security=True,
        attrs=[
            ID_("conversation_id", required=True), ID_("user_id", required=True),
            D("last_read_at"), D("joined_at", required=True),
            D("created_at", required=True),
        ],
        indexes=[
            UNIQUE("conversation_id", "user_id"),
            KEY("user_id"), KEY("conversation_id"),
        ],
    ),

    # ── Tournaments ─────────────────────────────────────────────────────────
    Collection(
        "tournaments", "Tournaments", read="users",
        attrs=[
            S("name", 140, required=True), S("sport", 50, required=True),
            E("format", ["knockout", "league", "group_knockout"], required=True),
            E("status", ["registering", "in_progress", "full", "completed"],
              required=True, default="registering"),
            SA("squad_ids", 64), I("current_round", default=0),
            # TournamentHub's banner names the venue; there was no column for it,
            # so the page had "City Sports Complex" written into the markup.
            S("venue", 200),
            D("starts_at"), D("ends_at"), S("prize_pool", 80),
            I("max_squads", default=16), D("created_at", required=True),
        ],
        indexes=[KEY("sport"), KEY("status"), KEY("starts_at")],
    ),
    Collection(
        "tournament_matches", "Tournament Matches", read="users",
        attrs=[
            ID_("tournament_id", required=True), I("round", required=True), S("round_name", 60),
            ID_("squad_a_id"), S("squad_a_name", 80), I("squad_a_score"),
            ID_("squad_b_id"), S("squad_b_name", 80), I("squad_b_score"),
            ID_("winner_id"),
            E("status", ["tbd", "scheduled", "completed"], required=True, default="tbd"),
            D("scheduled_at"), D("created_at", required=True),
        ],
        indexes=[KEY("tournament_id"), KEY("round")],
    ),

    # ── AI / leaderboard ────────────────────────────────────────────────────
    Collection(
        "generated_squads", "Generated Squads",
        attrs=[
            ID_("request_id", required=True), S("squad_data", 8000, required=True),
            F("score"), I("rank"), D("created_at", required=True),
        ],
        indexes=[KEY("request_id")],
    ),
    Collection(
        "autosquad_requests", "AutoSquad Requests",
        attrs=[
            ID_("user_id", required=True), ID_("event_id"), S("sport", 50, required=True),
            S("skill_level", 40), S("params", 2000),
            E("status", ["pending", "completed", "accepted", "rejected"],
              required=True, default="pending"),
            S("reasoning", 2000), D("created_at", required=True),
        ],
        indexes=[KEY("user_id"), DESC("created_at")],
    ),
    Collection(
        "leaderboard", "Leaderboard", read="users",
        attrs=[
            ID_("user_id", required=True),
            E("scope", ["global", "city", "sport"], required=True), S("scope_value", 80),
            I("rank", required=True), F("score", required=True), S("period", 20),
            D("updated_at", required=True),
        ],
        indexes=[KEY("scope", "scope_value", "rank"), KEY("user_id")],
    ),
]


# ── Storage buckets ───────────────────────────────────────────────────────────
@dataclass
class Bucket:
    id: str
    name: str
    max_size_mb: int
    extensions: list[str]
    public_read: bool
    compression: str = "gzip"
    encryption: bool = True
    antivirus: bool = True


BUCKETS: list[Bucket] = [
    Bucket("sportix-images", "SPORTiX Images", 10,
           ["jpg", "jpeg", "png", "webp", "gif"], public_read=True),
    Bucket("sportix-videos", "SPORTiX Videos", 100,
           ["mp4", "mov", "webm"], public_read=True,
           # Appwrite's scanner rejects large files; disabled per spec.
           antivirus=False, encryption=False),
    Bucket("sportix-proofs", "SPORTiX Stat Proofs", 10,
           ["jpg", "jpeg", "png", "pdf"], public_read=False),
]


def summary() -> str:
    n_attrs = sum(len(c.all_attrs) for c in COLLECTIONS)
    n_idx = sum(len(c.indexes) for c in COLLECTIONS)
    return (f"{len(COLLECTIONS)} collections, {n_attrs} attributes, "
            f"{n_idx} indexes, {len(BUCKETS)} buckets")


if __name__ == "__main__":
    print(summary())
    if ADJUSTMENTS:
        print(f"\n{len(ADJUSTMENTS)} spec reconciliations:")
        for a in ADJUSTMENTS:
            print("  -", a)
    dupes = [c.id for c in COLLECTIONS if [x.id for x in COLLECTIONS].count(c.id) > 1]
    print("\nduplicate collection ids:", sorted(set(dupes)) or "none")
    for c in COLLECTIONS:
        keys = [a.key for a in c.all_attrs]
        arrays = {a.key for a in c.all_attrs if a.array}
        assert len(keys) == len(set(keys)), f"{c.id}: duplicate attribute keys"
        idx_keys = [i.key for i in c.indexes]
        assert len(idx_keys) == len(set(idx_keys)), f"{c.id}: duplicate index keys {idx_keys}"
        for i in c.indexes:
            for a in i.attributes:
                assert a in keys, f"{c.id}: index {i.key} references unknown attribute {a}"
                # Appwrite refuses to index an array column; catch it here rather
                # than as a failed API call halfway through provisioning.
                assert a not in arrays, (
                    f"{c.id}: index {i.key} targets array attribute {a}; "
                    f"Appwrite does not support indexes on arrays"
                )
            assert len(i.key) <= 36, f"{c.id}: index key too long: {i.key}"
    print("self-check: OK")
