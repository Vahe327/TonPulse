from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime


class UserResponse(BaseModel):
    id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    wallet_address: Optional[str] = None
    language: str = "en"
    default_slippage: Decimal = Decimal("1.0")
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    wallet_address: Optional[str] = None
    language: Optional[str] = Field(None, pattern=r"^(en|ru)$")
    default_slippage: Optional[Decimal] = Field(None, ge=Decimal("0.1"), le=Decimal("50.0"))


class TelegramUserData(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = None
    photo_url: Optional[str] = None
