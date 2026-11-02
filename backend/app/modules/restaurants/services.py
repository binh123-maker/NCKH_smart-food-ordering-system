import re
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.exceptions import NotFoundException, ConflictException
from app.models.restaurant import Restaurant
from app.modules.restaurants.schemas import RestaurantCreateRequest, RestaurantUpdateRequest

def generate_slug(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text

class RestaurantService:
    def __init__(self, db: Session):
        self.db = db

    def list_restaurants(
        self,
        search: Optional[str] = None,
        is_active: Optional[bool] = True,
        sort_by: str = "rating",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Restaurant], int]:
        query = self.db.query(Restaurant)
        
        if is_active is not None:
            query = query.filter(Restaurant.is_active == is_active)

        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                or_(
                    Restaurant.name.ilike(search_fmt),
                    Restaurant.address.ilike(search_fmt),
                    Restaurant.description.ilike(search_fmt),
                )
            )

        if sort_by == "rating":
            query = query.order_by(Restaurant.rating_average.desc(), Restaurant.total_reviews.desc())
        elif sort_by == "name":
            query = query.order_by(Restaurant.name.asc())
        elif sort_by == "created_at":
            query = query.order_by(Restaurant.created_at.desc())

        total = query.count()
        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()
        return items, total

    def get_by_id_or_slug(self, identifier: str) -> Restaurant:
        restaurant = self.db.query(Restaurant).filter(
            or_(Restaurant.id == identifier, Restaurant.slug == identifier)
        ).first()
        if not restaurant:
            raise NotFoundException("Nhà hàng không tồn tại")
        return restaurant

    def create_restaurant(self, req: RestaurantCreateRequest) -> Restaurant:
        slug = req.slug or generate_slug(req.name)
        if self.db.query(Restaurant).filter(Restaurant.slug == slug).first():
            slug = f"{slug}-{self.db.query(Restaurant).count() + 1}"

        restaurant = Restaurant(
            name=req.name,
            slug=slug,
            description=req.description,
            address=req.address,
            phone=req.phone,
            email=req.email,
            opening_hours=req.opening_hours,
            is_active=req.is_active,
        )
        self.db.add(restaurant)
        self.db.commit()
        self.db.refresh(restaurant)
        return restaurant

    def update_restaurant(self, restaurant_id: str, req: RestaurantUpdateRequest) -> Restaurant:
        restaurant = self.get_by_id_or_slug(restaurant_id)
        if req.name is not None:
            restaurant.name = req.name
        if req.slug is not None:
            if self.db.query(Restaurant).filter(Restaurant.slug == req.slug, Restaurant.id != restaurant.id).first():
                raise ConflictException("Slug này đã tồn tại")
            restaurant.slug = req.slug
        if req.description is not None:
            restaurant.description = req.description
        if req.address is not None:
            restaurant.address = req.address
        if req.phone is not None:
            restaurant.phone = req.phone
        if req.email is not None:
            restaurant.email = req.email
        if req.opening_hours is not None:
            restaurant.opening_hours = req.opening_hours
        if req.is_active is not None:
            restaurant.is_active = req.is_active

        self.db.commit()
        self.db.refresh(restaurant)
        return restaurant

    def delete_restaurant(self, restaurant_id: str) -> None:
        restaurant = self.get_by_id_or_slug(restaurant_id)
        self.db.delete(restaurant)
        self.db.commit()

