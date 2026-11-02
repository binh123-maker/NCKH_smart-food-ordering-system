from typing import Optional
from pydantic import BaseModel, Field

class RestaurantCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: Optional[str] = None
    description: Optional[str] = None
    address: str = Field(min_length=5, max_length=255)
    phone: str = Field(min_length=8, max_length=20)
    email: Optional[str] = None
    opening_hours: str = Field(default="08:00 - 22:00")
    is_active: bool = True

class RestaurantUpdateRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    opening_hours: Optional[str] = None
    is_active: Optional[bool] = None

class RestaurantResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    address: str
    phone: str
    email: Optional[str] = None
    opening_hours: str
    rating_average: float
    total_reviews: int
    is_active: bool

