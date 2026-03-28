import asyncio
import json
import logging
from typing import Optional

import httpx

from app.config import settings
from app.redis_client import get_redis
from app.services.price_service import price_service
from app.services.portfolio_service import portfolio_service
from app.services.liquidity_service import liquidity_service
from app.utils.ai_prompts import SMART_ASSISTANT_SYSTEM

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class SmartAssistantService:
    def __init__(self) -> None:
        self._http_client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._http_client

    async def close(self) -> None:
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()

    async def _build_context(self, wallet_address: Optional[str]) -> str:
        lines: list[str] = []

        if wallet_address:
            short_addr = f"{wallet_address[:6]}...{wallet_address[-4:]}"
            lines.append(f"WALLET: connected ({short_addr})")
        else:
            lines.append("WALLET: not connected")

        balances_data: Optional[dict] = None
        has_balance = False
        has_lp = False

        if wallet_address:
            try:
                balances_data = await portfolio_service.get_portfolio(wallet_address)
                positions = balances_data.get("positions", [])
                if positions:
                    has_balance = True
                    balance_lines: list[str] = []
                    for pos in positions[:10]:
                        symbol = pos.get("token_symbol", pos.get("symbol", "???"))
                        amount = pos.get("balance_formatted", pos.get("amount", "0"))
                        value_usd = pos.get("value_usd", "0")
                        change = pos.get("change_24h")
                        change_str = ""
                        if change is not None:
                            try:
                                change_str = f" ({float(change):+.1f}%)"
                            except (ValueError, TypeError):
                                pass
                        try:
                            usd_val = float(value_usd)
                            balance_lines.append(f"  {symbol}: {amount} (${usd_val:.2f}){change_str}")
                        except (ValueError, TypeError):
                            balance_lines.append(f"  {symbol}: {amount}{change_str}")
                    lines.append("BALANCES:\n" + "\n".join(balance_lines))

                    total_usd = balances_data.get("total_usd", "0")
                    try:
                        lines.append(f"TOTAL_VALUE_USD: ${float(total_usd):.2f}")
                    except (ValueError, TypeError):
                        lines.append(f"TOTAL_VALUE_USD: ${total_usd}")
                else:
                    lines.append("BALANCES: wallet empty (0 tokens)")
            except Exception as e:
                logger.warning("Failed to fetch portfolio for context: %s", e)
                lines.append("BALANCES: N/A (fetch error)")

            try:
                lp_result = await liquidity_service.get_pools(sort_by="apr_24h", sort_order="desc", limit=3)
                user_lp_lines: list[str] = []
                for pool in lp_result.pools[:3]:
                    pool_name = f"{pool.token_a.symbol}/{pool.token_b.symbol}"
                    user_lp_lines.append(
                        f"  {pool_name}: APR {pool.apr_24h:.1f}%, TVL ${pool.tvl_usd:,.0f}"
                    )
                if user_lp_lines:
                    has_lp = True
                    lines.append("LP_POSITIONS: user may have LP\nBEST_POOLS:\n" + "\n".join(user_lp_lines))
                else:
                    lines.append("LP_POSITIONS: none detected")
            except Exception as e:
                logger.warning("Failed to fetch LP data for context: %s", e)
                lines.append("LP_POSITIONS: N/A")
        else:
            lines.append("BALANCES: N/A (no wallet)")
            lines.append("LP_POSITIONS: N/A (no wallet)")

        try:
            all_prices = await price_service.get_all_prices()
            sorted_prices = sorted(
                all_prices,
                key=lambda t: float(t.get("volume_24h_usd", 0) or 0),
                reverse=True,
            )
            top5 = sorted_prices[:5]
            if top5:
                market_lines: list[str] = []
                for token in top5:
                    symbol = token.get("symbol", "???")
                    price_usd = token.get("price_usd", "0")
                    change = token.get("change_24h")
                    change_str = f" ({float(change):+.1f}%)" if change is not None else ""
                    market_lines.append(f"  {symbol}: ${price_usd}{change_str}")
                lines.append("MARKET_TOP5:\n" + "\n".join(market_lines))
            else:
                lines.append("MARKET_TOP5: N/A")
        except Exception as e:
            logger.warning("Failed to fetch market data for context: %s", e)
            lines.append("MARKET_TOP5: N/A")

        try:
            pools_result = await liquidity_service.get_pools(
                sort_by="apr_24h", sort_order="desc", limit=3
            )
            if pools_result.pools:
                pool_lines: list[str] = []
                for pool in pools_result.pools[:3]:
                    pool_name = f"{pool.token_a.symbol}/{pool.token_b.symbol}"
                    pool_lines.append(
                        f"  {pool_name}: APR {pool.apr_24h:.1f}%, TVL ${pool.tvl_usd:,.0f}, addr {pool.address}"
                    )
                lines.append("BEST_POOLS:\n" + "\n".join(pool_lines))
            else:
                lines.append("BEST_POOLS: N/A")
        except Exception as e:
            logger.warning("Failed to fetch pools for context: %s", e)
            lines.append("BEST_POOLS: N/A")

        return "\n".join(lines)

    def _get_quick_actions(
        self,
        wallet_address: Optional[str],
        has_balance: bool,
        has_lp: bool,
        language: str = "en",
    ) -> list[dict]:
        ru = language == "ru"

        if not wallet_address:
            return [
                {"label": "Подключить кошелёк" if ru else "Connect Wallet", "action": "connect_wallet"},
                {"label": "Что такое DeFi?" if ru else "What is DeFi?", "prompt": "Что такое DeFi и как начать?" if ru else "What is DeFi and how do I start?"},
                {"label": "Как работают свапы" if ru else "How swaps work", "prompt": "Объясни как работают обмены токенов" if ru else "Explain how token swaps work"},
            ]

        if not has_balance:
            return [
                {"label": "Купить TON" if ru else "Buy TON", "action": "buy_ton"},
                {"label": "С чего начать?" if ru else "How to start?", "prompt": "Как начать работу с DeFi на TON?" if ru else "How do I get started with DeFi on TON?"},
            ]

        actions = [
            {"label": "Мой портфель" if ru else "My Portfolio", "prompt": "Покажи мой портфель" if ru else "Show my portfolio summary"},
            {"label": "Обменять" if ru else "Swap Tokens", "prompt": "Хочу обменять токены" if ru else "I want to swap tokens"},
            {"label": "Лучшие пулы" if ru else "Best Pools", "prompt": "Какие лучшие пулы ликвидности?" if ru else "What are the best liquidity pools right now?"},
            {"label": "Оповещение" if ru else "Set Alert", "prompt": "Установи ценовое оповещение" if ru else "Help me set a price alert"},
        ]

        if has_lp:
            actions.append({"label": "LP стратегия" if ru else "LP Strategy", "prompt": "Проанализируй мои позиции" if ru else "Analyze my liquidity positions"})

        return actions

    async def process_message(
        self,
        message: str,
        wallet_address: Optional[str],
        history: list[dict],
        language: str,
    ) -> dict:
        context_str = await self._build_context(wallet_address)

        has_balance = "BALANCES:" in context_str and "wallet empty" not in context_str and "N/A" not in context_str.split("BALANCES:")[1].split("\n")[0]
        has_lp = "LP_POSITIONS: user may have LP" in context_str

        system_prompt = SMART_ASSISTANT_SYSTEM.format(
            user_context=context_str,
            language=language,
        )

        messages: list[dict] = [{"role": "system", "content": system_prompt}]

        for entry in history[-10:]:
            role = entry.get("role", "user")
            content = entry.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": message})

        payload = {
            "model": settings.groq_model_smart,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"},
        }

        parsed = await self._call_groq(payload)

        if parsed is None:
            logger.warning("First Groq call failed, retrying after 2s...")
            await asyncio.sleep(2)
            parsed = await self._call_groq(payload)

        if parsed is None:
            fallback_text = (
                "I'm having trouble connecting to my AI engine right now. Please try again in a moment."
                if language == "en"
                else "У меня сейчас проблемы с подключением к AI-движку. Попробуйте ещё раз через минуту."
            )
            return {
                "text": fallback_text,
                "actions": [],
                "quick_actions": self._get_quick_actions(wallet_address, has_balance, has_lp, language),
            }

        text = parsed.get("text", "")
        raw_actions = parsed.get("actions", [])

        validated_actions: list[dict] = []
        allowed_types = {
            "connect_wallet", "buy_ton", "swap", "add_liquidity",
            "set_alert", "token_info", "portfolio_summary",
            "pool_recommendation", "education_step", "confirm_action",
        }
        for action in raw_actions:
            if isinstance(action, dict) and action.get("type") in allowed_types:
                validated_actions.append({
                    "type": action["type"],
                    "data": action.get("data", {}),
                })

        quick_actions = self._get_quick_actions(wallet_address, has_balance, has_lp, language)

        return {
            "text": text,
            "actions": validated_actions,
            "quick_actions": quick_actions,
        }

    async def _call_groq(self, payload: dict) -> Optional[dict]:
        try:
            client = await self._get_client()
            response = await client.post(GROQ_API_URL, json=payload)
            response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return parsed
        except httpx.HTTPStatusError as e:
            logger.error("Groq API HTTP error %d: %s", e.response.status_code, e.response.text[:500])
            return None
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error("Failed to parse Groq response: %s", e)
            return None
        except httpx.TimeoutException:
            logger.error("Groq API request timed out")
            return None
        except Exception as e:
            logger.error("Unexpected error calling Groq API: %s", e)
            return None


smart_assistant = SmartAssistantService()
