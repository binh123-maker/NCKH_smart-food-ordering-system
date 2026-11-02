from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Numeric, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_uuid

class UserInteraction(Base):
    """
    Central Granular Event Log for Recommender System.
    Captures both implicit (VIEW, CLICK, ADD_TO_CART) and explicit (ORDER, REVIEW, FAVORITE) actions.
    """
    __tablename__ = "user_interactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True
    )
    interaction_type: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )  # VIEW, CLICK, ADD_TO_CART, ORDER, FAVORITE, REVIEW
    interaction_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=1.00, nullable=False)
    dwell_time_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    context_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="interactions")
    food: Mapped["Food"] = relationship("Food", back_populates="interactions")

    __table_args__ = (
        Index("idx_interactions_user_food", "user_id", "food_id"),
        Index("idx_interactions_food_type", "food_id", "interaction_type"),
    )

