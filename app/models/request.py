from datetime import datetime

from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SavedRequest(Base):
    __tablename__ = "saved_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    collection_id: Mapped[int] = mapped_column(ForeignKey("collections.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    method: Mapped[str] = mapped_column(String(10), default="GET")
    url: Mapped[str] = mapped_column(Text, default="")
    headers: Mapped[dict | None] = mapped_column(JSON, default=None)
    query_params: Mapped[dict | None] = mapped_column(JSON, default=None)
    body_type: Mapped[str | None] = mapped_column(String(20), default=None)
    body_content: Mapped[str | None] = mapped_column(Text, default=None)
    auth_type: Mapped[str | None] = mapped_column(String(20), default=None)
    auth_data: Mapped[dict | None] = mapped_column(JSON, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    collection: Mapped["Collection"] = relationship("Collection", back_populates="requests")
