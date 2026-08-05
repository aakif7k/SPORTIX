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


TablesDB, and why there is a shim
---------------------------------
Appwrite 1.8 renamed Databases to TablesDB: collections became tables, documents
became rows, and every `Databases` method is deprecated. The old service still
works — it operates correctly on this project's tablesdb-type database, and
resources it creates are visible through both list_collections and list_tables —
but it emitted a DeprecationWarning on every single call: 552 per test run, from
~350 call sites.

`TablesDBAdapter` below calls the supported TablesDB service while keeping the
method names the services already use. The alternative was rewriting 350 call
sites: a large mechanical diff across code whose only end-to-end check is the live
smoke test, for no behavioural gain. Wrapping the transport means one
well-understood surface changed and 350 sites left alone.

Two details it has to reconcile:

* TablesDB returns a list under `rows`; Databases returned `documents`. The adapter
  exposes **both keys pointing at the same list object**, so existing
  `res["documents"]` reads keep working and new code may use either. It is not
  quietly translating shapes — the same list is reachable by both names, so the two
  cannot disagree.
* `data` is passed by keyword to create_row/update_row, which every 15.x build
  accepts positionally or by keyword.

The provisioning and verification scripts still use `Databases` directly, through
get_schema_service(). Collection and attribute management is a different surface
(create_string_attribute and friends), those scripts run manually rather than per
request, and their warnings appear once per run rather than 552 times. Migrating
them is a separate, smaller job — and keeping it behind its own accessor means a
runtime service cannot reach a deprecated method by importing `db`.
"""
from typing import Any, Dict, List, Optional

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.tables_db import TablesDB
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


class TablesDBAdapter:
    """
    The document-shaped API the services speak, backed by TablesDB.

    Deliberately not a subclass of Databases: it exposes exactly the five methods
    the runtime uses, so a sixth deprecated method cannot be called by accident and
    quietly reintroduce the old path.
    """

    def __init__(self, client: Client) -> None:
        self._tables = TablesDB(client)

    # ── Reads ────────────────────────────────────────────────────────────────
    def list_documents(self, database_id: str, collection_id: str,
                       queries: Optional[List[str]] = None) -> Dict[str, Any]:
        res = self._tables.list_rows(database_id, collection_id, queries=queries)
        return self._with_both_keys(res)

    def get_document(self, database_id: str, collection_id: str,
                     document_id: str) -> Dict[str, Any]:
        return self._tables.get_row(database_id, collection_id, document_id)

    # ── Writes ───────────────────────────────────────────────────────────────
    def create_document(self, database_id: str, collection_id: str,
                        document_id: str, data: dict,
                        permissions: Optional[List[str]] = None) -> Dict[str, Any]:
        return self._tables.create_row(
            database_id, collection_id, document_id, data=data,
            permissions=permissions,
        )

    def update_document(self, database_id: str, collection_id: str,
                        document_id: str, data: Optional[dict] = None,
                        permissions: Optional[List[str]] = None) -> Dict[str, Any]:
        return self._tables.update_row(
            database_id, collection_id, document_id, data=data,
            permissions=permissions,
        )

    def delete_document(self, database_id: str, collection_id: str,
                        document_id: str) -> Dict[str, Any]:
        return self._tables.delete_row(database_id, collection_id, document_id)

    # ── Response normalisation ───────────────────────────────────────────────
    @staticmethod
    def _with_both_keys(res: Dict[str, Any]) -> Dict[str, Any]:
        """Make a list response readable as either `documents` or `rows`."""
        if not isinstance(res, dict):
            return res
        rows = res.get("rows")
        if rows is not None and "documents" not in res:
            res["documents"] = rows
        elif "documents" in res and rows is None:
            res["rows"] = res["documents"]
        return res


def get_database() -> TablesDBAdapter:
    return TablesDBAdapter(get_appwrite_client())


def get_schema_service() -> Databases:
    """
    The deprecated Databases service, for schema management only.

    Used by scripts/provision_appwrite.py and scripts/verify_schema.py. Kept behind
    its own accessor so nothing in app/ can reach a deprecated method by importing
    `db`.
    """
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
