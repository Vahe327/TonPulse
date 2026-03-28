import json
import logging
from decimal import Decimal
from typing import Optional

from app.config import settings
from app.redis_client import get_redis
from app.services.ton_api import ton_api_service
from app.services.price_service import price_service
from app.utils.constants import TON_NATIVE_ADDRESS, TON_SYMBOL, TON_NAME, TON_DECIMALS, KNOWN_TOKEN_ICONS
from app.utils.formatting import nano_to_amount

logger = logging.getLogger(__name__)

PORTFOLIO_CACHE_PREFIX = "portfolio:"


class PortfolioService:
    _price_by_symbol: dict[str, dict] | None = None

    async def _get_price_with_fallback(self, address: str, symbol: str) -> Optional[dict]:
        price_data = await price_service.get_token_price(address)
        if price_data and price_data.get("price_usd") and price_data["price_usd"] != "0":
            return price_data

        if self._price_by_symbol is None:
            all_prices = await price_service.get_all_prices()
            self._price_by_symbol = {}
            for p in all_prices:
                sym = p.get("symbol", "").upper()
                if sym and sym not in self._price_by_symbol:
                    self._price_by_symbol[sym] = p

        match = self._price_by_symbol.get(symbol.upper())
        if match:
            return match
        return price_data

    async def get_portfolio(self, wallet_address: str) -> dict:
        r = get_redis()
        cached = await r.get(f"{PORTFOLIO_CACHE_PREFIX}{wallet_address}")
        if cached:
            return json.loads(cached)

        portfolio = await self._build_portfolio(wallet_address)

        await r.setex(
            f"{PORTFOLIO_CACHE_PREFIX}{wallet_address}",
            settings.balance_cache_ttl_seconds,
            json.dumps(portfolio),
        )

        return portfolio

    async def _build_portfolio(self, wallet_address: str) -> dict:
        self._price_by_symbol = None
        positions = []
        total_usd = Decimal("0")
        total_ton = Decimal("0")

        try:
            ton_balance = await ton_api_service.get_address_balance(wallet_address)
        except Exception as e:
            logger.error("Failed to get TON balance: %s", e)
            ton_balance = Decimal("0")

        ton_price_data = await self._get_price_with_fallback(TON_NATIVE_ADDRESS, TON_SYMBOL)
        ton_usd_price = Decimal(ton_price_data["price_usd"]) if ton_price_data and ton_price_data.get("price_usd") and ton_price_data["price_usd"] != "0" else Decimal("0")

        if ton_balance > 0:
            ton_value_usd = ton_balance * ton_usd_price
            total_usd += ton_value_usd
            total_ton += ton_balance

            ton_icon = KNOWN_TOKEN_ICONS.get(TON_NATIVE_ADDRESS, "")
            if ton_price_data and ton_price_data.get("icon_url"):
                ton_icon = ton_price_data["icon_url"] or ton_icon

            positions.append({
                "token_address": TON_NATIVE_ADDRESS,
                "token_symbol": TON_SYMBOL,
                "token_name": TON_NAME,
                "icon_url": ton_icon,
                "balance": str(int(ton_balance * Decimal(10**TON_DECIMALS))),
                "balance_formatted": str(ton_balance.quantize(Decimal("0.0001"))),
                "value_usd": str(ton_value_usd.quantize(Decimal("0.01"))),
                "value_ton": str(ton_balance.quantize(Decimal("0.0001"))),
                "price_usd": str(ton_usd_price),
                "change_24h": ton_price_data.get("change_24h") if ton_price_data else None,
                "pnl_usd": None,
                "pnl_percent": None,
                "portfolio_share": "0",
            })

        try:
            jetton_wallets = await ton_api_service.get_jetton_wallets(wallet_address)
        except Exception as e:
            logger.error("Failed to get jetton wallets: %s", e)
            jetton_wallets = []

        for wallet in jetton_wallets:
            jetton_address = wallet["jetton_address"]
            balance = wallet["balance"]
            symbol = wallet["symbol"]
            name = wallet["name"]
            decimals = wallet["decimals"]

            icon_url = wallet.get("icon_url", "")

            price_data = await self._get_price_with_fallback(jetton_address, symbol)

            if not icon_url and price_data and price_data.get("icon_url"):
                icon_url = price_data["icon_url"]
            if not icon_url:
                icon_url = KNOWN_TOKEN_ICONS.get(jetton_address, "")

            token_usd_price = Decimal(price_data["price_usd"]) if price_data and price_data.get("price_usd") and price_data["price_usd"] != "0" else Decimal("0")

            value_usd = balance * token_usd_price
            total_usd += value_usd

            value_ton = Decimal("0")
            if ton_usd_price > 0:
                value_ton = value_usd / ton_usd_price
                total_ton += value_ton

            positions.append({
                "token_address": jetton_address,
                "token_symbol": symbol,
                "token_name": name,
                "icon_url": icon_url,
                "balance": wallet["balance_raw"],
                "balance_formatted": str(balance.quantize(Decimal("0.0001"))),
                "value_usd": str(value_usd.quantize(Decimal("0.01"))),
                "value_ton": str(value_ton.quantize(Decimal("0.0001"))) if value_ton else None,
                "price_usd": str(token_usd_price),
                "change_24h": price_data.get("change_24h") if price_data else None,
                "pnl_usd": None,
                "pnl_percent": None,
                "portfolio_share": "0",
            })

        if total_usd > 0:
            for pos in positions:
                pos_value = Decimal(pos["value_usd"])
                share = (pos_value / total_usd * 100).quantize(Decimal("0.01"))
                pos["portfolio_share"] = str(share)

        positions.sort(key=lambda p: Decimal(p["value_usd"]), reverse=True)

        return {
            "total_usd": str(total_usd.quantize(Decimal("0.01"))),
            "total_ton": str(total_ton.quantize(Decimal("0.0001"))),
            "pnl_24h_usd": None,
            "pnl_24h_percent": None,
            "positions": positions,
        }


portfolio_service = PortfolioService()
