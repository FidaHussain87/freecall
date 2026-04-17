from datetime import datetime

from pydantic import BaseModel


class EnvironmentVariableBase(BaseModel):
    key: str
    value: str = ""
    is_secret: bool = False


class EnvironmentVariableCreate(EnvironmentVariableBase):
    pass


class EnvironmentVariableOut(EnvironmentVariableBase):
    id: int
    environment_id: int

    model_config = {"from_attributes": True}


class EnvironmentBase(BaseModel):
    name: str


class EnvironmentCreate(EnvironmentBase):
    pass


class EnvironmentUpdate(BaseModel):
    name: str | None = None


class EnvironmentOut(EnvironmentBase):
    id: int
    is_active: bool
    created_at: datetime
    variables: list[EnvironmentVariableOut] = []

    model_config = {"from_attributes": True}


class BulkVariablesPayload(BaseModel):
    variables: list[EnvironmentVariableCreate]
