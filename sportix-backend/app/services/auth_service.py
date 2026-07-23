from appwrite.services.account import Account
from appwrite.id import ID
from appwrite.query import Query
from app.core.appwrite import client, db
from app.core.config import settings
from app.schemas.user import UserCreate
from datetime import datetime

async def register_user(payload: UserCreate) -> dict:
    account_svc = Account(client)

    # Check username availability first
    try:
        existing = db.list_documents(
            settings.appwrite_database_id,
            settings.collection_users,
            queries=[Query.equal("username", [payload.username])]
        )
        if existing["total"] > 0:
            raise ValueError(
                "Username already taken. Choose another."
            )
    except ValueError:
        raise
    except Exception:
        pass  # Collection might be empty, that's fine

    # Create Appwrite auth account
    try:
        user = account_svc.create(
            user_id=ID.unique(),
            email=payload.email,
            password=payload.password,
            name=payload.full_name,
        )
    except Exception as e:
        error_msg = str(e).lower()
        if 'already exists' in error_msg or '409' in str(e):
            raise ValueError(
                "An account with this email already exists."
            )
        raise ValueError(f"Registration failed: {str(e)}")

    uid = user["$id"]

    # Create Appwrite session to get JWT
    try:
        session = account_svc.create_email_password_session(
            email=payload.email,
            password=payload.password,
        )
        jwt_token = session.get("secret", "")
    except Exception:
        jwt_token = ""

    db_id = settings.appwrite_database_id

    # Initialize user profile document
    try:
        db.create_document(
            db_id,
            settings.collection_users,
            document_id=uid,
            data={
                "auth_uid": uid,
                "email": payload.email,
                "username": payload.username.lower().strip(),
                "full_name": payload.full_name,
                "role": payload.role,
                "sport": payload.sport,
                "sports": payload.sports,
                "experience_level": payload.experience_level,
                "location": payload.location,
                "city": payload.city,
                "avatar_url": None,
                "bio": "",
                "is_open_to_recruit": False,
                "is_verified": False,
                "is_active": True,
                "level": 1,
                "pulse_score": 100,
            }
        )
    except Exception as e:
        print(f"Failed to create user profile: {e}")

    # Initialize pulse score at 100 (starting amount)
    try:
        db.create_document(
            db_id, settings.collection_pulse_scores,
            document_id=ID.unique(),
            data={
                "user_id": uid,
                "total_pulse": 100,
                "match_performance": 0,
                "consistency": 0,
                "team_chemistry": 0,
                "reliability": 0,
                "activity": 0,
                "leadership": 0,
            }
        )
    except Exception as e:
        print(f"Failed to create pulse score: {e}")

    # Initialize level at 1
    try:
        db.create_document(
            db_id, settings.collection_user_levels,
            document_id=ID.unique(),
            data={
                "user_id": uid,
                "current_level": 1,
                "current_pulse": 100,
                "pulse_for_next": 150,
                "total_pulse_ever": 100,
                "level_ups_count": 0,
                "prestige_rank": None,
            }
        )
    except Exception as e:
        print(f"Failed to create user level: {e}")

    # Initialize coins at ZERO
    try:
        db.create_document(
            db_id, settings.collection_user_coins,
            document_id=ID.unique(),
            data={
                "user_id": uid,
                "balance": 0,
                "total_earned": 0,
                "total_spent": 0,
            }
        )
    except Exception as e:
        print(f"Failed to create user coins: {e}")

    # Initialize streak at ZERO
    try:
        db.create_document(
            db_id, settings.collection_user_streaks,
            document_id=ID.unique(),
            data={
                "user_id": uid,
                "current_streak": 0,
                "longest_streak": 0,
                "last_active_date": None,
            }
        )
    except Exception as e:
        print(f"Failed to create user streak: {e}")

    return {
        "user_id": uid,
        "email": payload.email,
        "username": payload.username,
        "jwt": jwt_token,
        "message": "Account created successfully",
    }

async def get_google_oauth_url() -> str:
    """
    Returns the Appwrite Google OAuth URL.
    SETUP REQUIRED in Appwrite Console:
    1. Go to Auth → Providers → Google
    2. Enable Google provider
    3. Add Client ID and Client Secret
       from Google Cloud Console →
       APIs & Services → Credentials
    4. Authorized redirect URIs in Google Console:
       https://cloud.appwrite.io/v1/account/sessions/
       oauth2/callback/google/{YOUR_PROJECT_ID}
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