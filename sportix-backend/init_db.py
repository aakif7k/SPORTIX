import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.appwrite import db, DB_ID
from app.core.config import settings

def init_db():
    print(f"Initializing Appwrite Database: {DB_ID}")
    
    # List of all collections from config
    collections_to_create = [
        settings.collection_users,
        settings.collection_posts,
        settings.collection_stories,
        settings.collection_reels,
        settings.collection_events,
        settings.collection_event_participants,
        settings.collection_squads,
        settings.collection_squad_members,
        settings.collection_matches,
        settings.collection_player_stats,
        settings.collection_stat_validations,
        settings.collection_pulse_scores,
        settings.collection_pulse_history,
        settings.collection_user_levels,
        settings.collection_level_history,
        settings.collection_user_coins,
        settings.collection_coin_transactions,
        settings.collection_daily_missions,
        settings.collection_user_missions,
        settings.collection_user_streaks,
        settings.collection_badges,
        settings.collection_user_badges,
        settings.collection_notifications,
        settings.collection_followers,
        settings.collection_generated_squads,
        settings.collection_autosquad_requests,
        settings.collection_retention_votes,
        settings.collection_leaderboard,
        settings.collection_crews,
        settings.collection_crew_members,
        settings.collection_comments,
        settings.collection_post_likes,
        settings.collection_story_views,
        settings.collection_reel_likes,
        settings.collection_sports_roles,
        "squad_messages",
        "event_comments",
        "conversations",
        "conversation_members"
    ]
    
    try:
        existing = db.list_collections(DB_ID)
        existing_names = {c.name: c.id for c in existing.collections} if hasattr(existing, 'collections') else {}
        if not existing_names and isinstance(existing, dict) and 'collections' in existing:
             existing_names = {c['name']: c['$id'] for c in existing['collections']}
             
        print(f"Found {len(existing_names)} existing collections.")
    except Exception as e:
        print("Error listing collections:", e)
        return

    for name in collections_to_create:
        if name in existing_names:
            print(f"[OK] Collection '{name}' already exists.")
        else:
            print(f"[..] Creating collection '{name}'...")
            try:
                # create_collection(database_id, collection_id, name)
                db.create_collection(DB_ID, name, name)
                print(f"[SUCCESS] Created collection '{name}' successfully.")
            except Exception as e:
                print(f"[ERROR] Failed to create '{name}': {e}")

if __name__ == "__main__":
    init_db()
