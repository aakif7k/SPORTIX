import uuid
import json
from typing import Dict, List
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        # Map squad_id (as str) to list of WebSocket connections for chat rooms
        self.chat_connections: Dict[str, List[WebSocket]] = {}
        # Map user_id (as UUID) to active WebSocket connection for notifications
        self.notification_connections: Dict[uuid.UUID, WebSocket] = {}

    # ─── SQUAD CHAT ROOMS ───
    async def connect_chat(self, squad_id: str, websocket: WebSocket):
        await websocket.accept()
        if squad_id not in self.chat_connections:
            self.chat_connections[squad_id] = []
        self.chat_connections[squad_id].append(websocket)

    def disconnect_chat(self, squad_id: str, websocket: WebSocket):
        if squad_id in self.chat_connections:
            if websocket in self.chat_connections[squad_id]:
                self.chat_connections[squad_id].remove(websocket)
            if not self.chat_connections[squad_id]:
                del self.chat_connections[squad_id]

    async def broadcast_chat(self, squad_id: str, message: dict):
        if squad_id in self.chat_connections:
            # We serialize standard Python datetime or UUID to string inside the callers,
            # but to be safe we use json.dumps
            message_json = json.dumps(message)
            for connection in self.chat_connections[squad_id]:
                try:
                    await connection.send_text(message_json)
                except Exception:
                    pass

    # ─── LIVE NOTIFICATIONS ───
    async def connect_notifications(self, user_id: uuid.UUID, websocket: WebSocket):
        await websocket.accept()
        self.notification_connections[user_id] = websocket

    def disconnect_notifications(self, user_id: uuid.UUID):
        if user_id in self.notification_connections:
            del self.notification_connections[user_id]

    async def send_notification_to_user(self, user_id: uuid.UUID, notification: dict):
        websocket = self.notification_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_text(json.dumps(notification))
            except Exception:
                self.disconnect_notifications(user_id)

ws_manager = WebSocketManager()
