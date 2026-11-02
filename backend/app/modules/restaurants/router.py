from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.core.response import success_response
from app.models.user import User
from app.modules.restaurants.schemas import RestaurantCreateRequest, RestaurantUpdateRequest
from app.modules.restaurants.services import RestaurantService

router = APIRouter(prefix="/restaurants", tags=["Restaurant Management"])

@router.get("", summary="Lấy danh sách nhà hàng (Search, Sort, Pagination)")
def list_restaurants(
    search: Optional[str] = Query(None, description="Từ khóa tìm kiếm theo tên hoặc địa chỉ"),
    is_active: Optional[bool] = Query(True, description="Lọc trạng thái hoạt động"),
    sort_by: str = Query("rating", description="Sắp xếp theo rating, name, hoặc created_at"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = RestaurantService(db)
    items, total = service.list_restaurants(
        search=search, is_active=is_active, sort_by=sort_by, page=page, limit=limit
    )
    data = [
        {
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "description": r.description,
            "address": r.address,
            "phone": r.phone,
            "email": r.email,
            "opening_hours": r.opening_hours,
            "rating_average": float(r.rating_average),
            "total_reviews": r.total_reviews,
            "is_active": r.is_active,
        }
        for r in items
    ]
    return success_response(data=data, message="Lấy danh sách thành công", page=page, limit=limit, total=total)

@router.get("/{id_or_slug}", summary="Lấy chi tiết nhà hàng theo ID hoặc Slug")
def get_restaurant(id_or_slug: str, db: Session = Depends(get_db)):
    service = RestaurantService(db)
    r = service.get_by_id_or_slug(id_or_slug)
    data = {
        "id": r.id,
        "name": r.name,
        "slug": r.slug,
        "description": r.description,
        "address": r.address,
        "phone": r.phone,
        "email": r.email,
        "opening_hours": r.opening_hours,
        "rating_average": float(r.rating_average),
        "total_reviews": r.total_reviews,
        "is_active": r.is_active,
    }
    return success_response(data=data, message="Lấy chi tiết nhà hàng thành công")

@router.post("", status_code=status.HTTP_201_CREATED, summary="Tạo mới nhà hàng (Admin / Staff)")
def create_restaurant(
    req: RestaurantCreateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
    db: Session = Depends(get_db),
):
    service = RestaurantService(db)
    r = service.create_restaurant(req)
    return success_response(
        data={"id": r.id, "name": r.name, "slug": r.slug},
        message="Tạo mới nhà hàng thành công",
    )

@router.put("/{restaurant_id}", summary="Cập nhật nhà hàng (Admin / Staff)")
def update_restaurant(
    restaurant_id: str,
    req: RestaurantUpdateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
    db: Session = Depends(get_db),
):
    service = RestaurantService(db)
    r = service.update_restaurant(restaurant_id, req)
    return success_response(
        data={"id": r.id, "name": r.name, "slug": r.slug},
        message="Cập nhật nhà hàng thành công",
    )

@router.delete("/{restaurant_id}", summary="Xóa nhà hàng (Admin only)")
def delete_restaurant(
    restaurant_id: str,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    service = RestaurantService(db)
    service.delete_restaurant(restaurant_id)
    return success_response(message="Xóa nhà hàng thành công")

