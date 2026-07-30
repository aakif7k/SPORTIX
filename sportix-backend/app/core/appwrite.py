"""
Server-side Appwrite clients.

SDK version is pinned to >=15.3.0,<16.0.0 in requirements.txt, and the bound at
each end is load-bearing:

* Below 15.x (the repo previously pinned >=6.0.0, resolving to 6.1.0) the SDK
  serialises an empty JSON body onto GET requests. Appwrite Cloud >= 1.8 rejects
  that with 400 "request cannot have request body", so every read fails.
* From 16.0.0 the SDK returns typed pydantic models whose to_dict() nests a
  document's own attributes under a "data" key rather than flattening them
  alongside $id/$createdAt. Every service in app/services reads the flat shape
  (doc["author_id"], res["documents"]), so adopting 16+ means rewriting all of
  them plus the response envelope.

15.3.0 is the newest release that both talks to current Cloud and returns flat
dicts with integer `total` values.

Appwrite 1.8 renamed Databases to TablesDB (collections -> tables, documents ->
rows). The Databases service is deprecated but fully functional, and verified to
operate on this project's tablesdb-type database -- resources it creates are
visible through both list_collections and list_tables. Migrating to TablesDB is
deferred to a later phase.

Every deprecated call emits a DeprecationWarning to stderr. Neither
warnings.filterwarnings nor a blanket simplefilter suppresses it -- the
Deprecated decorator the SDK uses emits in a way that escapes the filter list --
so the noise is left in place rather than adding code that looks like it silences
it but does not. Route it through logging.captureWarnings(True) when structured
logging lands, or run with `python -W ignore::DeprecationWarning`.
"""
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
