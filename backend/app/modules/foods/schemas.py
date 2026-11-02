from typing import Optional, List
from pydantic import BaseModel, Field

class NutritionSchema(BaseModel):
    calories: float = Field(ge=0, description="Năng lượng (kcal)")
    protein: float = Field(ge=0, description="Đạm (g)")
    fat: float = Field(ge=0, description="Chất béo (g)")
    carbohydrates: float = Field(ge=0, description="Tinh bột (g)")
    fiber: float = Field(default=0.0, ge=0)
    sodium: float = Field(default=0.0, ge=0)

class FoodCreateRequest(BaseModel):
    restaurant_id: str
    category_id: str
    name: str = Field(min_length=2, max_length=255)
    slug: Optional[str] = None
    description: Optional[str] = None
    price: float = Field(gt=0)
    original_price: Optional[float] = None
    is_available: bool = True
    preparation_time_minutes: int = 15
    image_urls: Optional[List[str]] = None
    ingredients: Optional[List[str]] = None
    nutrition: Optional[NutritionSchema] = None

class FoodUpdateRequest(BaseModel):
    restaurant_id: Optional[str] = None
    category_id: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    is_available: Optional[bool] = None
    preparation_time_minutes: Optional[int] = None
    image_urls: Optional[List[str]] = None
    ingredients: Optional[List[str]] = None
    nutrition: Optional[NutritionSchema] = None

