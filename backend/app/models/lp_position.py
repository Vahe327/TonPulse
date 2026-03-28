import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class LPPosition(Base):
    __tablename__ = "lp_positions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False, index=True
    )
    pool_address: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    token_a_address: Mapped[str] = mapped_column(String(128), nullable=False)
    token_a_symbol: Mapped[str] = mapped_column(String(32), nullable=False)
    token_b_address: Mapped[str] = mapped_column(String(128), nullable=False)
    token_b_symbol: Mapped[str] = mapped_column(String(32), nullable=False)
    lp_amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=40, scale=0), nullable=False, default=0
    )
    token_a_deposited: Mapped[Decimal] = mapped_column(
        Numeric(precision=40, scale=0), nullable=False, default=0
    )
    token_b_deposited: Mapped[Decimal] = mapped_column(
        Numeric(precision=40, scale=0), nullable=False, default=0
    )
    value_usd_at_deposit: Mapped[Decimal] = mapped_column(
        Numeric(precision=20, scale=2), nullable=True
    )
    provision_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="Balanced"
    )
    tx_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="active", index=True
    )
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
