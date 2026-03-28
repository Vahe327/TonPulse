from pydantic import BaseModel
from typing import Optional


class PoolTokenInfo(BaseModel):
    address: str
    symbol: str
    name: str
    icon_url: Optional[str] = None
    decimals: int = 9


class PoolResponse(BaseModel):
    address: str
    token_a: PoolTokenInfo
    token_b: PoolTokenInfo
    tvl_usd: float
    volume_24h_usd: float
    volume_7d_usd: Optional[float] = None
    fee_rate: str
    apr_24h: float
    apr_7d: Optional[float] = None
    apr_30d: Optional[float] = None
    token_a_reserve: str
    token_b_reserve: str
    lp_total_supply: str
    pool_type: str = "constant_product"
    deprecated: bool = False


class PoolListResponse(BaseModel):
    pools: list[PoolResponse]
    total: int
    offset: int
    limit: int


class LiquiditySimulateRequest(BaseModel):
    token_a_address: str
    token_b_address: str
    token_a_amount: str
    token_b_amount: str = "0"
    provision_type: str = "Balanced"
    pool_address: Optional[str] = None
    slippage: str = "0.01"
    sender_address: str


class LiquiditySimulateResponse(BaseModel):
    provision_type: str
    pool_address: Optional[str] = None
    token_a_units: str
    token_b_units: str
    estimated_lp_tokens: str
    min_lp_tokens: str
    price_impact: str
    share_of_pool: str
    token_a_value_usd: float
    token_b_value_usd: float
    total_value_usd: float


class LiquidityBuildRequest(BaseModel):
    token_a_address: str
    token_b_address: str
    token_a_amount: str
    token_b_amount: str = "0"
    provision_type: str = "Balanced"
    pool_address: Optional[str] = None
    slippage: str = "0.01"
    sender_address: str


class LiquidityBuildResponse(BaseModel):
    messages: list[dict]
    valid_until: int


class RefundBuildRequest(BaseModel):
    pool_address: str
    lp_amount: str
    min_token_a_out: str
    min_token_b_out: str
    sender_address: str


class LPPositionResponse(BaseModel):
    pool_address: str
    token_a: PoolTokenInfo
    token_b: PoolTokenInfo
    lp_balance: str
    share_of_pool: str
    token_a_amount: str
    token_b_amount: str
    total_value_usd: float
    pnl_usd: Optional[float] = None
    pnl_percent: Optional[float] = None
    fees_earned_usd: Optional[float] = None
    provision_type: str
    added_at: Optional[str] = None


class LPPositionsResponse(BaseModel):
    positions: list[LPPositionResponse]
    total_value_usd: float
    total_fees_earned_usd: float
