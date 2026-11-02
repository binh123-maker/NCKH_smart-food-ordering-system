from typing import Optional
from sqlalchemy import String, Integer, Text, Boolean, ForeignKey, UniqueConstraint, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid

class Review(Base, TimestampMixin):
    """
    Explicit Customer Feedback (1-5 Star Rating & Review Text).
    Used directly in Collaborative Filtering Matrix and Sentiment/Quality estimation.
    """
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="reviews")
    food: Mapped["Food"] = relationship("Food", back_populates="reviews")
    order: Mapped["Order"] = relationship("Order", back_populates="reviews")

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating_range"),
        UniqueConstraint("user_id", "food_id", "order_id", name="uq_user_food_order_review"),
        Index("idx_reviews_user_food", "user_id", "food_id"),
    )

class Favorite(Base, TimestampMixin):
    """
    Explicit Bookmarking of Food Items.
    Strong explicit preference signal for RecSys profile construction.
    """
    __tablename__ = "favorites"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="favorites")
    food: Mapped["Food"] = relationship("Food", back_populates="favorites")

    __table_args__ = (
        UniqueConstraint("user_id", "food_id", name="uq_user_food_favorite"),
    )

