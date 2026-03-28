import uuid
from sqlalchemy import BigInteger, String, Numeric, Boolean, DateTime, ForeignKey, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from decimal import Decimal
from typing import Optional

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token_address: Mapped[str] = mapped_column(String(128))
    token_symbol: Mapped[str] = mapped_column(String(32))
    condition: Mapped[str] = mapped_column(String(10))  # 'above' or 'below'
    target_price: Mapped[Decimal] = mapped_column(Numeric(28, 10))
    current_price_at_creation: Mapped[Decimal] = mapped_column(Numeric(28, 10))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    is_repeating: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    triggered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="alerts")

    def __repr__(self) -> str:
        return f"<Alert id={self.id} token={self.token_symbol} {self.condition} {self.target_price}>"
