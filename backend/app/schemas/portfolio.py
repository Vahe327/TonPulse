from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal


class PortfolioPosition(BaseModel):
    token_address: str
    token_symbol: str
    token_name: str
    icon_url: Optional[str] = None
    balance: str
    balance_formatted: str
    value_usd: Decimal
    value_ton: Optional[Decimal] = None
    price_usd: Decimal
    change_24h: Optional[Decimal] = None
    pnl_usd: Optional[Decimal] = None
    pnl_percent: Optional[Decimal] = None
    portfolio_share: Decimal


class PortfolioResponse(BaseModel):
    total_usd: Decimal
    total_ton: Optional[Decimal] = None
    pnl_24h_usd: Optional[Decimal] = None
    pnl_24h_percent: Optional[Decimal] = None
    positions: List[PortfolioPosition]
