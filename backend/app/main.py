import asyncio
import json
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import api_v1_router
from app.api.ws import router as ws_router
from app.redis_client import close_redis
from app.services.ton_api import ton_api_service
from app.services.stonfi_service import stonfi_service
from app.services.price_service import price_service
from app.services.notification_service import notification_service
from app.services.ai_service import ai_service
from app.tasks.price_updater import run_price_updater
from app.tasks.alert_checker import run_alert_checker

TELEGRAM_API = f"https://api.telegram.org/bot{settings.telegram_bot_token}"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

background_tasks: list[asyncio.Task] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TonPulse backend...")

    price_task = asyncio.create_task(run_price_updater())
    alert_task = asyncio.create_task(run_alert_checker())
    background_tasks.extend([price_task, alert_task])

    logger.info("Background tasks started")
    yield

    logger.info("Shutting down TonPulse backend...")
    for task in background_tasks:
        task.cancel()
    await asyncio.gather(*background_tasks, return_exceptions=True)

    await ton_api_service.close()
    await stonfi_service.close()
    await price_service.close()
    await notification_service.close()
    await ai_service.close()
    await close_redis()

    logger.info("Shutdown complete")


app = FastAPI(
    title="TonPulse API",
    description="DeFi Trading Terminal for TON Blockchain",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)
app.include_router(ws_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "tonpulse-api"}


@app.post("/api/v1/telegram-webhook")
async def telegram_webhook(request: Request):
    data = await request.json()

    callback = data.get("callback_query")
    if callback:
        await _handle_callback(callback)
        return {"ok": True}

    message = data.get("message")
    if not message:
        return {"ok": True}

    chat_id = message["chat"]["id"]
    text = message.get("text", "")
    first_name = message["chat"].get("first_name", "")

    if text == "/start":
        lang = message.get("from", {}).get("language_code", "en")
        msg_text = _build_welcome(first_name, lang)
        keyboard = _build_keyboard(lang)
        async with httpx.AsyncClient() as client:
            await client.post(f"{TELEGRAM_API}/sendMessage", json={
                "chat_id": chat_id, "text": msg_text, "parse_mode": "HTML",
                "reply_markup": json.dumps({"inline_keyboard": keyboard}),
            })

    return {"ok": True}


async def _handle_callback(callback: dict):
    cb_data = callback.get("data", "")
    cb_chat_id = callback["message"]["chat"]["id"]
    cb_msg_id = callback["message"]["message_id"]
    cb_name = callback.get("from", {}).get("first_name", "")

    if cb_data in ("lang_ru", "lang_en"):
        new_lang = "ru" if cb_data == "lang_ru" else "en"
        new_text = _build_welcome(cb_name, new_lang)
        keyboard = _build_keyboard(new_lang)
        async with httpx.AsyncClient() as client:
            await client.post(f"{TELEGRAM_API}/editMessageText", json={
                "chat_id": cb_chat_id, "message_id": cb_msg_id,
                "text": new_text, "parse_mode": "HTML",
                "reply_markup": json.dumps({"inline_keyboard": keyboard}),
            })
            await client.post(f"{TELEGRAM_API}/answerCallbackQuery", json={
                "callback_query_id": callback["id"],
            })


