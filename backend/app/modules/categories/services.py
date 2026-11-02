from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.exceptions import NotFoundException, ConflictException
from app.models.category import Category
from app.modules.categories.schemas import CategoryCreateRequest, CategoryUpdateRequest
from app.modules.restaurants.services import generate_slug

class CategoryService:
    def __init__(self, db: Session):
        self.db = db

    def list_categories(self) -> List[Category]:
        return self.db.query(Category).order_by(Category.sort_order.asc(), Category.name.asc()).all()

    def get_by_id_or_slug(self, identifier: str) -> Category:
        cat = self.db.query(Category).filter(
            or_(Category.id == identifier, Category.slug == identifier)
        ).first()
        if not cat:
            raise NotFoundException("Danh mục không tồn tại")
        return cat

    def create_category(self, req: CategoryCreateRequest) -> Category:
        slug = req.slug or generate_slug(req.name)
        if self.db.query(Category).filter(or_(Category.slug == slug, Category.name == req.name)).first():
            raise ConflictException("Tên hoặc đường dẫn danh mục đã tồn tại")

        cat = Category(
            name=req.name,
            slug=slug,
            description=req.description,
            icon_url=req.icon_url,
            sort_order=req.sort_order,
        )
        self.db.add(cat)
        self.db.commit()
        self.db.refresh(cat)
        return cat

    def update_category(self, category_id: str, req: CategoryUpdateRequest) -> Category:
        cat = self.get_by_id_or_slug(category_id)
        if req.name is not None:
            cat.name = req.name
        if req.slug is not None:
            if self.db.query(Category).filter(Category.slug == req.slug, Category.id != cat.id).first():
                raise ConflictException("Đường dẫn slug danh mục đã tồn tại")
            cat.slug = req.slug
        if req.description is not None:
            cat.description = req.description
        if req.icon_url is not None:
            cat.icon_url = req.icon_url
        if req.sort_order is not None:
            cat.sort_order = req.sort_order

        self.db.commit()
        self.db.refresh(cat)
        return cat

    def delete_category(self, category_id: str) -> None:
        cat = self.get_by_id_or_slug(category_id)
        self.db.delete(cat)
        self.db.commit()

