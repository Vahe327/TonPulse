from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime
import uuid


class AlertCreate(BaseModel):
    token_address: str
    token_symbol: str
    condition: str = Field(pattern=r"^(above|below)$")
    target_price: Decimal = Field(gt=Decimal("0"))
    current_price_at_creation: Decimal = Field(gt=Decimal("0"))
    is_repeating: bool = False


class AlertResponse(BaseModel):
    id: uuid.UUID
    user_id: int
    token_address: str
    token_symbol: str
    condition: str
    target_price: Decimal
    current_price_at_creation: Decimal
    is_active: bool
    is_repeating: bool
    triggered_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
