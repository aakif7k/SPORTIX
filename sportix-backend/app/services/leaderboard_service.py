from appwrite.query import Query as Q
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from typing import Optional


async def get_global(sport: Optional[str], page: int, limit: int) -> dict:
    queries = [Q.limit(limit), Q.offset(page * limit), Q.order_desc("total_pulse")]
    return db.list_documents(DB_ID, settings.collection_pulse_scores, queries=queries)


async def get_by_city(city: str, sport: Optional[str], page: int) -> dict:
    # Join through users collection to filter by city
    user_res = db.list_documents(
        DB_ID, settings.collection_users,
        queries=[Q.equal("city", city), Q.limit(100)],
    )
    city_user_ids = [u["$id"] for u in user_res.get("documents", [])]
    if not city_user_ids:
        return {"documents": [], "total": 0}
    queries = [Q.equal("user_id", city_user_ids), Q.limit(50), Q.offset(page * 50), Q.order_desc("total_pulse")]
    return db.list_documents(DB_ID, settings.collection_pulse_scores, queries=queries)


async def get_by_sport(sport: str, page: int) -> dict:
    user_res = db.list_documents(
        DB_ID, settings.collection_users,
        queries=[Q.equal("sport", sport), Q.limit(200)],
    )
    ids = [u["$id"] for u in user_res.get("documents", [])]
    if not ids:
        return {"documents": [], "total": 0}
    return db.list_documents(
        DB_ID, settings.collection_pulse_scores,
        queries=[Q.equal("user_id", ids), Q.order_desc("total_pulse"), Q.limit(50), Q.offset(page * 50)],
    )


async def get_user_rank(user_id: str, sport: Optional[str]) -> dict:
    pulse_res = db.list_documents(
        DB_ID, settings.collection_pulse_scores,
        queries=[Q.equal("user_id", user_id), Q.limit(1)],
    )
    user_pulse = 100.0
    if pulse_res.get("documents"):
        user_pulse = pulse_res["documents"][0].get("total_pulse", 100)

    # Count users with higher pulse
    all_higher = db.list_documents(
        DB_ID, settings.collection_pulse_scores,
        queries=[Q.greater_than("total_pulse", user_pulse), Q.limit(1)],
    )
    rank = all_higher.get("total", 0) + 1
    return {"rank": rank, "pulse": user_pulse, "user_id": user_id}
