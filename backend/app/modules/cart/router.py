from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.response import success_response
from app.models.user import User
from app.modules.cart.schemas import AddToCartRequest, UpdateCartItemRequest
from app.modules.cart.services import CartService

router = APIRouter(prefix="/cart", tags=["Cart Management"])

@router.get("", summary="Lấy chi tiết giỏ hàng hiện tại của khách hàng")
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = CartService(db)
    return success_response(data=service.get_cart_details(current_user), message="Lấy giỏ hàng thành công")

@router.post("/items", status_code=status.HTTP_201_CREATED, summary="Thêm món ăn vào giỏ hàng")
def add_to_cart(
    req: AddToCartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CartService(db)
    data = service.add_to_cart(current_user, req)
    return success_response(data=data, message="Thêm vào giỏ hàng thành công")

@router.put("/items/{item_id}", summary="Cập nhật số lượng / ghi chú của món trong giỏ")
def update_item_quantity(
    item_id: str,
    req: UpdateCartItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CartService(db)
    data = service.update_item_quantity(current_user, item_id, req)
    return success_response(data=data, message="Cập nhật giỏ hàng thành công")

@router.delete("/items/{item_id}", summary="Xóa món khỏi giỏ hàng")
def remove_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CartService(db)
    data = service.remove_item(current_user, item_id)
    return success_response(data=data, message="Xóa món khỏi giỏ hàng thành công")

@router.delete("", summary="Làm trống toàn bộ giỏ hàng")
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CartService(db)
    service.clear_cart(current_user)
    return success_response(message="Làm trống giỏ hàng thành công")

