from typing import Optional, List
from sqlalchemy import String, Boolean, Numeric, Integer, Text, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid

class Food(Base, TimestampMixin):
    __tablename__ = "foods"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    restaurant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    original_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    preparation_time_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    
    # Statistical counters for RecSys popularity ranking
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    order_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rating_average: Mapped[float] = mapped_column(Numeric(3, 2), default=0.00, nullable=False)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="foods")
    category: Mapped["Category"] = relationship("Category", back_populates="foods")
    nutrition: Mapped[Optional["FoodNutrition"]] = relationship(
        "FoodNutrition", back_populates="food", uselist=False, cascade="all, delete-orphan"
    )
    images: Mapped[List["FoodImage"]] = relationship(
        "FoodImage", back_populates="food", cascade="all, delete-orphan"
    )
    food_ingredients: Mapped[List["FoodIngredient"]] = relationship(
        "FoodIngredient", back_populates="food", cascade="all, delete-orphan"
    )
    cart_items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="food")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="food")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="food")
    favorites: Mapped[List["Favorite"]] = relationship(
        "Favorite", back_populates="food", cascade="all, delete-orphan"
    )
    interactions: Mapped[List["UserInteraction"]] = relationship(
        "UserInteraction", back_populates="food", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_foods_rating_order", "rating_average", "order_count"),
    )

class FoodNutrition(Base, TimestampMixin):
    """
    Quantitative Nutritional Profile of Food.
    Core feature vector source for Content-Based Filtering.
    """
    __tablename__ = "food_nutrition"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    food_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("foods.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    calories: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False, index=True)
    protein: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False, index=True)
    fat: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    carbohydrates: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    fiber: Mapped[float] = mapped_column(Numeric(8, 2), default=0.00, nullable=False)
    sodium: Mapped[float] = mapped_column(Numeric(8, 2), default=0.00, nullable=False)

    food: Mapped["Food"] = relationship("Food", back_populates="nutrition")

    __table_args__ = (
        Index("idx_nutrition_macro", "calories", "protein", "fat", "carbohydrates"),
    )

class FoodImage(Base, TimestampMixin):
    __tablename__ = "food_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    food_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    food: Mapped["Food"] = relationship("Food", back_populates="images")

class Ingredient(Base, TimestampMixin):
    __tablename__ = "ingredients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    food_ingredients: Mapped[List["FoodIngredient"]] = relationship(
        "FoodIngredient", back_populates="ingredient"
    )

class FoodIngredient(Base):
    __tablename__ = "food_ingredients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    food_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("foods.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ingredient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quantity_text: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    food: Mapped["Food"] = relationship("Food", back_populates="food_ingredients")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient", back_populates="food_ingredients")

    __table_args__ = (
        UniqueConstraint("food_id", "ingredient_id", name="uq_food_ingredient"),
    )

