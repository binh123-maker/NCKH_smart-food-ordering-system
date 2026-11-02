from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ReviewCreateRequest(BaseModel):
    food_id: str
    order_id: str
    rating: int = Field(ge=1, le=5, description="Số sao đánh giá từ 1 đến 5")
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    food_id: str
    food_name: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime

