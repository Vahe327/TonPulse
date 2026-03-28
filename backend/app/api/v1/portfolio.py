from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.portfolio_service import portfolio_service
from app.schemas.portfolio import PortfolioResponse

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=PortfolioResponse)
async def get_portfolio(wallet: str = Query(..., description="TON wallet address")):
    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet address required")

    portfolio = await portfolio_service.get_portfolio(wallet)
    return portfolio
