import json
import logging
from decimal import Decimal
from typing import Optional

import httpx
import redis.asyncio as aioredis

from app.config import settings
from app.redis_client import get_redis
from app.services.stonfi_service import stonfi_service
from app.utils.constants import TON_NATIVE_ADDRESS, COINGECKO_TON_ID, KNOWN_TOKEN_ICONS

logger = logging.getLogger(__name__)

PRICE_CACHE_PREFIX = "price:"
METADATA_CACHE_PREFIX = "meta:"
ALL_PRICES_KEY = "all_prices"


class PriceService:
    def __init__(self):
        self._coingecko_client: Optional[httpx.AsyncClient] = None

    async def _get_coingecko_client(self) -> httpx.AsyncClient:
        if self._coingecko_client is None or self._coingecko_client.is_closed:
            self._coingecko_client = httpx.AsyncClient(
                base_url=settings.coingecko_api_url,
                timeout=httpx.Timeout(15.0),
            )
        return self._coingecko_client

    async def close(self):
        if self._coingecko_client and not self._coingecko_client.is_closed:
            await self._coingecko_client.aclose()

    async def fetch_and_cache_prices(self) -> list[dict]:
        r = get_redis()
        try:
            assets = await stonfi_service.get_assets()
        except Exception as e:
            logger.error("Failed to fetch STON.fi assets: %s", e)
            return []

        ton_usd_price = await self._get_ton_usd_price()

        token_liquidity: dict[str, float] = {}
        token_volume: dict[str, float] = {}
        try:
            pools = await stonfi_service.get_pools()
            for pool in pools:
                tvl = float(pool.get("lp_total_supply_usd") or 0)
                vol = float(pool.get("volume_24h_usd") or pool.get("volume_usd_24h") or 0)
                t0 = pool.get("token0_address", "")
                t1 = pool.get("token1_address", "")
                if tvl > 0:
                    if t0:
                        token_liquidity[t0] = token_liquidity.get(t0, 0) + tvl
                    if t1:
                        token_liquidity[t1] = token_liquidity.get(t1, 0) + tvl
                if vol > 0:
                    if t0:
                        token_volume[t0] = token_volume.get(t0, 0) + vol
                    if t1:
                        token_volume[t1] = token_volume.get(t1, 0) + vol
        except Exception as e:
            logger.warning("Failed to fetch pools for liquidity data: %s", e)

        prices = []
        seen_addresses: set[str] = set()
        for asset in assets:
            address = asset.get("contract_address", "")
            if not address:
                continue

            if address in seen_addresses:
                continue
            seen_addresses.add(address)

            if address == TON_NATIVE_ADDRESS:
                continue

            symbol = asset.get("symbol", "")
            name = asset.get("display_name", asset.get("name", ""))
            decimals = int(asset.get("decimals", 9))
            icon_url = asset.get("image_url", "") or KNOWN_TOKEN_ICONS.get(address, "")
            is_verified = asset.get("community", False) or asset.get("verified", False)

            dex_price_usd = Decimal(str(asset.get("dex_price_usd", 0) or 0))
            dex_usd_price = dex_price_usd if dex_price_usd > 0 else None

            price_ton = None
            if dex_usd_price and ton_usd_price and ton_usd_price > 0:
                price_ton = dex_usd_price / ton_usd_price

            change_24h = None
            third_party = asset.get("third_party_price_usd")
            if third_party and dex_usd_price:
                try:
                    old_price = Decimal(str(third_party))
                    if old_price > 0:
                        change_24h = ((dex_usd_price - old_price) / old_price) * 100
                except Exception:
                    pass

            if change_24h is None and dex_usd_price and dex_usd_price > 0:
                prev_key = f"prev_price:{address}"
                prev_raw = await r.get(prev_key)
                if prev_raw:
                    try:
                        prev_price = Decimal(prev_raw)
                        if prev_price > 0:
                            change_24h = ((dex_usd_price - prev_price) / prev_price) * 100
                    except Exception:
                        pass
                await r.setex(prev_key, 86400, str(dex_usd_price))

            price_data = {
                "address": address,
                "symbol": symbol,
                "name": name,
                "decimals": decimals,
                "icon_url": icon_url,
                "price_usd": str(dex_usd_price) if dex_usd_price else "0",
                "price_ton": str(price_ton) if price_ton else None,
                "change_24h": str(change_24h) if change_24h is not None else None,
                "volume_24h": str(token_volume[address]) if address in token_volume else None,
                "liquidity": str(token_liquidity[address]) if address in token_liquidity else None,
                "market_cap": None,
                "is_verified": is_verified,
            }

            prices.append(price_data)

            await r.setex(
                f"{PRICE_CACHE_PREFIX}{address}",
                settings.price_update_interval_seconds * 2,
                json.dumps(price_data),
            )

        if ton_usd_price:
            ton_data = {
                "address": TON_NATIVE_ADDRESS,
                "symbol": "TON",
                "name": "Toncoin",
                "decimals": 9,
                "icon_url": KNOWN_TOKEN_ICONS.get(TON_NATIVE_ADDRESS, ""),
                "price_usd": str(ton_usd_price),
                "price_ton": "1",
                "change_24h": None,
                "volume_24h": str(token_volume[TON_NATIVE_ADDRESS]) if TON_NATIVE_ADDRESS in token_volume else None,
                "liquidity": str(token_liquidity[TON_NATIVE_ADDRESS]) if TON_NATIVE_ADDRESS in token_liquidity else None,
                "market_cap": None,
                "is_verified": True,
            }
            prices.insert(0, ton_data)
            await r.setex(
                f"{PRICE_CACHE_PREFIX}{TON_NATIVE_ADDRESS}",
                settings.price_update_interval_seconds * 2,
                json.dumps(ton_data),
            )

        def sort_key(p: dict) -> tuple:
            liq = float(p.get("liquidity") or 0)
            has_liquidity = 1 if liq >= 1000 else 0
            price = float(p.get("price_usd") or 0)
            return (has_liquidity, liq, price)

        prices.sort(key=sort_key, reverse=True)
        top_prices = [p for p in prices if p.get("is_verified") or float(p.get("price_usd") or 0) > 0.001][:100]

        await r.setex(
            ALL_PRICES_KEY,
            settings.price_update_interval_seconds * 2,
            json.dumps(top_prices),
        )

        return top_prices

    async def get_all_prices(self) -> list[dict]:
        r = get_redis()
        cached = await r.get(ALL_PRICES_KEY)
        if cached:
            return json.loads(cached)
        return await self.fetch_and_cache_prices()

    async def get_token_price(self, address: str) -> Optional[dict]:
        r = get_redis()
        cached = await r.get(f"{PRICE_CACHE_PREFIX}{address}")
        if cached:
            return json.loads(cached)
        return None

    async def get_token_detail_stats(self, address: str) -> dict:
        r = get_redis()
        cache_key = f"gecko_detail:{address}"
        cached = await r.get(cache_key)
        if cached:
            return json.loads(cached)

        result = {"volume_24h": None, "liquidity": None, "market_cap": None}
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
                resp = await client.get(
                    f"https://api.geckoterminal.com/api/v2/networks/ton/tokens/{address}"
                )
                if resp.status_code == 200:
                    attrs = resp.json().get("data", {}).get("attributes", {})
                    vol_data = attrs.get("volume_usd", {})
                    if isinstance(vol_data, dict) and vol_data.get("h24"):
                        result["volume_24h"] = str(vol_data["h24"])
                    if attrs.get("market_cap_usd"):
                        result["market_cap"] = str(attrs["market_cap_usd"])
                    if attrs.get("total_reserve_in_usd"):
                        result["liquidity"] = str(attrs["total_reserve_in_usd"])
        except Exception as e:
            logger.warning("GeckoTerminal detail fetch failed for %s: %s", address, e)

        await r.setex(cache_key, 300, json.dumps(result))
        return result

    async def _get_ton_usd_price(self) -> Optional[Decimal]:
        r = get_redis()
        cached = await r.get("ton_usd_price")
        if cached:
            return Decimal(cached)

        try:
            client = await self._get_coingecko_client()
            response = await client.get(
                "/simple/price",
                params={"ids": COINGECKO_TON_ID, "vs_currencies": "usd"},
            )
            response.raise_for_status()
            data = response.json()
            price = Decimal(str(data.get(COINGECKO_TON_ID, {}).get("usd", 0)))
            if price > 0:
                await r.setex("ton_usd_price", 60, str(price))
                return price
        except Exception as e:
            logger.error("Failed to fetch TON price from CoinGecko: %s", e)

        return None

    async def publish_price_update(self, prices: list[dict]):
        r = get_redis()
        message = json.dumps({
            "type": "price_update",
            "data": [
                {
                    "address": p["address"],
                    "price_usd": p["price_usd"],
                    "change_24h": p.get("change_24h"),
                }
                for p in prices
                if p.get("price_usd") and p["price_usd"] != "0"
            ],
        })
        await r.publish("price_updates", message)


price_service = PriceService()
