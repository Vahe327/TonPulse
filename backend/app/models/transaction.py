import uuid
from sqlalchemy import BigInteger, String, Numeric, DateTime, ForeignKey, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from decimal import Decimal
from typing import Optional

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    from_token_address: Mapped[str] = mapped_column(String(128))
    from_token_symbol: Mapped[str] = mapped_column(String(32))
    from_amount: Mapped[Decimal] = mapped_column(Numeric(38, 18))
    to_token_address: Mapped[str] = mapped_column(String(128))
    to_token_symbol: Mapped[str] = mapped_column(String(32))
    to_amount: Mapped[Decimal] = mapped_column(Numeric(38, 18))
    price_impact: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    tx_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction id={self.id} {self.from_token_symbol}->{self.to_token_symbol} status={self.status}>"
