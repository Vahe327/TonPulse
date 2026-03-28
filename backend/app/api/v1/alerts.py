import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
):
    alerts = await alert_service.get_user_alerts(user_id, db)
    return alerts


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(
    data: AlertCreate,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        alert = await alert_service.create_alert(user_id, data, db)
        return alert
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: uuid.UUID,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
):
    deleted = await alert_service.delete_alert(alert_id, user_id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")
