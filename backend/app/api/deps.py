from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.redis_client import get_redis
from app.api.auth import get_current_user, get_telegram_user
from app.models.user import User
from app.schemas.user import TelegramUserData


async def get_db_session() -> AsyncSession:
    async for session in get_db():
        yield session


def get_redis_client() -> aioredis.Redis:
    return get_redis()
