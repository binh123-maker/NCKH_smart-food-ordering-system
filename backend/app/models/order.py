from typing import Optional, List
from sqlalchemy import String, Integer, Numeric, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid

class Order(Base, TimestampMixin):
    """
    Core Order Transaction Entity.
    Tracks FSM status transitions and forms explicit purchase history for RecSys.
    """
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    order_code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    restaurant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("restaurants.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    address_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("user_addresses.id", ondelete="SET NULL"), nullable=True
    )
    
    # Financial snapshot
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    delivery_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    # Order lifecycle FSM: PENDING, CONFIRMED, PREPARING, DELIVERING, COMPLETED, CANCELLED
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False, index=True)
    
    # Payment lifecycle
    payment_method: Mapped[str] = mapped_column(String(30), default="COD", nullable=False)
    payment_status: Mapped[str] = mapped_column(String(30), default="UNPAID", nullable=False)
    
    # Delivery info snapshot
    delivery_address_snapshot: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    delivery_notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    payment: Mapped[Optional["Payment"]] = relationship(
        "Payment", back_populates="order", uselist=False, cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="order")

    __table_args__ = (
        Index("idx_orders_user_created", "user_id", "created_at"),
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    food_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("foods.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    
    # Immutable snapshots at purchase time
    food_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_price_snapshot: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    food: Mapped["Food"] = relationship("Food", back_populates="order_items")

