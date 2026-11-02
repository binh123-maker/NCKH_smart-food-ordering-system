from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.core.response import success_response
from app.models.user import User
from app.modules.orders.schemas import OrderCreateRequest, OrderStatusUpdateRequest
from app.modules.orders.services import OrderService

router = APIRouter(prefix="/orders", tags=["Order Management"])

@router.post("", status_code=status.HTTP_201_CREATED, summary="Đặt đơn hàng mới (Checkout)")
def create_order(
    req: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrderService(db)
    data = service.create_order(current_user, req)
    return success_response(data=data, message="Đặt hàng thành công")

@router.get("", summary="Lấy danh sách lịch sử đơn hàng của tôi")
def list_my_orders(
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrderService(db)
    items, total = service.list_user_orders(current_user, status=status, page=page, limit=limit)
    return success_response(data=items, message="Lấy danh sách đơn hàng thành công", page=page, limit=limit, total=total)

@router.get("/{order_id}", summary="Lấy chi tiết đơn hàng")
def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrderService(db)
    data = service.get_order_details(order_id, current_user)
    return success_response(data=data, message="Lấy chi tiết đơn hàng thành công")

@router.post("/{order_id}/cancel", summary="Khách hàng hủy đơn (khi đang PENDING)")
def cancel_order(
    order_id: str,
    reason: Optional[str] = Query("Khách hàng yêu cầu hủy đơn"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrderService(db)
    data = service.cancel_order(current_user, order_id, reason)
    return success_response(data=data, message="Hủy đơn hàng thành công")

@router.put("/{order_id}/status", summary="Cập nhật trạng thái đơn hàng (Admin / Staff)")
def update_order_status(
    order_id: str,
    req: OrderStatusUpdateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
    db: Session = Depends(get_db),
):
    service = OrderService(db)
    data = service.update_order_status(order_id, req)
    return success_response(data=data, message="Cập nhật trạng thái đơn hàng thành công")

