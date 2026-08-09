from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Appwrite ──────────────────────────────────────────────────────────────
    appwrite_endpoint: str = "https://sgp.cloud.appwrite.io/v1"
    appwrite_project_id: str
    appwrite_api_key: str
    appwrite_database_id: str = "6a5faf43003e0b2d9f34"
    appwrite_storage_bucket_id: str = "6a5faf1a000b5d9156b5"

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

    # ── AWS S3 (optional — only needed if you switch to S3) ──────────────────
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-southeast-2"
    aws_s3_bucket: str = "sportix-socialmedia"
    aws_s3_base_url: str = ""

    # ── App ───────────────────────────────────────────────────────────────────
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 50
    max_autosquad_generations: int = 5
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()