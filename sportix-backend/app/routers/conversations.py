"""
Direct-message conversations.

The collections were provisioned in phase 2 and never served: there was no router
and no service, so MessagesPage rendered mock data with nowhere to send anything.
"""
from fastapi import APIRouter, Depends, Query, Request, Response

from app.core.dependencies import get_current_user
from app.core.rate_limit import limiter, WRITE_LIMIT
from app.schemas.message import ConversationCreate, MessageCreate
from app.services import messaging_service

router = APIRouter()


@router.get("/")
async def list_conversations(user=Depends(get_current_user)):
    """
    The caller's threads, most recently active first.

    Resolved through conversation_members, which is indexed by user_id;
    participant_ids is an array and Appwrite cannot index those.
    """
    data = await messaging_service.list_conversations(user["id"])
    return {"success": True, "data": data}


@router.post("/", status_code=201)
async def open_conversation(payload: ConversationCreate, user=Depends(get_current_user)):
    """
    Open the thread with another person, creating it only if it does not exist.

    Idempotent: opening a chat from a profile twice must not mint two threads.
    """
    data = await messaging_service.get_or_create_direct(user["id"], payload.user_id)
    return {"success": True, "data": data}


@router.get("/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    page: int = Query(0),
    limit: int = Query(50, le=100),
    user=Depends(get_current_user),
):
    data = await messaging_service.list_messages(conversation_id, user["id"], page, limit)
    return {"success": True, "data": data}


@router.post("/{conversation_id}/messages", status_code=201)
@limiter.limit(WRITE_LIMIT)
async def send_message(
    request: Request, response: Response,
    conversation_id: str, payload: MessageCreate,
    user=Depends(get_current_user),
):
    data = await messaging_service.send_message(
        conversation_id, user["id"], payload.content,
        payload.media_url, payload.media_type.value if payload.media_type else None,
    )
    return {"success": True, "data": data}


@router.post("/{conversation_id}/read")
async def mark_read(conversation_id: str, user=Depends(get_current_user)):
    """Move this member's read marker, which is what unread counts derive from."""
    data = await messaging_service.mark_read(conversation_id, user["id"])
    return {"success": True, "data": data}
