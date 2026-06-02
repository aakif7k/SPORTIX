import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status

from app.core.security import verify_token
from app.websockets.manager import ws_manager

router = APIRouter(prefix="/ws/notifications", tags=["websockets"])

@router.websocket("/{user_id}")
async def notifications_websocket(
    websocket: WebSocket,
    user_id: uuid.UUID,
    token: str = Query(..., description="JWT access token")
):
    # Authenticate token matches the user path
    user_id_str = verify_token(token, "access")
    if not user_id_str or uuid.UUID(user_id_str) != user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await ws_manager.connect_notifications(user_id, websocket)
    
    try:
        while True:
            # Keep connection alive, listen for ping/pong if needed
            # We don't expect any client-sent payloads for notifications
            data = await websocket.receive_text()
            
    except WebSocketDisconnect:
        ws_manager.disconnect_notifications(user_id)
    except Exception:
        ws_manager.disconnect_notifications(user_id)
        try:
            await websocket.close()
        except Exception:
            pass
