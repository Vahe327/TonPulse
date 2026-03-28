from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal


class SwapQuoteRequest(BaseModel):
    from_token: str
    to_token: str
    amount: str
    slippage: Decimal = Field(default=Decimal("1.0"), ge=Decimal("0.1"), le=Decimal("50.0"))


class SwapTokenInfo(BaseModel):
    address: str
    symbol: str
    name: str
    decimals: int
    icon_url: Optional[str] = None


class SwapQuoteResponse(BaseModel):
    from_token: SwapTokenInfo
    to_token: SwapTokenInfo
    from_amount: str
    to_amount: str
    min_to_amount: str
    price_impact: str
    route: List[str]
    provider: str = "STON.fi"
    fee: str = "0.3%"
    pool_liquidity_usd: Optional[str] = None


class SwapBuildRequest(BaseModel):
    from_token: str
    to_token: str
    amount: str
    slippage: Decimal = Field(default=Decimal("1.0"), ge=Decimal("0.1"), le=Decimal("50.0"))
    sender_address: str


class SwapTransactionMessage(BaseModel):
    address: str
    amount: str
    payload: str


class SwapBuildResponse(BaseModel):
    messages: List[SwapTransactionMessage]
    valid_until: int
