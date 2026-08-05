import logging
from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.core.dependencies import get_current_user
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from appwrite.query import Query as Q

logger = logging.getLogger(__name__)

router = APIRouter()


def _search(collection: str, fields: list[str], q: str, limit: int,
            sport_field: str | None = None, sport: str | None = None) -> list[dict]:
    """
    Fulltext search across several fields, merged and deduplicated.

    Appwrite has no OR across two Q.search calls, so each field is one query and
    the results are merged here. The merge is round-robin, not concatenation: with
    concatenation the first field could fill the limit on its own and every match
    from a later field was truncated away, so searching a person by name found
    nobody as soon as twenty usernames also matched. Round-robin keeps the first
    field ranked highest while guaranteeing later fields are represented.

    Failures were previously swallowed into an empty list, which is
    indistinguishable from "nothing matched": a missing fulltext index would have
    made a whole entity type permanently unsearchable with nothing to show it.
    They are logged now.
    """
    # ?sport= was accepted and then ignored on every branch, so a caller
    # filtering by sport quietly got everything.
    extra = [Q.equal(sport_field, sport)] if sport_field and sport else []

    per_field: list[list[dict]] = []
    for field in fields:
        try:
            res = db.list_documents(DB_ID, collection, queries=[
                Q.search(field, q), *extra, Q.limit(limit),
            ])
        except Exception:
            logger.warning("search on %s.%s failed", collection, field, exc_info=True)
            continue
        per_field.append(res.get("documents", []))

    merged: dict[str, dict] = {}
    for rank in range(limit):
        for docs in per_field:
            if rank < len(docs):
                merged.setdefault(docs[rank]["$id"], docs[rank])
        if len(merged) >= limit:
            break
    return list(merged.values())[:limit]


@router.get("/")
async def global_search(
    q: str = Query(..., min_length=1),
    type: Optional[str] = Query(None, description="users|posts|events|squads"),
    sport: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    user=Depends(get_current_user),
):
    """
    Multi-entity search across users, posts, events, and squads.
    Pass ?type= to restrict to a single entity type.
    """
    results = {}

    if not type or type == "users":
        # full_name as well as username: a person picker is used by typing a
        # name, and only username was being matched.
        results["users"] = _search(
            settings.collection_users, ["username", "full_name"], q, limit,
            "sport", sport)

    if not type or type == "posts":
        results["posts"] = _search(settings.collection_posts, ["content"], q, limit,
                                   "sport_tag", sport)

    if not type or type == "events":
        results["events"] = _search(settings.collection_events, ["title"], q, limit,
                                    "sport", sport)

    if not type or type == "squads":
        results["squads"] = _search(settings.collection_squads, ["name"], q, limit,
                                    "sport", sport)

    return {"success": True, "data": results, "query": q}


@router.get("/sport-breakdown")
async def sport_breakdown(
    sports: str = Query(..., description="Comma-separated sport ids, max 20"),
    user=Depends(get_current_user),
):
    """
    How many athletes play each of the given sports.

    SearchPage's "Global Sports Breakdown" chart was Math.random() counts
    generated once at module load, labelled as global participation. Real numbers
    are cheap here: `sport` is indexed on profiles, so each sport is one query
    that reads only the total and no documents.

    The sport list comes from the caller because the taxonomy lives in the
    frontend (src/constants/sports.ts) and duplicating it server-side would give
    two lists to keep in step. It is capped so the request cannot fan out.
    """
    wanted = [s.strip() for s in sports.split(",") if s.strip()][:20]

    items = []
    for sport in wanted:
        try:
            res = db.list_documents(DB_ID, settings.collection_users, queries=[
                Q.equal("sport", sport), Q.equal("is_active", True), Q.limit(1),
            ])
            items.append({"sport": sport, "count": int(res.get("total") or 0)})
        except Exception:
            logger.warning("could not count athletes for %s", sport, exc_info=True)
            # Omitted rather than reported as zero: "no data" and "nobody plays
            # this" are different claims.
            continue

    return {"success": True, "data": {"items": items}}
