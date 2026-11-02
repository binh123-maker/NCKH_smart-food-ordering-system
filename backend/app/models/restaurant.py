from typing import Optional, List
from sqlalchemy import String, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid

class Restaurant(Base, TimestampMixin):
    __tablename__ = "restaurants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    opening_hours: Mapped[str] = mapped_column(String(100), default="08:00 - 22:00", nullable=False)
    rating_average: Mapped[float] = mapped_column(Numeric(3, 2), default=0.00, nullable=False)
    total_reviews: Mapped[int] = mapped_column(default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    foods: Mapped[List["Food"]] = relationship("Food", back_populates="restaurant")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="restaurant")
    carts: Mapped[List["Cart"]] = relationship("Cart", back_populates="restaurant")

