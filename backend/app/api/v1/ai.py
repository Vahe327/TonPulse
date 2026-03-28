import logging
import uuid

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat_message import ChatMessage
from app.schemas.ai import (
    TokenAnalysisRequest,
    TokenAnalysisResponse,
    RiskScoreRequest,
    RiskScoreResponse,
    RiskScoreItem,
    SwapInsightResponse,
    SmartAssistantRequest,
    SmartAssistantResponse,
    ActionCardData,
)
from app.services.ai_service import ai_service
from app.services.smart_assistant import smart_assistant
from app.services.price_service import price_service
from app.redis_client import get_redis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze-token", response_model=TokenAnalysisResponse)
async def analyze_token(
    request: TokenAnalysisRequest,
    lang: str = Query(default="en"),
):
    try:
        result = await ai_service.analyze_token(
            token_data=request.model_dump(),
            language=lang,
        )
        return result
    except Exception as e:
        logger.error("AI analyze-token failed: %s", e)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable")


@router.post("/risk-scores", response_model=RiskScoreResponse)
async def get_risk_scores(
    request: RiskScoreRequest,
):
    tokens_data = []
    for addr in request.tokens:
        price_data = await price_service.get_token_price(addr)
        if price_data:
            tokens_data.append(price_data)
        else:
            tokens_data.append({"address": addr, "symbol": "???", "price_usd": "0"})

    try:
        scores = await ai_service.get_risk_scores(tokens_data)
        r = get_redis()
        cached_count = 0
        for s in scores:
            if await r.exists(f"ai:risk:{s['address']}"):
                cached_count += 1
        return RiskScoreResponse(
            scores=[RiskScoreItem(address=s["address"], risk_score=s["risk_score"]) for s in scores],
            cached_count=cached_count,
        )
    except Exception as e:
        logger.error("AI risk-scores failed: %s", e)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable")


@router.get("/swap-insight", response_model=SwapInsightResponse)
async def get_swap_insight(
    from_addr: str = Query(..., alias="from"),
    to_addr: str = Query(..., alias="to"),
    amount: str = Query(default="0"),
    lang: str = Query(default="en"),
):
    from_data = await price_service.get_token_price(from_addr)
    to_data = await price_service.get_token_price(to_addr)

    if not from_data:
        from_data = {"address": from_addr, "symbol": "???", "price_usd": "0"}
    if not to_data:
        to_data = {"address": to_addr, "symbol": "???", "price_usd": "0"}

    try:
        result = await ai_service.get_swap_insight(
            from_token=from_data,
            to_token=to_data,
            amount=amount,
            language=lang,
        )
        return result
    except Exception as e:
        logger.error("AI swap-insight failed: %s", e)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable")


@router.post("/chat", response_model=SmartAssistantResponse)
async def chat(
    request: SmartAssistantRequest,
    lang: str = Query(default="en"),
    db: AsyncSession = Depends(get_db),
):
    user_id = request.user_id

    history = request.history
    if user_id and not history:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
        )
        rows = (await db.execute(stmt)).scalars().all()
        history = [
            {"role": row.role, "content": row.text}
            for row in reversed(rows)
        ]

    try:
        result = await smart_assistant.process_message(
            message=request.message,
            wallet_address=request.wallet_address,
            history=history,
            language=lang,
        )

        if user_id:
            db.add(ChatMessage(
                user_id=user_id,
                role="user",
                text=request.message,
            ))
            actions_json = None
            if result.get("actions"):
                actions_json = result["actions"]
            db.add(ChatMessage(
                user_id=user_id,
                role="assistant",
                text=result["text"],
                actions=actions_json,
            ))
            await db.flush()

        return SmartAssistantResponse(
            text=result["text"],
            actions=[
                ActionCardData(type=a["type"], data=a.get("data", {}))
                for a in result.get("actions", [])
            ],
            remaining_requests=10,
            quick_actions=result.get("quick_actions", []),
        )
    except Exception as e:
        logger.error("Smart assistant chat failed: %s", e)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable")


@router.get("/chat/history")
async def get_chat_history(
    user_id: int = Query(...),
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return {
        "messages": [
            {
                "id": str(row.id),
                "role": row.role,
                "text": row.text,
                "actions": row.actions,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]
    }


@router.delete("/chat/history")
async def delete_chat_history(
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(ChatMessage).where(ChatMessage.user_id == user_id)
    )
    await db.flush()
    return {"deleted": True}
