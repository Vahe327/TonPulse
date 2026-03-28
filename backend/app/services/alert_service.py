import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.alert import Alert
from app.schemas.alert import AlertCreate
from app.services.price_service import price_service
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)


class AlertService:
    async def get_user_alerts(self, user_id: int, db: AsyncSession) -> list[Alert]:
        result = await db.execute(
            select(Alert)
            .where(Alert.user_id == user_id)
            .order_by(Alert.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_alert(
        self, user_id: int, data: AlertCreate, db: AsyncSession
    ) -> Alert:
        count_result = await db.execute(
            select(func.count())
            .select_from(Alert)
            .where(Alert.user_id == user_id, Alert.is_active == True)
        )
        active_count = count_result.scalar() or 0

        if active_count >= settings.max_alerts_per_user:
            raise ValueError(f"Maximum {settings.max_alerts_per_user} active alerts allowed")

        alert = Alert(
            id=uuid.uuid4(),
            user_id=user_id,
            token_address=data.token_address,
            token_symbol=data.token_symbol,
            condition=data.condition,
            target_price=data.target_price,
            current_price_at_creation=data.current_price_at_creation,
            is_active=True,
            is_repeating=data.is_repeating,
        )
        db.add(alert)
        await db.flush()
        return alert

    async def delete_alert(
        self, alert_id: uuid.UUID, user_id: int, db: AsyncSession
    ) -> bool:
        result = await db.execute(
            select(Alert).where(Alert.id == alert_id, Alert.user_id == user_id)
        )
        alert = result.scalar_one_or_none()
        if not alert:
            return False
        await db.delete(alert)
        return True

    async def check_and_trigger_alerts(self, db: AsyncSession):
        result = await db.execute(
            select(Alert).where(Alert.is_active == True)
        )
        active_alerts = result.scalars().all()

        for alert in active_alerts:
            try:
                price_data = await price_service.get_token_price(alert.token_address)
                if not price_data or not price_data.get("price_usd"):
                    continue

                current_price = Decimal(price_data["price_usd"])
                if current_price <= 0:
                    continue

                triggered = False
                if alert.condition == "above" and current_price >= alert.target_price:
                    triggered = True
                elif alert.condition == "below" and current_price <= alert.target_price:
                    triggered = True

                if triggered:
                    await notification_service.send_price_alert(
                        chat_id=alert.user_id,
                        token_symbol=alert.token_symbol,
                        condition=alert.condition,
                        target_price=str(alert.target_price),
                        current_price=str(current_price),
                    )

                    alert.triggered_at = datetime.now(timezone.utc)
                    if not alert.is_repeating:
                        alert.is_active = False

                    logger.info(
                        "Alert triggered: %s %s %s at %s",
                        alert.token_symbol,
                        alert.condition,
                        alert.target_price,
                        current_price,
                    )

            except Exception as e:
                logger.error("Error checking alert %s: %s", alert.id, e)

        await db.commit()


alert_service = AlertService()
