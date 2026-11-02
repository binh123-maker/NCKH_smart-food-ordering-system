from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.exceptions import NotFoundException, ConflictException
from app.models.food import Food, FoodNutrition, FoodImage, Ingredient, FoodIngredient
from app.models.restaurant import Restaurant
from app.models.category import Category
from app.modules.foods.schemas import FoodCreateRequest, FoodUpdateRequest
from app.modules.restaurants.services import generate_slug

class FoodService:
    def __init__(self, db: Session):
        self.db = db

    def list_foods(
        self,
        search: Optional[str] = None,
        category_id: Optional[str] = None,
        restaurant_id: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        max_calories: Optional[float] = None,
        min_protein: Optional[float] = None,
        is_available: Optional[bool] = True,
        sort_by: str = "popular",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query = self.db.query(Food).join(Food.nutrition, isouter=True)

        if is_available is not None:
            query = query.filter(Food.is_available == is_available)

        if category_id:
            query = query.filter(Food.category_id == category_id)

        if restaurant_id:
            query = query.filter(Food.restaurant_id == restaurant_id)

        if min_price is not None:
            query = query.filter(Food.price >= min_price)
        if max_price is not None:
            query = query.filter(Food.price <= max_price)

        if min_rating is not None:
            query = query.filter(Food.rating_average >= min_rating)

        # Nutrition filtering
        if max_calories is not None:
            query = query.filter(FoodNutrition.calories <= max_calories)
        if min_protein is not None:
            query = query.filter(FoodNutrition.protein >= min_protein)

        # Keyword Search
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                or_(
                    Food.name.ilike(search_fmt),
                    Food.description.ilike(search_fmt),
                )
            )

        # Sorting
        if sort_by == "price_asc":
            query = query.order_by(Food.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Food.price.desc())
        elif sort_by == "rating":
            query = query.order_by(Food.rating_average.desc(), Food.total_reviews.desc())
        elif sort_by == "newest":
            query = query.order_by(Food.created_at.desc())
        else:  # popular
            query = query.order_by(Food.order_count.desc(), Food.view_count.desc(), Food.rating_average.desc())

        total = query.count()
        offset = (page - 1) * limit
        foods = query.offset(offset).limit(limit).all()

        results = [self._format_food_summary(f) for f in foods]
        return results, total

    def get_by_id_or_slug(self, identifier: str) -> dict:
        food = self.db.query(Food).filter(
            or_(Food.id == identifier, Food.slug == identifier)
        ).first()
        if not food:
            raise NotFoundException("Món ăn không tồn tại")

        # Increment view count
        food.view_count += 1
        self.db.commit()

        return self._format_food_detail(food)

    def create_food(self, req: FoodCreateRequest) -> dict:
        slug = req.slug or generate_slug(req.name)
        if self.db.query(Food).filter(Food.slug == slug).first():
            slug = f"{slug}-{self.db.query(Food).count() + 1}"

        food = Food(
            restaurant_id=req.restaurant_id,
            category_id=req.category_id,
            name=req.name,
            slug=slug,
            description=req.description,
            price=req.price,
            original_price=req.original_price,
            is_available=req.is_available,
            preparation_time_minutes=req.preparation_time_minutes,
        )
        self.db.add(food)
        self.db.flush()

        # Nutrition
        if req.nutrition:
            nutr = FoodNutrition(
                food_id=food.id,
                calories=req.nutrition.calories,
                protein=req.nutrition.protein,
                fat=req.nutrition.fat,
                carbohydrates=req.nutrition.carbohydrates,
                fiber=req.nutrition.fiber,
                sodium=req.nutrition.sodium,
            )
            self.db.add(nutr)

        # Images
        if req.image_urls:
            for idx, url in enumerate(req.image_urls):
                img = FoodImage(
                    food_id=food.id,
                    image_url=url,
                    is_primary=(idx == 0),
                    sort_order=idx,
                )
                self.db.add(img)

        # Ingredients
        if req.ingredients:
            for ing_name in req.ingredients:
                ing_clean = ing_name.strip()
                ing = self.db.query(Ingredient).filter(Ingredient.name.ilike(ing_clean)).first()
                if not ing:
                    ing = Ingredient(name=ing_clean)
                    self.db.add(ing)
                    self.db.flush()
                fi = FoodIngredient(food_id=food.id, ingredient_id=ing.id)
                self.db.add(fi)

        self.db.commit()
        return self.get_by_id_or_slug(food.id)

    def update_food(self, food_id: str, req: FoodUpdateRequest) -> dict:
        food = self.db.query(Food).filter(Food.id == food_id).first()
        if not food:
            raise NotFoundException("Món ăn không tồn tại")

        if req.restaurant_id is not None:
            food.restaurant_id = req.restaurant_id
        if req.category_id is not None:
            food.category_id = req.category_id
        if req.name is not None:
            food.name = req.name
        if req.slug is not None:
            food.slug = req.slug
        if req.description is not None:
            food.description = req.description
        if req.price is not None:
            food.price = req.price
        if req.original_price is not None:
            food.original_price = req.original_price
        if req.is_available is not None:
            food.is_available = req.is_available
        if req.preparation_time_minutes is not None:
            food.preparation_time_minutes = req.preparation_time_minutes

        if req.nutrition:
            if food.nutrition:
                food.nutrition.calories = req.nutrition.calories
                food.nutrition.protein = req.nutrition.protein
                food.nutrition.fat = req.nutrition.fat
                food.nutrition.carbohydrates = req.nutrition.carbohydrates
                food.nutrition.fiber = req.nutrition.fiber
                food.nutrition.sodium = req.nutrition.sodium
            else:
                nutr = FoodNutrition(
                    food_id=food.id,
                    calories=req.nutrition.calories,
                    protein=req.nutrition.protein,
                    fat=req.nutrition.fat,
                    carbohydrates=req.nutrition.carbohydrates,
                    fiber=req.nutrition.fiber,
                    sodium=req.nutrition.sodium,
                )
                self.db.add(nutr)

        self.db.commit()
        return self.get_by_id_or_slug(food.id)

    def delete_food(self, food_id: str) -> None:
        food = self.db.query(Food).filter(Food.id == food_id).first()
        if not food:
            raise NotFoundException("Món ăn không tồn tại")
        self.db.delete(food)
        self.db.commit()

    def _format_food_summary(self, f: Food) -> dict:
        primary_image = next((img.image_url for img in f.images if img.is_primary), None)
        if not primary_image and f.images:
            primary_image = f.images[0].image_url

        nutrition = None
        if f.nutrition:
            nutrition = {
                "calories": float(f.nutrition.calories),
                "protein": float(f.nutrition.protein),
                "fat": float(f.nutrition.fat),
                "carbohydrates": float(f.nutrition.carbohydrates),
            }

        return {
            "id": f.id,
            "name": f.name,
            "slug": f.slug,
            "price": float(f.price),
            "original_price": float(f.original_price) if f.original_price else None,
            "is_available": f.is_available,
            "image_url": primary_image,
            "rating_average": float(f.rating_average),
            "total_reviews": f.total_reviews,
            "order_count": f.order_count,
            "restaurant": {
                "id": f.restaurant.id,
                "name": f.restaurant.name,
                "slug": f.restaurant.slug,
            } if f.restaurant else None,
            "category": {
                "id": f.category.id,
                "name": f.category.name,
                "slug": f.category.slug,
            } if f.category else None,
            "nutrition": nutrition,
        }

    def _format_food_detail(self, f: Food) -> dict:
        summary = self._format_food_summary(f)
        summary["description"] = f.description
        summary["preparation_time_minutes"] = f.preparation_time_minutes
        summary["view_count"] = f.view_count
        summary["images"] = [
            {"id": img.id, "image_url": img.image_url, "is_primary": img.is_primary}
            for img in f.images
        ]
        summary["ingredients"] = [
            fi.ingredient.name for fi in f.food_ingredients if fi.ingredient
        ]
        if f.nutrition:
            summary["nutrition"]["fiber"] = float(f.nutrition.fiber)
            summary["nutrition"]["sodium"] = float(f.nutrition.sodium)
        return summary

