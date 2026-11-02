from typing import Optional, List
from pydantic import BaseModel, Field

class RecommendedFoodItem(BaseModel):
    id: str
    food_id: str
    name: str
    slug: str
    price: float
    image_url: Optional[str] = None
    rating_average: float
    restaurant_name: Optional[str] = None
    match_score: float = Field(description="Điểm phù hợp từ 0.0 đến 1.0 (hoặc %)")
    match_reason: str = Field(description="Giải thích lý do gợi ý (Explainable AI)")
    calories: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbohydrates: Optional[float] = None

class RecommendationResponse(BaseModel):
    model_version: str
    recommendation_type: str
    items: List[RecommendedFoodItem]

class RecommendationFeedbackRequest(BaseModel):
    log_id: Optional[str] = None
    food_id: str
    feedback_type: str = Field(description="CLICK, PURCHASE, DISLIKE, NOT_INTERESTED")
    position_rank: Optional[int] = None

