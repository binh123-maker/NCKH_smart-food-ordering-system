from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.response import success_response
from app.models.user import User
from app.modules.reviews.schemas import ReviewCreateRequest
from app.modules.reviews.services import ReviewService

router = APIRouter(prefix="/reviews", tags=["Review Management"])

@router.post("", status_code=status.HTTP_201_CREATED, summary="Đánh giá món ăn sau khi nhận hàng")
def create_review(
    req: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ReviewService(db)
    data = service.create_review(current_user, req)
    return success_response(data=data, message="Gửi đánh giá món ăn thành công")

@router.get("/foods/{food_id}", summary="Lấy danh sách đánh giá của món ăn")
def list_food_reviews(
    food_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = ReviewService(db)
    items, total = service.list_food_reviews(food_id=food_id, page=page, limit=limit)
    return success_response(data=items, message="Lấy đánh giá thành công", page=page, limit=limit, total=total)

