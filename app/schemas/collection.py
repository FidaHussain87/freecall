from datetime import datetime

from pydantic import BaseModel


class SavedRequestBase(BaseModel):
    name: str
    method: str = "GET"
    url: str = ""
    headers: list[dict] | None = None
    query_params: list[dict] | None = None
    body_type: str | None = None
    body_content: str | None = None
    auth_type: str | None = None
    auth_data: dict | None = None
    sort_order: int = 0


class SavedRequestCreate(SavedRequestBase):
    pass


class SavedRequestUpdate(BaseModel):
    name: str | None = None
    method: str | None = None
    url: str | None = None
    headers: list[dict] | None = None
    query_params: list[dict] | None = None
    body_type: str | None = None
    body_content: str | None = None
    auth_type: str | None = None
    auth_data: dict | None = None
    sort_order: int | None = None


class SavedRequestOut(SavedRequestBase):
    id: int
    collection_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CollectionBase(BaseModel):
    name: str
    description: str | None = None
    parent_id: int | None = None


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    parent_id: int | None = None


class CollectionOut(CollectionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    requests: list[SavedRequestOut] = []

    model_config = {"from_attributes": True}


class CollectionListOut(CollectionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    request_count: int = 0

    model_config = {"from_attributes": True}
