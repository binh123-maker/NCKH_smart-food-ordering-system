from typing import Optional, List
from sqlalchemy import String, Integer, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid

class Cart(Base, TimestampMixin):
    __tablename__ = "carts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    restaurant_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("restaurants.id", ondelete="SET NULL"), nullable=True, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="cart")
    restaurant: Mapped[Optional["Restaurant"]] = relationship("Restaurant", back_populates="carts")
    items: Mapped[List["CartItem"]] = relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan"
    )

class CartItem(Base, TimestampMixin):
    __tablename__ = "cart_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    cart_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    food: Mapped["Food"] = relationship("Food", back_populates="cart_items")

    __table_args__ = (
        UniqueConstraint("cart_id", "food_id", name="uq_cart_food_item"),
    )

