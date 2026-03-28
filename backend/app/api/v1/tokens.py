import json
import logging
import time as time_mod

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.redis_client import get_redis
from app.services.token_service import token_service
from app.services.stonfi_service import stonfi_service
from app.schemas.token import TokenResponse, TokenDetailResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.get("", response_model=list[TokenResponse])
async def list_tokens(
    db: AsyncSession = Depends(get_db),
):
    tokens = await token_service.get_tokens(db)
    return tokens


@router.get("/{address}", response_model=TokenDetailResponse)
async def get_token(
    address: str,
    db: AsyncSession = Depends(get_db),
):
    token = await token_service.get_token(address, db)
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    return token


@router.get("/{address}/ohlcv")
async def get_token_ohlcv(
    address: str,
    timeframe: str = Query("day", description="day, hour4, hour1"),
):
    r = get_redis()
    cache_key = f"ohlcv:{address}:{timeframe}"
    cached = await r.get(cache_key)
    if cached:
        return json.loads(cached)

    tf_map = {"hour1": "hour", "hour4": "hour", "day": "day"}
    aggregate_map = {"hour1": 1, "hour4": 4, "day": 1}
    gecko_tf = tf_map.get(timeframe, "day")
    aggregate = aggregate_map.get(timeframe, 1)
    headers = {"Accept": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
            pool_cache_key = f"gecko_pool:{address}"
            pool_address = None
            pool_cached = await r.get(pool_cache_key)
            if pool_cached:
                pool_address = pool_cached.decode() if isinstance(pool_cached, bytes) else pool_cached
            else:
                pools_resp = await client.get(
                    f"https://api.geckoterminal.com/api/v2/networks/ton/tokens/{address}/pools",
                    params={"page": 1},
                    headers=headers,
                )
                if pools_resp.status_code == 200:
                    pools_data = pools_resp.json().get("data", [])
                    if pools_data:
                        pool_address = pools_data[0].get("attributes", {}).get("address", "")
                        if pool_address:
                            await r.setex(pool_cache_key, 3600, pool_address)

            if not pool_address:
                pool_from_stonfi = await stonfi_service.get_pool_for_pair(address, "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")
                if pool_from_stonfi:
                    stonfi_pool_addr = pool_from_stonfi.get("address", "")
                    if stonfi_pool_addr:
                        ohlcv_resp = await client.get(
                            f"https://api.geckoterminal.com/api/v2/networks/ton/pools/{stonfi_pool_addr}/ohlcv/{gecko_tf}",
                            params={"aggregate": aggregate, "limit": 100, "currency": "usd"},
                            headers=headers,
                        )
                        if ohlcv_resp.status_code == 200:
                            ohlcv_raw = ohlcv_resp.json()
                            ohlcv_attrs = ohlcv_raw.get("data", {}).get("attributes", {})
                            ohlcv_list = ohlcv_attrs.get("ohlcv_list", [])
                            if ohlcv_list:
                                candles = []
                                for c in ohlcv_list:
                                    if len(c) >= 6:
                                        candles.append({
                                            "time": int(c[0]),
                                            "open": float(c[1]),
                                            "high": float(c[2]),
                                            "low": float(c[3]),
                                            "close": float(c[4]),
                                            "volume": float(c[5]),
                                        })
                                candles.sort(key=lambda x: x["time"])
                                result = {"candles": candles, "timeframe": timeframe}
                                ttl = 60 if timeframe == "hour1" else 300
                                await r.setex(cache_key, ttl, json.dumps(result))
                                return result

                price_data = await r.get(f"price:{address}")
                if price_data:
                    p = json.loads(price_data)
                    price_usd = float(p.get("price_usd") or 0)
                    if price_usd > 0:
                        now = int(time_mod.time())
                        fake_candles = []
                        for i in range(24):
                            t = now - (24 - i) * 3600
                            fake_candles.append({
                                "time": t,
                                "open": price_usd,
                                "high": price_usd,
                                "low": price_usd,
                                "close": price_usd,
                                "volume": 0,
                            })
                        result = {"candles": fake_candles, "timeframe": timeframe}
                        await r.setex(cache_key, 120, json.dumps(result))
                        return result

                return {"candles": [], "timeframe": timeframe}

            resp = await client.get(
                f"https://api.geckoterminal.com/api/v2/networks/ton/pools/{pool_address}/ohlcv/{gecko_tf}",
                params={"aggregate": aggregate, "limit": 100, "currency": "usd"},
                headers=headers,
            )
            if resp.status_code == 200:
                raw = resp.json()
                attrs = raw.get("data", {}).get("attributes", {})
                ohlcv_list = attrs.get("ohlcv_list", [])

                candles = []
                for c in ohlcv_list:
                    if len(c) >= 6:
                        candles.append({
                            "time": int(c[0]),
                            "open": float(c[1]),
                            "high": float(c[2]),
                            "low": float(c[3]),
                            "close": float(c[4]),
                            "volume": float(c[5]),
                        })

                candles.sort(key=lambda x: x["time"])

                result = {"candles": candles, "timeframe": timeframe}
                ttl = 60 if timeframe == "hour1" else 300
                await r.setex(cache_key, ttl, json.dumps(result))
                return result

    except Exception as e:
        logger.warning("OHLCV fetch failed for %s: %s", address, e)

    return {"candles": [], "timeframe": timeframe}
