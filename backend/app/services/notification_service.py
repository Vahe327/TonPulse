import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_API_BASE = "https://api.telegram.org"


class NotificationService:
    def __init__(self):
        self._client = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=httpx.Timeout(15.0))
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def send_telegram_message(self, chat_id: int, text: str, parse_mode: str = "HTML") -> bool:
        client = await self._get_client()
        url = f"{TELEGRAM_API_BASE}/bot{settings.telegram_bot_token}/sendMessage"
        try:
            response = await client.post(
                url,
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": parse_mode,
                },
            )
            data = response.json()
            if not data.get("ok"):
                logger.error("Failed to send Telegram message to %s: %s", chat_id, data.get("description"))
                return False
            return True
        except Exception as e:
            logger.error("Error sending Telegram message: %s", e)
            return False

    async def send_price_alert(
        self,
        chat_id: int,
        token_symbol: str,
        condition: str,
        target_price: str,
        current_price: str,
    ) -> bool:
        direction = "above" if condition == "above" else "below"
        emoji = "\U0001f4c8" if condition == "above" else "\U0001f4c9"

        text = (
            f"{emoji} <b>Price Alert Triggered!</b>\n\n"
            f"<b>{token_symbol}</b> is now {direction} your target\n\n"
            f"Target: <code>${target_price}</code>\n"
            f"Current: <code>${current_price}</code>\n\n"
            f"<i>Sent by TonPulse</i>"
        )
        return await self.send_telegram_message(chat_id, text)


notification_service = NotificationService()
