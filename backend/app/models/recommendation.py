from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, Numeric, DateTime, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid

class ModelVersion(Base, TimestampMixin):
    """
    Experimental Model Tracking Entity for Scientific RecSys Evaluation.
    Guarantees reproducibility, version auditing, and benchmark metric history.
    """
    __tablename__ = "model_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    version_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    algorithm_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # CONTENT_BASED, COLLABORATIVE_SVD, HYBRID_WEIGHTED
    hyperparameters: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    # Offline Scientific Benchmarks evaluated on Test Set
    precision_at_k: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    recall_at_k: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    f1_at_k: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    ndcg_at_k: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    map_at_k: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    coverage_rate: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    recommendation_logs: Mapped[List["RecommendationLog"]] = relationship(
        "RecommendationLog", back_populates="model_version"
    )

class RecommendationLog(Base):
    """
    Inference Audit Log for Serving Top-K Recommendations.
    """
    __tablename__ = "recommendation_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    model_version_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("model_versions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    recommendation_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # HOME_FEED, SIMILAR_FOOD, CART_UPSELL
    recommended_item_ids: Mapped[dict] = mapped_column(
        JSON, nullable=False
    )  # [{"food_id": "...", "score": 0.95, "rank": 1}]
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )

    user: Mapped[Optional["User"]] = relationship("User", back_populates="recommendation_logs")
    model_version: Mapped[Optional["ModelVersion"]] = relationship(
        "ModelVersion", back_populates="recommendation_logs"
    )
    feedback_items: Mapped[List["RecommendationFeedback"]] = relationship(
        "RecommendationFeedback", back_populates="log", cascade="all, delete-orphan"
    )

class RecommendationFeedback(Base):
    """
    Direct user responses to recommendation impressions (Click, Purchase, Dismiss).
    Used for online evaluation (CTR, Conversion) and future contextual bandit retraining.
    """
    __tablename__ = "recommendation_feedback"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    log_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recommendation_logs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    food_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True
    )
    feedback_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # IMPRESSION, CLICK, PURCHASE, DISLIKE
    position_rank: Mapped[Optional[int]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    log: Mapped["RecommendationLog"] = relationship("RecommendationLog", back_populates="feedback_items")

