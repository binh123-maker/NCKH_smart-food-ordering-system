from typing import Optional, List
from pydantic import BaseModel, Field

class AddToCartRequest(BaseModel):
    food_id: str
    quantity: int = Field(default=1, ge=1)
    notes: Optional[str] = None
    force_clear_if_different_restaurant: bool = False

class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(ge=1)
    notes: Optional[str] = None

class CartItemDetail(BaseModel):
    id: str
    food_id: str
    food_name: str
    unit_price: float
    quantity: int
    subtotal: float
    image_url: Optional[str] = None
    notes: Optional[str] = None
    is_available: bool

class CartResponse(BaseModel):
    id: str
    restaurant_id: Optional[str] = None
    restaurant_name: Optional[str] = None
    total_items: int
    subtotal: float
    items: List[CartItemDetail]

