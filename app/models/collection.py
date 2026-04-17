from datetime import datetime

from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Collection(Base):
    __tablename__ = "collections"
    __table_args__ = (
        Index("ix_collections_parent_id", "parent_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    parent_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("collections.id", ondelete="CASCADE"), default=None
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    requests: Mapped[list["SavedRequest"]] = relationship(
        "SavedRequest", back_populates="collection", cascade="all, delete-orphan",
        lazy="selectin",
    )

    children: Mapped[list["Collection"]] = relationship(
        "Collection", back_populates="parent", cascade="all, delete-orphan",
        lazy="selectin",
    )
    parent: Mapped["Collection | None"] = relationship(
        "Collection", back_populates="children", remote_side=[id],
    )
