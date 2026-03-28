import json
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.token import CachedToken
from app.redis_client import get_redis
from app.services.stonfi_service import stonfi_service
from app.services.price_service import price_service
from app.utils.constants import DEFAULT_TOKENS

logger = logging.getLogger(__name__)


class TokenService:
    async def get_tokens(self, db: AsyncSession) -> list[dict]:
        prices = await price_service.get_all_prices()
        if prices:
            return prices

        result = await db.execute(select(CachedToken))
        tokens = result.scalars().all()
        if tokens:
            return [
                {
                    "address": t.address,
                    "symbol": t.symbol,
                    "name": t.name,
                    "decimals": t.decimals,
                    "icon_url": t.icon_url,
                    "price_usd": "0",
                    "price_ton": None,
                    "change_24h": None,
                    "volume_24h": None,
                    "liquidity": None,
                    "is_verified": t.is_verified,
                }
                for t in tokens
            ]

        return DEFAULT_TOKENS

    async def get_token(self, address: str, db: AsyncSession) -> Optional[dict]:
        price_data = await price_service.get_token_price(address)
        if price_data:
            token = await db.get(CachedToken, address)
            if token:
                price_data["description_en"] = token.description_en
                price_data["description_ru"] = token.description_ru

            detail_stats = await price_service.get_token_detail_stats(address)
            price_data["volume_24h"] = detail_stats.get("volume_24h")
            price_data["liquidity"] = detail_stats.get("liquidity")
            price_data["market_cap"] = detail_stats.get("market_cap")
            return price_data

        token = await db.get(CachedToken, address)
        if token:
            detail_stats = await price_service.get_token_detail_stats(address)
            return {
                "address": token.address,
                "symbol": token.symbol,
                "name": token.name,
                "decimals": token.decimals,
                "icon_url": token.icon_url,
                "price_usd": "0",
                "price_ton": None,
                "change_24h": None,
                "volume_24h": detail_stats.get("volume_24h"),
                "liquidity": detail_stats.get("liquidity"),
                "market_cap": detail_stats.get("market_cap"),
                "description_en": token.description_en,
                "description_ru": token.description_ru,
                "is_verified": token.is_verified,
            }

        return None

    async def sync_tokens_to_db(self, db: AsyncSession):
        try:
            assets = await stonfi_service.get_assets()
        except Exception as e:
            logger.error("Failed to sync tokens: %s", e)
            return

        for asset in assets:
            address = asset.get("contract_address", "")
            if not address:
                continue

            existing = await db.get(CachedToken, address)
            if existing:
                existing.symbol = asset.get("symbol", existing.symbol)
                existing.name = asset.get("display_name", asset.get("name", existing.name))
                existing.decimals = int(asset.get("decimals", existing.decimals))
                existing.icon_url = asset.get("image_url", existing.icon_url)
                existing.is_verified = asset.get("community", False) or asset.get("verified", False)
            else:
                new_token = CachedToken(
                    address=address,
                    symbol=asset.get("symbol", "???"),
                    name=asset.get("display_name", asset.get("name", "Unknown")),
                    decimals=int(asset.get("decimals", 9)),
                    icon_url=asset.get("image_url"),
                    is_verified=asset.get("community", False) or asset.get("verified", False),
                )
                db.add(new_token)

        await db.commit()


token_service = TokenService()
