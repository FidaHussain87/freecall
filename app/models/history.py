from datetime import datetime

from sqlalchemy import String, Text, Integer, Float, DateTime, JSON, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RequestHistory(Base):
    __tablename__ = "request_history"
    __table_args__ = (
        Index("ix_history_timestamp", "timestamp"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    request_headers: Mapped[dict | None] = mapped_column(JSON, default=None)
    request_body: Mapped[str | None] = mapped_column(Text, default=None)
    status_code: Mapped[int | None] = mapped_column(Integer, default=None)
    response_headers: Mapped[dict | None] = mapped_column(JSON, default=None)
    response_body: Mapped[str | None] = mapped_column(Text, default=None)
    response_time_ms: Mapped[float | None] = mapped_column(Float, default=None)
    response_size_bytes: Mapped[int | None] = mapped_column(Integer, default=None)
    error: Mapped[str | None] = mapped_column(Text, default=None)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
