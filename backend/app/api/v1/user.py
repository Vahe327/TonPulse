from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/user", tags=["user"])


@router.get("", response_model=UserResponse)
async def get_user(user: User = Depends(get_current_user)):
    return user


@router.patch("", response_model=UserResponse)
async def update_user(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.wallet_address is not None:
        user.wallet_address = data.wallet_address
    if data.language is not None:
        user.language = data.language
    if data.default_slippage is not None:
        user.default_slippage = data.default_slippage
    await db.flush()
    return user
