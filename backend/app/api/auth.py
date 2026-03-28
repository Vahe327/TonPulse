from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import TelegramUserData
from app.utils.telegram import validate_init_data, TelegramAuthError


async def get_telegram_user(request: Request) -> TelegramUserData:
    init_data = request.headers.get("X-Telegram-Init-Data", "")
    if not init_data:
        init_data = request.query_params.get("initData", "")

    if not init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Telegram initData",
        )

    try:
        user_data = validate_init_data(init_data)
    except TelegramAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    return user_data


async def get_current_user(
    telegram_user: TelegramUserData = Depends(get_telegram_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await db.get(User, telegram_user.id)

    if user is None:
        user = User(
            id=telegram_user.id,
            username=telegram_user.username,
            first_name=telegram_user.first_name,
            last_name=telegram_user.last_name,
            photo_url=telegram_user.photo_url,
            language="ru" if telegram_user.language_code == "ru" else "en",
        )
        db.add(user)
        await db.flush()
    else:
        user.username = telegram_user.username or user.username
        user.first_name = telegram_user.first_name or user.first_name
        user.last_name = telegram_user.last_name or user.last_name
        if telegram_user.photo_url:
            user.photo_url = telegram_user.photo_url

    return user
