import json
import uuid
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.core.security import verify_token
from app.models.user import User
from app.models.message import Message
from app.websockets.manager import ws_manager

router = APIRouter(prefix="/ws/chat", tags=["websockets"])

@router.websocket("/{squad_id}")
async def squad_chat_websocket(
    websocket: WebSocket,
    squad_id: uuid.UUID,
    token: str = Query(..., description="JWT access token")
):
    # Authenticate token
    user_id_str = verify_token(token, "access")
    if not user_id_str:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    user_id = uuid.UUID(user_id_str)
    
    # Establish connection
    squad_str = str(squad_id)
    await ws_manager.connect_chat(squad_str, websocket)
    
    # Send system joining message
    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        username = user.username if user else "Athlete"
        
    try:
        while True:
            # Receive incoming text message
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            content = payload.get("content", "").strip()
            if not content:
                continue
                
            msg_type = payload.get("message_type", "text")
            attachment_url = payload.get("attachment_url")
            poll_data = payload.get("poll_data")
            
            # Save message to database
            async with AsyncSessionLocal() as db:
                message = Message(
                    id=uuid.uuid4(),
                    squad_id=squad_id,
                    sender_id=user_id,
                    content=content,
                    message_type=msg_type,
                    attachment_url=attachment_url,
                    poll_data=poll_data,
                    is_read=False,
                    created_at=datetime.utcnow()
                )
                db.add(message)
                await db.commit()
                
            # Broadcast message details to squad chat members
            broadcast_payload = {
                "id": str(message.id),
                "squad_id": squad_str,
                "sender_id": str(user_id),
                "sender_username": username,
                "content": content,
                "message_type": msg_type,
                "attachment_url": attachment_url,
                "poll_data": poll_data,
                "created_at": message.created_at.isoformat()
            }
            await ws_manager.broadcast_chat(squad_str, broadcast_payload)
            
    except WebSocketDisconnect:
        ws_manager.disconnect_chat(squad_str, websocket)
    except Exception:
        ws_manager.disconnect_chat(squad_str, websocket)
        try:
            await websocket.close()
        except Exception:
            pass
