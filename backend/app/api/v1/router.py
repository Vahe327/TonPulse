from fastapi import APIRouter

from app.api.v1.tokens import router as tokens_router
from app.api.v1.swap import router as swap_router
from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.user import router as user_router
from app.api.v1.ai import router as ai_router
from app.api.v1.liquidity import router as liquidity_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(tokens_router)
api_v1_router.include_router(swap_router)
api_v1_router.include_router(portfolio_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(transactions_router)
api_v1_router.include_router(user_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(liquidity_router)
