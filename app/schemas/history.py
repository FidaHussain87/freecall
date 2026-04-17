from datetime import datetime

from pydantic import BaseModel


class HistoryOut(BaseModel):
    id: int
    method: str
    url: str
    request_headers: dict | None = None
    request_body: str | None = None
    status_code: int | None = None
    response_headers: dict | None = None
    response_body: str | None = None
    response_time_ms: float | None = None
    response_size_bytes: int | None = None
    error: str | None = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class HistoryListOut(BaseModel):
    id: int
    method: str
    url: str
    status_code: int | None = None
    response_time_ms: float | None = None
    error: str | None = None
    timestamp: datetime

    model_config = {"from_attributes": True}
