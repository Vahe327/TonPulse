import asyncio
import logging

from app.config import settings
from app.database import async_session_factory
from app.services.alert_service import alert_service

logger = logging.getLogger(__name__)


async def run_alert_checker():
    logger.info("Alert checker started (interval: %ss)", settings.alert_check_interval_seconds)
    while True:
        try:
            async with async_session_factory() as db:
                await alert_service.check_and_trigger_alerts(db)
        except asyncio.CancelledError:
            logger.info("Alert checker cancelled")
            break
        except Exception as e:
            logger.error("Alert checker error: %s", e)

        await asyncio.sleep(settings.alert_check_interval_seconds)