def _build_welcome(name: str, lang: str) -> str:
    sep = "\u2500" * 28
    if lang == "ru":
        return (
            f"<b>TonPulse</b>  \u2502  DeFi Trading Terminal\n"
            f"{sep}\n\n"
            f"\u041f\u0440\u0438\u0432\u0435\u0442, {name}!\n\n"
            "TonPulse \u2014 \u043f\u043e\u043b\u043d\u043e\u0446\u0435\u043d\u043d\u0430\u044f \u0442\u043e\u0440\u0433\u043e\u0432\u0430\u044f "
            "\u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430 \u043d\u0430 \u0431\u043b\u043e\u043a\u0447\u0435\u0439\u043d\u0435 TON "
            "\u043f\u0440\u044f\u043c\u043e \u0432 Telegram.\n\n"
            "<b>\u0422\u043e\u0440\u0433\u043e\u0432\u043b\u044f \u0438 DeFi:</b>\n"
            "\u25ab <b>\u041e\u0431\u043c\u0435\u043d \u0442\u043e\u043a\u0435\u043d\u043e\u0432</b> \u2014 \u0441\u0432\u0430\u043f\u044b \u0447\u0435\u0440\u0435\u0437 STON.fi \u0441 \u043b\u0443\u0447\u0448\u0438\u043c\u0438 \u043a\u0443\u0440\u0441\u0430\u043c\u0438\n"
            "\u25ab <b>\u041b\u0438\u043a\u0432\u0438\u0434\u043d\u043e\u0441\u0442\u044c</b> \u2014 \u0437\u0430\u0440\u0430\u0431\u043e\u0442\u043e\u043a \u043d\u0430 \u043f\u0443\u043b\u0430\u0445 STON.fi, APR \u0434\u043e 20%+\n"
            "\u25ab <b>\u041f\u043e\u0440\u0442\u0444\u0435\u043b\u044c</b> \u2014 \u0431\u0430\u043b\u0430\u043d\u0441 \u0438 P&L \u0432 \u0440\u0435\u0430\u043b\u044c\u043d\u043e\u043c \u0432\u0440\u0435\u043c\u0435\u043d\u0438\n"
            "\u25ab <b>\u041a\u0443\u043f\u0438\u0442\u044c TON</b> \u2014 Visa/Mastercard \u0447\u0435\u0440\u0435\u0437 \u043f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u044b\u0445 \u043f\u0440\u043e\u0432\u0430\u0439\u0434\u0435\u0440\u043e\u0432\n"
            "\u25ab <b>\u041e\u043f\u043e\u0432\u0435\u0449\u0435\u043d\u0438\u044f</b> \u2014 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u043f\u0440\u0438 \u0434\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u0438 \u0446\u0435\u043d\u044b\n\n"
            "<b>AI-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442:</b>\n"
            "\u25ab \u041e\u0431\u0443\u0447\u0438\u0442 \u0442\u043e\u0440\u0433\u043e\u0432\u043b\u0435, \u043b\u0438\u043a\u0432\u0438\u0434\u043d\u043e\u0441\u0442\u0438 \u0438 DeFi \u043f\u043e\u0448\u0430\u0433\u043e\u0432\u043e\n"
            "\u25ab \u041f\u0440\u043e\u0432\u0435\u0434\u0451\u0442 \u043e\u0442 \u043f\u043e\u043a\u0443\u043f\u043a\u0438 TON \u0434\u043e \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0437\u0430\u0440\u0430\u0431\u043e\u0442\u043a\u0430\n"
            "\u25ab \u0410\u043d\u0430\u043b\u0438\u0437 \u0440\u0438\u0441\u043a\u043e\u0432 \u0438 \u0441\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u0438\n\n"
            f"{sep}\n"
            "<i>\u041e\u0442\u043a\u0440\u043e\u0439\u0442\u0435 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435 \u0438 \u043f\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u043d\u0430 \u0432\u043a\u043b\u0430\u0434\u043a\u0443 AI "
            "\u0434\u043b\u044f \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f \u0438 \u043f\u043e\u043c\u043e\u0449\u0438.</i>"
        )
    return (
        f"<b>TonPulse</b>  \u2502  DeFi Trading Terminal\n"
        f"{sep}\n\n"
        f"Hey, {name}!\n\n"
        "TonPulse is a full-featured trading platform "
        "on TON blockchain, right inside Telegram.\n\n"
        "<b>Trading & DeFi:</b>\n"
        "\u25ab <b>Token swaps</b> \u2014 best rates via STON.fi protocol\n"
        "\u25ab <b>Liquidity pools</b> \u2014 earn on STON.fi pools, APR up to 20%+\n"
        "\u25ab <b>Portfolio</b> \u2014 real-time balance & P&L tracking\n"
        "\u25ab <b>Buy TON</b> \u2014 via Visa/Mastercard through trusted providers\n"
        "\u25ab <b>Price alerts</b> \u2014 notifications when tokens hit your target\n\n"
        "<b>AI Assistant:</b>\n"
        "\u25ab Teaches trading, liquidity providing & DeFi step by step\n"
        "\u25ab Guides you from buying TON to your first earnings\n"
        "\u25ab Risk analysis & personalized strategies\n\n"
        f"{sep}\n"
        "<i>Open the app and go to the AI tab "
        "to start learning and get help.</i>"
    )


def _build_keyboard(lang: str) -> list:
    return [
        [{
            "text": "\u25b6 \u041e\u0442\u043a\u0440\u044b\u0442\u044c TonPulse" if lang == "ru" else "\u25b6 Open TonPulse",
            "web_app": {"url": settings.app_url},
        }],
        [{
            "text": "\U0001f1ec\U0001f1e7 English" if lang == "ru" else "\U0001f1f7\U0001f1fa \u0420\u0443\u0441\u0441\u043a\u0438\u0439",
            "callback_data": "lang_en" if lang == "ru" else "lang_ru",
        }],
    ]
