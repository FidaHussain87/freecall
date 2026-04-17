from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.collection import Collection
from app.models.request import SavedRequest
from app.schemas.collection import (
    CollectionCreate,
    CollectionUpdate,
    CollectionOut,
    CollectionListOut,
    SavedRequestCreate,
    SavedRequestUpdate,
    SavedRequestOut,
)

router = APIRouter(prefix="/api/collections", tags=["collections"])


@router.get("", response_model=list[CollectionListOut])
async def list_collections(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Collection).order_by(Collection.name))
    collections = result.scalars().all()
    out = []
    for c in collections:
        item = CollectionListOut.model_validate(c)
        item.request_count = len(c.requests)
        out.append(item)
    return out


@router.post("", response_model=CollectionOut, status_code=201)
async def create_collection(data: CollectionCreate, db: AsyncSession = Depends(get_db)):
    if data.parent_id:
        parent = await db.get(Collection, data.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent collection not found")
    collection = Collection(name=data.name, description=data.description, parent_id=data.parent_id)
    db.add(collection)
    await db.commit()
    await db.refresh(collection)
    return collection


@router.get("/{collection_id}", response_model=CollectionOut)
async def get_collection(collection_id: int, db: AsyncSession = Depends(get_db)):
    collection = await db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection


@router.put("/{collection_id}", response_model=CollectionOut)
async def update_collection(
    collection_id: int, data: CollectionUpdate, db: AsyncSession = Depends(get_db)
):
    collection = await db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if data.name is not None:
        collection.name = data.name
    if data.description is not None:
        collection.description = data.description
    if data.parent_id is not None:
        if data.parent_id == collection_id:
            raise HTTPException(status_code=400, detail="Collection cannot be its own parent")
        collection.parent_id = data.parent_id
    await db.commit()
    await db.refresh(collection)
    return collection


@router.delete("/{collection_id}", status_code=204)
async def delete_collection(collection_id: int, db: AsyncSession = Depends(get_db)):
    collection = await db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    await db.delete(collection)
    await db.commit()


# --- Saved Requests within a Collection ---

@router.post("/{collection_id}/requests", response_model=SavedRequestOut, status_code=201)
async def create_saved_request(
    collection_id: int, data: SavedRequestCreate, db: AsyncSession = Depends(get_db)
):
    collection = await db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    req = SavedRequest(
        collection_id=collection_id,
        name=data.name,
        sort_order=data.sort_order,
        method=data.method,
        url=data.url,
        headers=data.headers,
        query_params=data.query_params,
        body_type=data.body_type,
        body_content=data.body_content,
        auth_type=data.auth_type,
        auth_data=data.auth_data,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req


@router.get("/{collection_id}/requests/{request_id}", response_model=SavedRequestOut)
async def get_saved_request(
    collection_id: int, request_id: int, db: AsyncSession = Depends(get_db)
):
    req = await db.get(SavedRequest, request_id)
    if not req or req.collection_id != collection_id:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.put("/{collection_id}/requests/{request_id}", response_model=SavedRequestOut)
async def update_saved_request(
    collection_id: int,
    request_id: int,
    data: SavedRequestUpdate,
    db: AsyncSession = Depends(get_db),
):
    req = await db.get(SavedRequest, request_id)
    if not req or req.collection_id != collection_id:
        raise HTTPException(status_code=404, detail="Request not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(req, field, value)
    await db.commit()
    await db.refresh(req)
    return req


@router.delete("/{collection_id}/requests/{request_id}", status_code=204)
async def delete_saved_request(
    collection_id: int, request_id: int, db: AsyncSession = Depends(get_db)
):
    req = await db.get(SavedRequest, request_id)
    if not req or req.collection_id != collection_id:
        raise HTTPException(status_code=404, detail="Request not found")
    await db.delete(req)
    await db.commit()
