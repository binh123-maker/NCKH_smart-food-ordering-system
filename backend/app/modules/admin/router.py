from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.core.response import success_response
from app.models.user import User
from app.modules.admin.services import AdminService

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/dashboard", summary="Dashboard KPI tổng quan (Admin only)")
def get_dashboard_kpis(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    return success_response(data=service.get_dashboard_kpis(), message="Lấy chỉ số KPI thành công")

@router.get("/users", summary="Danh sách người dùng hệ thống (Admin only)")
def list_users(
    role: Optional[str] = Query(None, description="Lọc theo vai trò: CUSTOMER, ADMIN, STAFF"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    items, total = service.list_users(role=role, page=page, limit=limit)
    return success_response(data=items, message="Lấy danh sách người dùng thành công", page=page, limit=limit, total=total)

@router.put("/users/{user_id}/toggle-status", summary="Khóa / Mở khóa tài khoản người dùng (Admin only)")
def toggle_user_status(
    user_id: str,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    data = service.toggle_user_active(user_id, current_user)
    msg = "Mở khóa tài khoản thành công" if data["is_active"] else "Khóa tài khoản thành công"
    return success_response(data=data, message=msg)

@router.get("/orders", summary="Quản lý toàn bộ đơn hàng (Admin / Staff)")
def list_all_orders(
    status: Optional[str] = Query(None, description="Lọc trạng thái"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    items, total = service.list_all_orders(status=status, page=page, limit=limit)
    return success_response(data=items, message="Lấy danh sách đơn hàng thành công", page=page, limit=limit, total=total)

@router.get("/recsys-metrics", summary="Giám sát hiệu năng và mô hình RecSys (Admin only)")
def get_recsys_metrics(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    service = AdminService(db)
    return success_response(data=service.get_recsys_status(), message="Lấy trạng thái RecSys thành công")

