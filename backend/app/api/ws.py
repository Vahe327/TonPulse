import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import redis.asyncio as aioredis

from app.redis_client import get_redis
from app.utils.telegram import validate_init_data, TelegramAuthError

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@router.websocket("/api/v1/ws/prices")
async def websocket_prices(
    websocket: WebSocket,
    initData: str = Query(default=""),
):
    if initData:
        try:
            validate_init_data(initData)
        except TelegramAuthError:
            await websocket.close(code=4001, reason="Invalid initData")
            return

    await manager.connect(websocket)

    r = get_redis()
    pubsub = r.pubsub()
    await pubsub.subscribe("price_updates")

    try:
        async def listen_redis():
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    try:
                        await websocket.send_text(data)
                    except Exception:
                        break

        async def listen_client():
            while True:
                try:
                    data = await websocket.receive_text()
                    msg = json.loads(data)
                    if msg.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
                except WebSocketDisconnect:
                    break
                except Exception:
                    break

        await asyncio.gather(
            listen_redis(),
            listen_client(),
            return_exceptions=True,
        )
    finally:
        manager.disconnect(websocket)
        await pubsub.unsubscribe("price_updates")
        await pubsub.aclose()
