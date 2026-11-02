from typing import List, Tuple
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.user import User
from app.models.review import Favorite
from app.models.food import Food
from app.models.interaction import UserInteraction

class FavoriteService:
    def __init__(self, db: Session):
        self.db = db

    def toggle_favorite(self, user: User, food_id: str) -> dict:
        food = self.db.query(Food).filter(Food.id == food_id).first()
        if not food:
            raise NotFoundException("Món ăn không tồn tại")

        fav = self.db.query(Favorite).filter(
            Favorite.user_id == user.id, Favorite.food_id == food.id
        ).first()

        if fav:
            self.db.delete(fav)
            self.db.commit()
            return {"is_favorite": False, "food_id": food.id}
        else:
            new_fav = Favorite(user_id=user.id, food_id=food.id)
            self.db.add(new_fav)
            
            # RecSys interaction signal
            interaction = UserInteraction(
                user_id=user.id,
                food_id=food.id,
                interaction_type="FAVORITE",
                interaction_weight=3.50,
            )
            self.db.add(interaction)
            self.db.commit()
            return {"is_favorite": True, "food_id": food.id}

    def list_favorites(self, user: User, page: int = 1, limit: int = 20) -> Tuple[List[dict], int]:
        query = self.db.query(Favorite).filter(Favorite.user_id == user.id).order_by(Favorite.created_at.desc())
        total = query.count()
        offset = (page - 1) * limit
        favs = query.offset(offset).limit(limit).all()

        results = []
        for f in favs:
            food = f.food
            primary_img = food.images[0].image_url if food and food.images else None
            results.append({
                "id": f.id,
                "food_id": food.id,
                "food_name": food.name,
                "slug": food.slug,
                "price": float(food.price),
                "rating_average": float(food.rating_average),
                "restaurant_name": food.restaurant.name if food.restaurant else None,
                "image_url": primary_img,
                "created_at": f.created_at,
            })
        return results, total

