"""
sports_role_service.py
Service for querying and retrieving SPORTiX sports roles.
"""
from typing import List, Optional, Dict, Any
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.seed_sports_roles import SPORTS_ROLE_DATASET
from appwrite.query import Query


def _format_doc(doc: Any) -> Dict[str, Any]:
    data = doc.data if hasattr(doc, "data") else (doc if isinstance(doc, dict) else getattr(doc, "__dict__", {}))
    role_1 = data.get("role_1") or ""
    role_2 = data.get("role_2") or ""
    role_3 = data.get("role_3") or ""
    role_4 = data.get("role_4") or ""
    roles = [r for r in [role_1, role_2, role_3, role_4] if r]

    r1_count = int(data.get("role_1_count", 1))
    r2_count = int(data.get("role_2_count", 1))
    r3_count = int(data.get("role_3_count", 1))
    r4_count = int(data.get("role_4_count", 1))
    total_p = int(data.get("total_players", 1))

    return {
        "sport_id": data.get("sport_id"),
        "sport": data.get("sport"),
        "roles": roles,
        "role_1": role_1,
        "role_1_count": r1_count,
        "role_2": role_2,
        "role_2_count": r2_count,
        "role_3": role_3,
        "role_3_count": r3_count,
        "role_4": role_4,
        "role_4_count": r4_count,
        "total_players": total_p,
        "created_at": data.get("created_at") or data.get("$createdAt"),
        "updated_at": data.get("updated_at") or data.get("$updatedAt"),
    }


def get_all_sports_roles() -> List[Dict[str, Any]]:
    """
    Retrieve all sports roles from the database collection.
    Falls back to dataset if database is unreachable.
    """
    collection = settings.collection_sports_roles
    try:
        res = db.list_documents(DB_ID, collection, queries=[Query.limit(100)])
        documents = res.get("documents", []) if isinstance(res, dict) else getattr(res, "documents", [])
        if documents and len(documents) > 0:
            # Sort by sport_id (S001 -> S030)
            sorted_docs = sorted(documents, key=lambda d: d.get("sport_id", ""))
            return [_format_doc(d) for d in sorted_docs]
    except Exception as e:
        print(f"[!] Warning reading sportix_sport_roles from Appwrite: {e}")

    # Fallback to local dataset
    return [_format_doc(item) for item in SPORTS_ROLE_DATASET]


def get_sport_role_by_id(identifier: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a sport role by sport_id (e.g. 'S001') or sport name (e.g. 'Football').
    """
    identifier_clean = identifier.strip()
    collection = settings.collection_sports_roles

    # Try querying by sport_id
    try:
        # First try direct document ID
        doc_id = f"s_{identifier_clean.lower()}"
        try:
            doc = db.get_document(DB_ID, collection, doc_id)
            if doc:
                return _format_doc(doc)
        except Exception:
            pass

        # Try searching by sport_id or sport name
        res = db.list_documents(
            DB_ID,
            collection,
            queries=[
                Query.equal("sport_id", identifier_clean.upper()),
                Query.limit(1)
            ]
        )
        docs = res.get("documents", []) if isinstance(res, dict) else getattr(res, "documents", [])
        if docs:
            return _format_doc(docs[0])

        # Try case-insensitive sport name match
        all_roles = get_all_sports_roles()
        for r in all_roles:
            if r["sport"].lower() == identifier_clean.lower() or r["sport_id"].lower() == identifier_clean.lower():
                return r
    except Exception as e:
        print(f"[!] Error in get_sport_role_by_id: {e}")

    # Fallback to local dataset
    for item in SPORTS_ROLE_DATASET:
        if (
            item["sport_id"].lower() == identifier_clean.lower()
            or item["sport"].lower() == identifier_clean.lower()
        ):
            return _format_doc(item)

    return None
