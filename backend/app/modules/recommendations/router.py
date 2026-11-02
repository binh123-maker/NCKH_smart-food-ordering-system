from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.core.response import success_response
from app.models.user import User
from app.modules.recommendations.schemas import RecommendationFeedbackRequest
from app.modules.recommendations.services import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendation Engine"])

@router.get("/home-feed", summary="Lấy danh sách món ăn gợi ý cá nhân hóa cho Trang chủ")
def get_home_feed_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    service = RecommendationService(db)
    items = service.get_home_recommendations(current_user, limit=limit)
    return success_response(
        data={
            "model_version": "v1.0-baseline-hybrid",
            "recommendation_type": "HOME_FEED",
            "items": items,
        },
        message="Lấy gợi ý món ăn thành công",
    )

@router.get("/similar/{food_id}", summary="Gợi ý món ăn tương tự (Content-Based Filtering)")
def get_similar_foods(
    food_id: str,
    limit: int = Query(4, ge=1, le=20),
    db: Session = Depends(get_db),
):
    service = RecommendationService(db)
    items = service.get_similar_foods(food_id=food_id, limit=limit)
    return success_response(
        data={
            "model_version": "v1.0-cbf-nutrition",
            "recommendation_type": "SIMILAR_FOOD",
            "items": items,
        },
        message="Lấy món ăn tương tự thành công",
    )

@router.get("/cart-upsell", summary="Gợi ý món ăn kèm / bổ sung trong giỏ hàng")
def get_cart_upsell(
    limit: int = Query(4, ge=1, le=10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = RecommendationService(db)
    items = service.get_cart_upsell(current_user, limit=limit)
    return success_response(
        data={
            "model_version": "v1.0-co-occurrence",
            "recommendation_type": "CART_UPSELL",
            "items": items,
        },
        message="Lấy gợi ý món ăn kèm thành công",
    )

@router.post("/feedback", status_code=status.HTTP_201_CREATED, summary="Ghi nhận phản hồi người dùng với mục gợi ý (Click, Dislike)")
def record_recommendation_feedback(
    req: RecommendationFeedbackRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    service = RecommendationService(db)
    result = service.record_feedback(current_user, req)
    return success_response(data=result, message="Ghi nhận phản hồi gợi ý thành công")

