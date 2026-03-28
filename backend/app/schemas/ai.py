from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class TokenAnalysisRequest(BaseModel):
    token_address: str
    token_symbol: str
    token_name: str
    price_usd: float
    price_change_24h: Optional[float] = None
    price_change_7d: Optional[float] = None
    volume_24h: Optional[float] = None
    liquidity: Optional[float] = None
    market_cap: Optional[float] = None
    holder_count: Optional[int] = None


class TokenAnalysisResponse(BaseModel):
    summary: str
    risk_score: int = Field(ge=1, le=10)
    risk_factors: list[str]
    strengths: list[str]
    price_analysis: str
    liquidity_assessment: str
    volume_analysis: str
    outlook: str
    confidence: Literal["LOW", "MEDIUM", "HIGH"]
    cached: bool = False
    generated_at: str


class RiskScoreRequest(BaseModel):
    tokens: list[str] = Field(max_length=10)


class RiskScoreItem(BaseModel):
    address: str
    risk_score: int = Field(ge=1, le=10)


class RiskScoreResponse(BaseModel):
    scores: list[RiskScoreItem]
    cached_count: int = 0


class SwapInsightResponse(BaseModel):
    insight: str
    sentiment: Literal["positive", "neutral", "negative"]
    cached: bool = False


class ChatRequest(BaseModel):
    message: str = Field(max_length=1000)
    context: Optional[dict] = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatResponse(BaseModel):
    response: str
    requests_remaining: int


class ActionCardData(BaseModel):
    type: Literal[
        "connect_wallet", "buy_ton", "swap", "add_liquidity",
        "set_alert", "token_info", "portfolio_summary",
        "pool_recommendation", "education_step", "confirm_action",
    ]
    data: dict = {}


class SmartAssistantRequest(BaseModel):
    message: str = Field(max_length=2000)
    user_id: Optional[int] = None
    wallet_address: Optional[str] = None
    history: list[dict] = []


class SmartAssistantResponse(BaseModel):
    text: str
    actions: list[ActionCardData] = []
    remaining_requests: int = 10
    quick_actions: list[dict] = []


class AIRateLimitError(BaseModel):
    error: str
    requests_remaining: int = 0
    reset_in_seconds: int
