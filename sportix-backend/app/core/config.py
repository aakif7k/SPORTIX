from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Appwrite ──────────────────────────────────────────────────────────────
    appwrite_endpoint: str = "https://sgp.cloud.appwrite.io/v1"
    appwrite_project_id: str
    appwrite_api_key: str
    appwrite_database_id: str = "6a5faf43003e0b2d9f34"

    # ── Storage buckets ───────────────────────────────────────────────────────
    # Split by media class so limits, allowed extensions and access differ:
    # images and videos are publicly readable, proofs are server-mediated only.
    appwrite_bucket_images: str = "sportix-images"
    appwrite_bucket_videos: str = "sportix-videos"
    appwrite_bucket_proofs: str = "sportix-proofs"

    @property
    def appwrite_storage_bucket_id(self) -> str:
        """
        DEPRECATED alias for the images bucket, kept so upload_service and the
        frontend keep working while call sites migrate to the explicit
        appwrite_bucket_* settings. Remove once nothing references it.
        """
        return self.appwrite_bucket_images

    # ── Collection IDs ────────────────────────────────────────────────────────
    collection_users: str = "profiles"
    collection_posts: str = "posts"
    collection_stories: str = "stories"
    collection_reels: str = "reels"
    collection_events: str = "events"
    collection_event_participants: str = "event_participants"
    collection_squads: str = "squads"
    collection_squad_members: str = "squad_members"
    collection_matches: str = "matches"
    collection_player_stats: str = "player_stats"
    collection_stat_validations: str = "stat_validations"
    collection_pulse_scores: str = "pulse_scores"
    collection_pulse_history: str = "pulse_history"
    collection_user_levels: str = "user_levels"
    collection_level_history: str = "level_history"
    collection_user_coins: str = "user_coins"
    collection_coin_transactions: str = "coin_transactions"
    collection_daily_missions: str = "daily_missions"
    collection_user_missions: str = "user_missions"
    collection_user_streaks: str = "user_streaks"
    collection_badges: str = "badges"
    collection_user_badges: str = "user_badges"
    collection_notifications: str = "notifications"
    collection_followers: str = "followers"
    collection_generated_squads: str = "generated_squads"
    collection_autosquad_requests: str = "autosquad_requests"
    collection_retention_votes: str = "retention_votes"
    collection_leaderboard: str = "leaderboard"
    collection_crews: str = "crews"
    collection_crew_members: str = "crew_members"
    collection_comments: str = "comments"
    collection_post_likes: str = "post_likes"
    collection_story_views: str = "story_views"
    collection_reel_likes: str = "reel_likes"

    # Collections introduced with the canonical schema (scripts/schema.py).
    # leadership_votes exists so squad leadership votes stop being written into
    # squad_members, which corrupted every member query.
    collection_event_comments: str = "event_comments"
    collection_squad_messages: str = "squad_messages"
    collection_leadership_votes: str = "leadership_votes"
    collection_conversations: str = "conversations"
    collection_messages: str = "messages"
    collection_tournaments: str = "tournaments"
    collection_tournament_matches: str = "tournament_matches"

    # Squad activity: practice scheduling, the squad feed and squad achievements
    # all had UI with no collection behind them.
    collection_squad_events: str = "squad_events"
    collection_squad_event_votes: str = "squad_event_votes"
    collection_squad_posts: str = "squad_posts"
    collection_squad_post_likes: str = "squad_post_likes"
    collection_squad_achievements: str = "squad_achievements"
    # Answers "which conversations am I in", which participant_ids cannot index.
    collection_conversation_members: str = "conversation_members"

    # ── App ───────────────────────────────────────────────────────────────────
    # No default: a missing SECRET_KEY must fail at startup rather than silently
    # falling back to a value an attacker can read in the repository.
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    max_upload_size_mb: int = 50
    max_autosquad_generations: int = 3

    # Comma-separated. Replaces the hardcoded CORS list so deployments do not
    # need a code change to add an origin.
    allowed_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # ── Google Gemini (server-side only) ──────────────────────────────────────
    # The key lives here and nowhere else. It was VITE_GEMINI_API_KEY in the
    # frontend env, which ships it to every visitor in the bundle for anyone to
    # read out and spend. Absent is a valid state: the AI endpoints report "not
    # configured" and the app degrades rather than erroring.
    gemini_api_key: str = ""

    @property
    def cors_origins(self) -> list[str]:
        origins = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        if self.frontend_url and self.frontend_url not in origins:
            origins.append(self.frontend_url)
        return origins

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in ("production", "prod")

    @model_validator(mode="after")
    def _reject_placeholder_secret_in_production(self) -> "Settings":
        placeholders = {
            "change-me-in-production",
            "your-super-secret-key-change-in-production",
            "",
        }
        if self.is_production and self.secret_key.strip() in placeholders:
            raise ValueError(
                "SECRET_KEY is still the placeholder value while ENVIRONMENT is "
                "production. Generate one with: python -c "
                "\"import secrets; print(secrets.token_urlsafe(48))\""
            )
        return self

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()