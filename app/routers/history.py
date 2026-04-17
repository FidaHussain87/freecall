from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.history import RequestHistory
from app.schemas.history import HistoryOut, HistoryListOut

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryListOut])
async def list_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RequestHistory)
        .order_by(RequestHistory.timestamp.desc())
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{history_id}", response_model=HistoryOut)
async def get_history(history_id: int, db: AsyncSession = Depends(get_db)):
    entry = await db.get(RequestHistory, history_id)
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    return entry


@router.delete("", status_code=204)
async def clear_history(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(RequestHistory))
    await db.commit()
