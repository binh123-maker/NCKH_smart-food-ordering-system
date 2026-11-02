from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.core.response import success_response
from app.models.user import User
from app.modules.categories.schemas import CategoryCreateRequest, CategoryUpdateRequest
from app.modules.categories.services import CategoryService

router = APIRouter(prefix="/categories", tags=["Category Management"])

@router.get("", summary="Lấy danh sách danh mục món ăn (Public)")
def list_categories(db: Session = Depends(get_db)):
    service = CategoryService(db)
    items = service.list_categories()
    data = [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "description": c.description,
            "icon_url": c.icon_url,
            "sort_order": c.sort_order,
        }
        for c in items
    ]
    return success_response(data=data, message="Lấy danh mục thành công")

@router.get("/{id_or_slug}", summary="Lấy chi tiết danh mục theo ID hoặc Slug")
def get_category(id_or_slug: str, db: Session = Depends(get_db)):
    service = CategoryService(db)
    c = service.get_by_id_or_slug(id_or_slug)
    data = {
        "id": c.id,
        "name": c.name,
        "slug": c.slug,
        "description": c.description,
        "icon_url": c.icon_url,
        "sort_order": c.sort_order,
    }
    return success_response(data=data, message="Lấy chi tiết danh mục thành công")

@router.post("", status_code=status.HTTP_201_CREATED, summary="Tạo mới danh mục (Admin / Staff)")
def create_category(
    req: CategoryCreateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
    db: Session = Depends(get_db),
):
    service = CategoryService(db)
    c = service.create_category(req)
    return success_response(data={"id": c.id, "name": c.name, "slug": c.slug}, message="Tạo danh mục thành công")

@router.put("/{category_id}", summary="Cập nhật danh mục (Admin / Staff)")
def update_category(
    category_id: str,
    req: CategoryUpdateRequest,
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
    db: Session = Depends(get_db),
):
    service = CategoryService(db)
    c = service.update_category(category_id, req)
    return success_response(data={"id": c.id, "name": c.name, "slug": c.slug}, message="Cập nhật danh mục thành công")

@router.delete("/{category_id}", summary="Xóa danh mục (Admin only)")
def delete_category(
    category_id: str,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    service = CategoryService(db)
    service.delete_category(category_id)
    return success_response(message="Xóa danh mục thành công")

