import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.redis_client import get_redis
from app.services.stonfi_service import stonfi_service
from app.services.token_service import token_service
from app.schemas.swap import (
    SwapQuoteResponse,
    SwapBuildRequest,
    SwapBuildResponse,
    SwapTokenInfo,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/swap", tags=["swap"])


@router.get("/pairs")
async def get_swap_pairs(token: str = Query(..., description="Token address to find pairs for")):
    r = get_redis()

    pairs_map_raw = await r.get("swap_pairs_map")
    if not pairs_map_raw:
        try:
            pools = await stonfi_service.get_pools()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to fetch pools: {e}")

        pairs_map: dict[str, set] = {}
        for pool in pools:
            t0 = pool.get("token0_address", "")
            t1 = pool.get("token1_address", "")
            if not t0 or not t1:
                continue
            reserve = float(pool.get("lp_total_supply_usd") or 0)
            if reserve < 1:
                continue
            if t0 not in pairs_map:
                pairs_map[t0] = set()
            if t1 not in pairs_map:
                pairs_map[t1] = set()
            pairs_map[t0].add(t1)
            pairs_map[t1].add(t0)

        serializable = {k: list(v) for k, v in pairs_map.items()}
        await r.setex("swap_pairs_map", 300, json.dumps(serializable))
    else:
        serializable = json.loads(pairs_map_raw)

    pairs = serializable.get(token, [])
    return {"token": token, "pairs": pairs}


@router.get("/quote", response_model=SwapQuoteResponse)
async def get_swap_quote(
    from_token: str,
    to_token: str,
    amount: str,
    slippage: float = 1.0,
    db: AsyncSession = Depends(get_db),
):
    from decimal import Decimal

    from_data = await token_service.get_token(from_token, db)
    to_data = await token_service.get_token(to_token, db)

    from_info = SwapTokenInfo(
        address=from_token,
        symbol=from_data["symbol"] if from_data else "???",
        name=from_data["name"] if from_data else "Unknown",
        decimals=from_data.get("decimals", 9) if from_data else 9,
        icon_url=from_data.get("icon_url") if from_data else None,
    )
    to_info = SwapTokenInfo(
        address=to_token,
        symbol=to_data["symbol"] if to_data else "???",
        name=to_data["name"] if to_data else "Unknown",
        decimals=to_data.get("decimals", 9) if to_data else 9,
        icon_url=to_data.get("icon_url") if to_data else None,
    )

    try:
        quote = await stonfi_service.get_swap_quote(
            from_address=from_token,
            to_address=to_token,
            amount=amount,
            slippage=Decimal(str(slippage)),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get quote: {str(e)}")

    pool_liquidity_usd = None
    try:
        pool = await stonfi_service.get_pool_for_pair(from_token, to_token)
        if pool:
            pool_liquidity_usd = pool.get("lp_total_supply_usd") or pool.get("reserve0_usd") or None
            if pool_liquidity_usd is not None:
                pool_liquidity_usd = str(pool_liquidity_usd)
    except Exception as e:
        logger.warning("Failed to fetch pool liquidity: %s", e)

    return SwapQuoteResponse(
        from_token=from_info,
        to_token=to_info,
        from_amount=quote["from_amount"],
        to_amount=quote["to_amount"],
        min_to_amount=quote["min_to_amount"],
        price_impact=quote["price_impact"],
        route=quote["route"],
        provider=quote["provider"],
        fee="0.3%",
        pool_liquidity_usd=pool_liquidity_usd,
    )


@router.post("/build-transaction", response_model=SwapBuildResponse)
async def build_swap_transaction(
    request: SwapBuildRequest,
):
    try:
        result = await stonfi_service.build_swap_transaction(
            from_address=request.from_token,
            to_address=request.to_token,
            amount=request.amount,
            slippage=request.slippage,
            sender_address=request.sender_address,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to build transaction: {str(e)}")

    return SwapBuildResponse(
        messages=[
            {"address": m["address"], "amount": m["amount"], "payload": m["payload"]}
            for m in result["messages"]
        ],
        valid_until=result["valid_until"],
    )
