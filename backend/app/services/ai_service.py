import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.config import settings
from app.redis_client import get_redis
from app.utils.ai_prompts import (
    TOKEN_ANALYSIS_SYSTEM,
    TOKEN_ANALYSIS_USER,
    RISK_SCORE_SYSTEM,
    RISK_SCORE_USER,
    SWAP_INSIGHT_SYSTEM,
    SWAP_INSIGHT_USER,
    CHAT_SYSTEM,
)

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqAIService:
    def __init__(self):
        self.api_key = settings.groq_api_key
        self.model_fast = settings.groq_model_fast
        self.model_smart = settings.groq_model_smart
        self.model_reasoning = settings.groq_model_reasoning
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _call_groq(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        response_format: Optional[dict] = None,
    ) -> str:
        client = await self._get_client()
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        body: dict = {
            "model": model or self.model_smart,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if response_format:
            body["response_format"] = response_format

        last_error = None
        for attempt in range(2):
            try:
                response = await client.post(
                    GROQ_API_URL,
                    headers=headers,
                    json=body,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                last_error = e
                logger.error("Groq API error (attempt %d): %s %s", attempt + 1, e.response.status_code, e.response.text[:200])
                if e.response.status_code == 429:
                    await asyncio.sleep(3)
                    continue
                raise
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                last_error = e
                logger.error("Groq connection error (attempt %d): %s", attempt + 1, e)
                if attempt == 0:
                    await asyncio.sleep(2)
                    continue
                raise

        raise last_error

    async def check_rate_limit(self, user_id: int) -> tuple[bool, int, int]:
        r = get_redis()
        key = f"ai:ratelimit:{user_id}"
        current = await r.get(key)

        if current is None:
            await r.setex(key, 3600, "1")
            return True, settings.ai_requests_per_hour - 1, 3600

        count = int(current)
        ttl = await r.ttl(key)
        if ttl < 0:
            ttl = 3600

        if count >= settings.ai_requests_per_hour:
            return False, 0, ttl

        await r.incr(key)
        return True, settings.ai_requests_per_hour - count - 1, ttl

    async def analyze_token(self, token_data: dict, language: str = "en") -> dict:
        r = get_redis()
        cache_key = f"ai:analysis:{token_data['token_address']}:{language}"

        cached = await r.get(cache_key)
        if cached:
            result = json.loads(cached)
            result["cached"] = True
            return result

        lang_name = "Russian" if language == "ru" else "English"

        messages = [
            {"role": "system", "content": TOKEN_ANALYSIS_SYSTEM.format(language=lang_name)},
            {"role": "user", "content": TOKEN_ANALYSIS_USER.format(
                symbol=token_data["token_symbol"],
                name=token_data["token_name"],
                address=token_data["token_address"],
                price_usd=token_data.get("price_usd", "N/A"),
                change_24h=token_data.get("price_change_24h", "N/A"),
                change_7d=token_data.get("price_change_7d", "N/A"),
                volume_24h=token_data.get("volume_24h", "N/A"),
                liquidity=token_data.get("liquidity", "N/A"),
                market_cap=token_data.get("market_cap", "N/A"),
                holder_count=token_data.get("holder_count", "N/A"),
                language=lang_name,
            )},
        ]

        raw = await self._call_groq(
            messages=messages,
            model=self.model_smart,
            temperature=0.3,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                cleaned = cleaned.rsplit("```", 1)[0]
            result = json.loads(cleaned)

        result["cached"] = False
        result["generated_at"] = datetime.now(timezone.utc).isoformat()

        if "risk_score" not in result:
            result["risk_score"] = 5
        result["risk_score"] = max(1, min(10, int(result["risk_score"])))

        for field in ["risk_factors", "strengths"]:
            if field not in result or not isinstance(result[field], list):
                result[field] = []

        for field in ["summary", "price_analysis", "liquidity_assessment", "volume_analysis", "outlook"]:
            if field not in result:
                result[field] = ""

        if "confidence" not in result or result["confidence"] not in ("LOW", "MEDIUM", "HIGH"):
            result["confidence"] = "MEDIUM"

        await r.setex(
            cache_key,
            settings.ai_cache_ttl_analysis,
            json.dumps(result, ensure_ascii=False),
        )

        return result

    async def get_risk_scores(self, tokens: list[dict]) -> list[dict]:
        r = get_redis()
        results = []
        uncached = []
        uncached_data = []

        for token in tokens:
            address = token["address"]
            cached = await r.get(f"ai:risk:{address}")
            if cached:
                results.append(json.loads(cached))
            else:
                uncached.append(address)
                uncached_data.append(token)

        if uncached_data:
            tokens_text = "\n".join(
                f"- {t.get('symbol', '???')} ({t['address']}): "
                f"price=${t.get('price_usd', 'N/A')}, "
                f"24h_change={t.get('change_24h', 'N/A')}%, "
                f"verified={t.get('is_verified', False)}, "
                f"volume_24h=${t.get('volume_24h', 'N/A')}, "
                f"liquidity=${t.get('liquidity', 'N/A')}, "
                f"market_cap=${t.get('market_cap', 'N/A')}"
                for t in uncached_data
            )

            messages = [
                {"role": "system", "content": RISK_SCORE_SYSTEM},
                {"role": "user", "content": RISK_SCORE_USER.format(tokens_data=tokens_text)},
            ]

            try:
                raw = await self._call_groq(
                    messages=messages,
                    model=self.model_fast,
                    temperature=0.1,
                    max_tokens=512,
                    response_format={"type": "json_object"},
                )

                parsed = json.loads(raw)
                if isinstance(parsed, dict):
                    scores_list = parsed.get("scores", parsed.get("tokens", parsed.get("results", [])))
                    if not isinstance(scores_list, list):
                        scores_list = [parsed] if "address" in parsed else []
                elif isinstance(parsed, list):
                    scores_list = parsed
                else:
                    scores_list = []

                for item in scores_list:
                    addr = item.get("address", "")
                    score = max(1, min(10, int(item.get("risk_score", 5))))
                    entry = {"address": addr, "risk_score": score}
                    results.append(entry)
                    await r.setex(
                        f"ai:risk:{addr}",
                        settings.ai_cache_ttl_risk,
                        json.dumps(entry),
                    )

            except Exception as e:
                logger.error("Failed to get risk scores: %s", e)
                for t in uncached_data:
                    entry = {"address": t["address"], "risk_score": 5}
                    results.append(entry)

        return results

    async def get_swap_insight(
        self,
        from_token: dict,
        to_token: dict,
        amount: str,
        language: str = "en",
    ) -> dict:
        r = get_redis()
        cache_key = f"ai:insight:{from_token['address']}:{to_token['address']}"

        cached = await r.get(cache_key)
        if cached:
            result = json.loads(cached)
            result["cached"] = True
            return result

        lang_name = "Russian" if language == "ru" else "English"

        messages = [
            {"role": "system", "content": SWAP_INSIGHT_SYSTEM.format(language=lang_name)},
            {"role": "user", "content": SWAP_INSIGHT_USER.format(
                from_symbol=from_token.get("symbol", "???"),
                from_price=from_token.get("price_usd", "N/A"),
                from_change=from_token.get("change_24h", "N/A"),
                to_symbol=to_token.get("symbol", "???"),
                to_price=to_token.get("price_usd", "N/A"),
                to_change=to_token.get("change_24h", "N/A"),
                liquidity=from_token.get("liquidity", "N/A"),
                amount=amount,
                language=lang_name,
            )},
        ]

        raw = await self._call_groq(
            messages=messages,
            model=self.model_fast,
            temperature=0.4,
            max_tokens=150,
        )

        insight_text = raw.strip().strip('"').strip()

        sentiment = "neutral"
        negative_words = ["risk", "caution", "careful", "drop", "low liquidity", "warning", "decline", "осторожн", "риск", "падени"]
        positive_words = ["good", "strong", "trending up", "solid", "healthy", "рост", "хорош", "стабильн"]

        lower_text = insight_text.lower()
        for w in negative_words:
            if w in lower_text:
                sentiment = "negative"
                break
        if sentiment == "neutral":
            for w in positive_words:
                if w in lower_text:
                    sentiment = "positive"
                    break

        result = {
            "insight": insight_text,
            "sentiment": sentiment,
            "cached": False,
        }

        await r.setex(
            cache_key,
            settings.ai_cache_ttl_insight,
            json.dumps(result, ensure_ascii=False),
        )

        return result

    async def chat(
        self,
        message: str,
        history: list[dict],
        portfolio: list[dict],
        language: str = "en",
    ) -> str:
        lang_name = "Russian" if language == "ru" else "English"

        portfolio_context = "No wallet connected."
        if portfolio:
            lines = []
            total = sum(p.get("value_usd", 0) for p in portfolio)
            lines.append(f"Total portfolio value: ${total:.2f}")
            for p in portfolio:
                lines.append(f"- {p.get('symbol', '???')}: {p.get('amount', 0)} (${p.get('value_usd', 0):.2f})")
            portfolio_context = "\n".join(lines)

        system_msg = CHAT_SYSTEM.format(
            language=lang_name,
            portfolio_context=portfolio_context,
        )

        messages = [{"role": "system", "content": system_msg}]

        recent_history = history[-6:] if len(history) > 6 else history
        for msg in recent_history:
            if msg.get("role") in ("user", "assistant"):
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": message})

        response = await self._call_groq(
            messages=messages,
            model=self.model_smart,
            temperature=0.6,
            max_tokens=800,
        )

        return response.strip()


ai_service = GroqAIService()
