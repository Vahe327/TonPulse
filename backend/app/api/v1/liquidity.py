import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.liquidity_service import liquidity_service
from app.schemas.liquidity import (
    PoolResponse,
    PoolListResponse,
    LiquiditySimulateRequest,
    LiquiditySimulateResponse,
    LiquidityBuildRequest,
    LiquidityBuildResponse,
    RefundBuildRequest,
    LPPositionsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["liquidity"])


@router.get("/pools", response_model=PoolListResponse)
async def list_pools(
    search: Optional[str] = Query(None, description="Search by token symbol, name, or address"),
    sort_by: str = Query("tvl_usd", description="Sort field: tvl_usd, volume_24h_usd, apr_24h, fee_rate"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    limit: int = Query(50, ge=1, le=200, description="Number of pools to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
):
    try:
        result = await liquidity_service.get_pools(
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
        )
        return result
    except Exception as e:
        logger.error("Failed to list pools: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch pools: {e}")


@router.get("/pools/{address}", response_model=PoolResponse)
async def get_pool_detail(address: str):
    try:
        pool = await liquidity_service.get_pool(address)
    except Exception as e:
        logger.error("Failed to get pool %s: %s", address, e)
        raise HTTPException(status_code=502, detail=f"Failed to fetch pool: {e}")

    if pool is None:
        raise HTTPException(status_code=404, detail="Pool not found")

    return pool


@router.post("/liquidity/simulate", response_model=LiquiditySimulateResponse)
async def simulate_liquidity_provision(request: LiquiditySimulateRequest):
    try:
        result = await liquidity_service.simulate_provision(request)
        return result
    except Exception as e:
        logger.error("Failed to simulate liquidity provision: %s", e)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to simulate liquidity provision: {e}",
        )


@router.post("/liquidity/build-transaction", response_model=LiquidityBuildResponse)
async def build_liquidity_transaction(request: LiquidityBuildRequest):
    try:
        result = await liquidity_service.build_provision_transaction(request)
        return result
    except Exception as e:
        logger.error("Failed to build liquidity transaction: %s", e)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to build liquidity transaction: {e}",
        )


@router.post("/liquidity/build-refund-transaction", response_model=LiquidityBuildResponse)
async def build_refund_transaction(request: RefundBuildRequest):
    try:
        result = await liquidity_service.build_refund_transaction(request)
        return result
    except Exception as e:
        logger.error("Failed to build refund transaction: %s", e)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to build refund transaction: {e}",
        )


@router.get("/liquidity/positions", response_model=LPPositionsResponse)
async def get_lp_positions(
    wallet: str = Query(..., description="Wallet address to fetch LP positions for"),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await liquidity_service.get_user_positions(
            wallet_address=wallet,
            db=db,
        )
        return result
    except Exception as e:
        logger.error("Failed to get LP positions for %s: %s", wallet, e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch LP positions: {e}",
        )
