from sqlalchemy import String, Integer, Numeric, Boolean, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from decimal import Decimal
from typing import Optional

from app.database import Base


class CachedToken(Base):
    __tablename__ = "cached_tokens"

    address: Mapped[str] = mapped_column(String(128), primary_key=True)
    symbol: Mapped[str] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(255))
    decimals: Mapped[int] = mapped_column(Integer, default=9)
    icon_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    description_en: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description_ru: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    market_cap: Mapped[Optional[Decimal]] = mapped_column(Numeric(28, 2), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<CachedToken address={self.address} symbol={self.symbol}>"
