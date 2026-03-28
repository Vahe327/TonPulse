import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("")
async def list_transactions(
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
    )

    if cursor:
        try:
            cursor_uuid = uuid.UUID(cursor)
            cursor_tx = await db.get(Transaction, cursor_uuid)
            if cursor_tx:
                query = query.where(Transaction.created_at < cursor_tx.created_at)
        except ValueError:
            pass

    query = query.limit(limit + 1)
    result = await db.execute(query)
    transactions = list(result.scalars().all())

    has_more = len(transactions) > limit
    if has_more:
        transactions = transactions[:limit]

    next_cursor = str(transactions[-1].id) if has_more and transactions else None

    return PaginatedResponse(
        items=[
            {
                "id": str(tx.id),
                "from_token_address": tx.from_token_address,
                "from_token_symbol": tx.from_token_symbol,
                "from_amount": str(tx.from_amount),
                "to_token_address": tx.to_token_address,
                "to_token_symbol": tx.to_token_symbol,
                "to_amount": str(tx.to_amount),
                "price_impact": str(tx.price_impact) if tx.price_impact else None,
                "tx_hash": tx.tx_hash,
                "status": tx.status,
                "created_at": tx.created_at.isoformat(),
            }
            for tx in transactions
        ],
        next_cursor=next_cursor,
        has_more=has_more,
    )
