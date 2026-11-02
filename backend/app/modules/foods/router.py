from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.core.response import success_response
from app.models.user import User
from app.modules.foods.schemas import FoodCreateRequest, FoodUpdateRequest
from app.modules.foods.services import FoodService

router = APIRouter(prefix="/foods", tags=["Food Management"])

@router.get("", summary="Tìm kiếm và lọc danh sách món ăn đa tiêu chí")
def list_foods(
    search: Optional[str] = Query(None, description="Từ khóa tìm kiếm món ăn"),
    category_id: Optional[str] = Query(None, description="Lọc theo danh mục"),
    restaurant_id: Optional[str] = Query(None, description="Lọc theo nhà hàng"),
    min_price: Optional[float] = Query(None, ge=0, description="Giá tối thiểu"),
    max_price: Optional[float] = Query(None, ge=0, description="Giá tối đa"),
    min_rating: Optional[float] = Query(None, ge=1, le=5, description="Số sao tối thiểu"),
    max_calories: Optional[float] = Query(None, ge=0, description="Lọc món ăn có calo <= max_calories"),
    min_protein: Optional[float] = Query(None, ge=0, description="Lọc món ăn có protein >= min_protein"),
    is_available: Optional[bool] = Query(True, description="Chỉ lấy món đang phục vụ"),
    sort_by: str = Query("popular", description="popular, rating, price_asc, price_desc, newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = FoodService(db)
    items, total = service.list_foods(
        search=search,
        category_id=category_id,
        restaurant_id=restaurant_id,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        max_calories=max_calories,
        min_protein=min_protein,
        is_available=is_available,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )
    return success_response(
        data=items,
        message="Lấy danh sách món ăn thành công",
        page=page,
        limit=limit,
        total=total,
    )

@router.get("/{id_or_slug}", summary="Xem chi tiết món ăn (kèm dinh dưỡng và nguyên liệu)")
def get_food(id_or_slug: str, db: Session = Depends(get_db)):
    service = FoodService(db)
    data = service.get_by_id_or_slug(id_or_slug)
    return success_response(data=data, message="Lấy chi tiết món ăn thành công")

@router.post("", status_code=status.HTTP_201_CREATED, summary="Tạo mới món ăn (Admin / Staff)")
def create_food(
    req: FoodCreateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
    db: Session = Depends(get_db),
):
    service = FoodService(db)
    data = service.create_food(req)
    return success_response(data=data, message="Tạo món ăn thành công")

@router.put("/{food_id}", summary="Cập nhật món ăn (Admin / Staff)")
def update_food(
    food_id: str,
    req: FoodUpdateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
    db: Session = Depends(get_db),
):
    service = FoodService(db)
    data = service.update_food(food_id, req)
    return success_response(data=data, message="Cập nhật món ăn thành công")

@router.delete("/{food_id}", summary="Xóa món ăn (Admin only)")
def delete_food(
    food_id: str,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    service = FoodService(db)
    service.delete_food(food_id)
    return success_response(message="Xóa món ăn thành công")

