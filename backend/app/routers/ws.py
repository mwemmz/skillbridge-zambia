import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..database import SessionLocal
from ..models import Worker
from ..security import decode_access_token

router = APIRouter()

# worker_id -> set of connected WebSockets (excluding the worker's own update feed)
connections: dict[int, set[WebSocket]] = {}


def _authenticated_user_id(token: str) -> int | None:
    try:
        payload = decode_access_token(token)
        return int(payload.get("sub"))
    except Exception:
        return None


@router.websocket("/ws/location/{worker_id}")
async def location_socket(worker_id: int, websocket: WebSocket, token: str = ""):
    await websocket.accept()

    db = SessionLocal()
    try:
        worker = db.get(Worker, worker_id)
        user_id = _authenticated_user_id(token)
        is_owner = bool(user_id and worker and worker.user_id == user_id)
    finally:
        db.close()

    connections.setdefault(worker_id, set()).add(websocket)
    try:
        # Tell a new viewer where the worker currently is.
        db = SessionLocal()
        try:
            worker = db.get(Worker, worker_id)
            if worker:
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "location",
                            "worker_id": worker_id,
                            "latitude": worker.latitude,
                            "longitude": worker.longitude,
                        }
                    )
                )
        finally:
            db.close()

        while True:
            message = await websocket.receive_text()
            if not is_owner:
                continue
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                continue

            if data.get("type") == "location":
                latitude = data.get("latitude")
                longitude = data.get("longitude")
                if latitude is None or longitude is None:
                    continue
                db = SessionLocal()
                try:
                    worker = db.get(Worker, worker_id)
                    if worker:
                        worker.latitude = latitude
                        worker.longitude = longitude
                        db.commit()
                finally:
                    db.close()
                broadcast = json.dumps(
                    {
                        "type": "location",
                        "worker_id": worker_id,
                        "latitude": latitude,
                        "longitude": longitude,
                    }
                )
                for client in list(connections.get(worker_id, set())):
                    if client is not websocket:
                        try:
                            await client.send_text(broadcast)
                        except Exception:
                            pass
    except WebSocketDisconnect:
        pass
    finally:
        connections.setdefault(worker_id, set()).discard(websocket)
