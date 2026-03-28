from sqlalchemy import BigInteger, String, Numeric, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=False)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str] = mapped_column(String(255))
    last_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    wallet_address: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    language: Mapped[str] = mapped_column(String(5), default="en", server_default="en")
    default_slippage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("1.0"), server_default="1.0"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    alerts: Mapped[List["Alert"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username}>"
