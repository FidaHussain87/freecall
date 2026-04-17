import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.collection import Collection
from app.models.request import SavedRequest

router = APIRouter(prefix="/api", tags=["import_export"])

MAX_IMPORT_SIZE = 10 * 1024 * 1024  # 10 MB


def _serialize_collection(collection: Collection, all_collections: list[Collection]) -> dict:
    """Serialize a collection. Uses the flat all_collections list to find children."""
    data = {
        "name": collection.name,
        "description": collection.description,
        "requests": [
            {
                "name": r.name,
                "sort_order": r.sort_order,
                "method": r.method,
                "url": r.url,
                "headers": r.headers,
                "query_params": r.query_params,
                "body_type": r.body_type,
                "body_content": r.body_content,
                "auth_type": r.auth_type,
                "auth_data": r.auth_data,
            }
            for r in sorted(collection.requests, key=lambda r: r.sort_order)
        ],
    }
    # Find children from the flat list
    children = [c for c in all_collections if c.parent_id == collection.id]
    if children:
        data["children"] = [_serialize_collection(child, all_collections) for child in children]
    return data


async def _load_all_collections(db: AsyncSession) -> list[Collection]:
    """Load all collections with their requests eagerly."""
    result = await db.execute(
        select(Collection).options(selectinload(Collection.requests)).order_by(Collection.name)
    )
    return list(result.scalars().all())


@router.get("/export/collections/{collection_id}")
async def export_collection(collection_id: int, db: AsyncSession = Depends(get_db)):
    all_colls = await _load_all_collections(db)
    collection = next((c for c in all_colls if c.id == collection_id), None)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    data = {"version": 1, "collections": [_serialize_collection(collection, all_colls)]}
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f'attachment; filename="{collection.name}.json"'},
    )


@router.get("/export/collections")
async def export_all_collections(db: AsyncSession = Depends(get_db)):
    all_colls = await _load_all_collections(db)
    roots = [c for c in all_colls if c.parent_id is None]
    data = {
        "version": 1,
        "collections": [_serialize_collection(c, all_colls) for c in roots],
    }
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": 'attachment; filename="freecall_export.json"'},
    )


@router.post("/import/collections", status_code=201)
async def import_collections(
    file: UploadFile = File(...), db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    if len(content) > MAX_IMPORT_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    if not isinstance(data, dict) or "collections" not in data:
        raise HTTPException(status_code=400, detail="Invalid format: missing 'collections' key")

    if not isinstance(data["collections"], list):
        raise HTTPException(status_code=400, detail="Invalid format: 'collections' must be an array")

    imported = []

    async def _import_collection(coll_data: dict, parent_id: int | None = None):
        if not isinstance(coll_data, dict):
            return
        name = coll_data.get("name")
        if not name or not isinstance(name, str):
            name = "Imported Collection"

        collection = Collection(
            name=name,
            description=coll_data.get("description"),
            parent_id=parent_id,
        )
        db.add(collection)
        await db.flush()

        for req_data in coll_data.get("requests", []):
            if not isinstance(req_data, dict):
                continue
            req = SavedRequest(
                collection_id=collection.id,
                name=req_data.get("name", "Imported Request"),
                sort_order=req_data.get("sort_order", 0),
                method=req_data.get("method", "GET"),
                url=req_data.get("url", ""),
                headers=req_data.get("headers"),
                query_params=req_data.get("query_params"),
                body_type=req_data.get("body_type"),
                body_content=req_data.get("body_content"),
                auth_type=req_data.get("auth_type"),
                auth_data=req_data.get("auth_data"),
            )
            db.add(req)

        imported.append(collection.name)

        # Import sub-collections
        for child_data in coll_data.get("children", []):
            await _import_collection(child_data, parent_id=collection.id)

    for coll_data in data["collections"]:
        await _import_collection(coll_data)

    await db.commit()
    return {"imported": imported, "count": len(imported)}
