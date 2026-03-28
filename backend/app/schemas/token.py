from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class TokenResponse(BaseModel):
    address: str
    symbol: str
    name: str
    decimals: int = 9
    icon_url: Optional[str] = None
    price_usd: Optional[Decimal] = None
    price_ton: Optional[Decimal] = None
    change_24h: Optional[Decimal] = None
    volume_24h: Optional[Decimal] = None
    liquidity: Optional[Decimal] = None
    market_cap: Optional[Decimal] = None
    is_verified: bool = False

    model_config = {"from_attributes": True}


class TokenDetailResponse(TokenResponse):
    description_en: Optional[str] = None
    description_ru: Optional[str] = None
    updated_at: Optional[datetime] = None


class TokenPriceUpdate(BaseModel):
    address: str
    price_usd: Decimal
    price_ton: Optional[Decimal] = None
    change_24h: Optional[Decimal] = None
    volume_24h: Optional[Decimal] = None
    liquidity: Optional[Decimal] = None
