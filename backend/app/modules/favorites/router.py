from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.response import success_response
from app.models.user import User
from app.modules.favorites.services import FavoriteService

router = APIRouter(prefix="/favorites", tags=["Favorite Management"])

@router.post("/toggle/{food_id}", summary="Bật/Tắt lưu món ăn yêu thích")
def toggle_favorite(
    food_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = FavoriteService(db)
    data = service.toggle_favorite(current_user, food_id)
    msg = "Đã thêm vào danh sách yêu thích" if data["is_favorite"] else "Đã xóa khỏi danh sách yêu thích"
    return success_response(data=data, message=msg)

@router.get("", summary="Lấy danh sách món ăn yêu thích của tôi")
def list_favorites(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = FavoriteService(db)
    items, total = service.list_favorites(current_user, page=page, limit=limit)
    return success_response(data=items, message="Lấy danh sách yêu thích thành công", page=page, limit=limit, total=total)

