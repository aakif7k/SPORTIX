from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings


async def get_for_user(user_id: str, page: int, limit: int, unread_only: bool) -> dict:
    queries = [Q.equal("user_id", user_id), Q.limit(limit), Q.offset(page * limit), Q.order_desc("$createdAt")]
    if unread_only:
        queries.append(Q.equal("is_read", False))
    return db.list_documents(DB_ID, settings.collection_notifications, queries=queries)


async def get_unread_count(user_id: str) -> int:
    res = db.list_documents(
        DB_ID, settings.collection_notifications,
        queries=[Q.equal("user_id", user_id), Q.equal("is_read", False), Q.limit(1)],
    )
    return res.get("total", 0)


async def create_notification(
    user_id: str,
    notif_type: str,
    title: str,
    body: str,
    reference_id: str = None,
    reference_type: str = None,
) -> dict:
    return db.create_document(
        DB_ID, settings.collection_notifications, ID.unique(),
        data={
            "user_id": user_id,
            "type": notif_type,
            "title": title,
            "body": body,
            "entity_id": reference_id,
            "entity_type": reference_type,
            "is_read": False,
        },
    )


async def mark_read(notification_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_notifications, notification_id)
    if doc.get("user_id") != user_id:
        raise PermissionError("Not your notification")
    db.update_document(DB_ID, settings.collection_notifications, notification_id, {"is_read": True})


async def mark_all_read(user_id: str):
    res = db.list_documents(
        DB_ID, settings.collection_notifications,
        queries=[Q.equal("user_id", user_id), Q.equal("is_read", False), Q.limit(100)],
    )
    for doc in res.get("documents", []):
        db.update_document(DB_ID, settings.collection_notifications, doc["$id"], {"is_read": True})


async def delete(notification_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_notifications, notification_id)
    if doc.get("user_id") != user_id:
        raise PermissionError("Not your notification")
    db.delete_document(DB_ID, settings.collection_notifications, notification_id)
