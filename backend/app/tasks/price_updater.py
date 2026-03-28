import asyncio
import logging

from app.config import settings
from app.services.price_service import price_service

logger = logging.getLogger(__name__)


async def run_price_updater():
    logger.info("Price updater started (interval: %ss)", settings.price_update_interval_seconds)
    while True:
        try:
            prices = await price_service.fetch_and_cache_prices()
            if prices:
                await price_service.publish_price_update(prices)
                logger.debug("Updated prices for %d tokens", len(prices))
        except asyncio.CancelledError:
            logger.info("Price updater cancelled")
            break
        except Exception as e:
            logger.error("Price updater error: %s", e)

        await asyncio.sleep(settings.price_update_interval_seconds)
