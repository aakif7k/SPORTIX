from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.users import Users
from appwrite.services.storage import Storage
from app.core.config import settings


def get_appwrite_client() -> Client:
    """Server-side Appwrite client using API key (full permissions)."""
    client = Client()
    client.set_endpoint(settings.appwrite_endpoint)
    client.set_project(settings.appwrite_project_id)
    client.set_key(settings.appwrite_api_key)
    return client


def get_database() -> Databases:
    return Databases(get_appwrite_client())


def get_users_service() -> Users:
    return Users(get_appwrite_client())


def get_storage() -> Storage:
    return Storage(get_appwrite_client())


# ── Singleton instances (reused across requests) ──────────────────────────────
client = get_appwrite_client()
db = get_database()
users_svc = get_users_service()
storage_svc = get_storage()

DB_ID = settings.appwrite_database_id
