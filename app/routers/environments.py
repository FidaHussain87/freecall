from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.environment import Environment, EnvironmentVariable
from app.schemas.environment import (
    EnvironmentCreate,
    EnvironmentUpdate,
    EnvironmentOut,
    BulkVariablesPayload,
)

router = APIRouter(prefix="/api/environments", tags=["environments"])


@router.get("", response_model=list[EnvironmentOut])
async def list_environments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Environment).order_by(Environment.name))
    return result.scalars().all()


@router.post("", response_model=EnvironmentOut, status_code=201)
async def create_environment(data: EnvironmentCreate, db: AsyncSession = Depends(get_db)):
    env = Environment(name=data.name)
    db.add(env)
    await db.commit()
    await db.refresh(env)
    return env


@router.get("/{env_id}", response_model=EnvironmentOut)
async def get_environment(env_id: int, db: AsyncSession = Depends(get_db)):
    env = await db.get(Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    return env


@router.put("/{env_id}", response_model=EnvironmentOut)
async def update_environment(
    env_id: int, data: EnvironmentUpdate, db: AsyncSession = Depends(get_db)
):
    env = await db.get(Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    if data.name is not None:
        env.name = data.name
    await db.commit()
    await db.refresh(env)
    return env


@router.delete("/{env_id}", status_code=204)
async def delete_environment(env_id: int, db: AsyncSession = Depends(get_db)):
    env = await db.get(Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    await db.delete(env)
    await db.commit()


@router.post("/{env_id}/activate", response_model=EnvironmentOut)
async def activate_environment(env_id: int, db: AsyncSession = Depends(get_db)):
    env = await db.get(Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    # Deactivate all others in a single statement (avoids race conditions)
    await db.execute(update(Environment).values(is_active=False))
    env.is_active = True

    await db.commit()
    await db.refresh(env)
    return env


@router.put("/{env_id}/variables", response_model=EnvironmentOut)
async def bulk_set_variables(
    env_id: int, data: BulkVariablesPayload, db: AsyncSession = Depends(get_db)
):
    env = await db.get(Environment, env_id)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    # Delete existing variables
    for v in list(env.variables):
        await db.delete(v)

    # Add new variables
    for var_data in data.variables:
        var = EnvironmentVariable(
            environment_id=env_id,
            key=var_data.key,
            value=var_data.value,
            is_secret=var_data.is_secret,
        )
        db.add(var)

    await db.commit()
    await db.refresh(env)
    return env
