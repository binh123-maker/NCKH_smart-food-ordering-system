from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.exceptions import NotFoundException, AppException, ConflictException
from app.models.user import User
from app.models.review import Review
from app.models.order import Order, OrderItem
from app.models.food import Food
from app.models.interaction import UserInteraction
from app.modules.reviews.schemas import ReviewCreateRequest

class ReviewService:
    def __init__(self, db: Session):
        self.db = db

    def create_review(self, user: User, req: ReviewCreateRequest) -> dict:
        # Check order existence and ownership
        order = self.db.query(Order).filter(Order.id == req.order_id, Order.user_id == user.id).first()
        if not order:
            raise NotFoundException("Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn")

        if order.status != "COMPLETED":
            raise AppException("Bạn chỉ có thể đánh giá món ăn sau khi đơn hàng đã hoàn tất giao hàng")

        # Verify that food was actually in this order
        item_in_order = self.db.query(OrderItem).filter(
            OrderItem.order_id == order.id, OrderItem.food_id == req.food_id
        ).first()
        if not item_in_order:
            raise AppException("Món ăn này không nằm trong đơn hàng đã chọn")

        # Check for duplicate review
        existing = self.db.query(Review).filter(
            Review.user_id == user.id, Review.food_id == req.food_id, Review.order_id == order.id
        ).first()
        if existing:
            raise ConflictException("Bạn đã đánh giá món ăn này cho đơn hàng này rồi")

        food = self.db.query(Food).filter(Food.id == req.food_id).first()
        if not food:
            raise NotFoundException("Món ăn không tồn tại")

        review = Review(
            user_id=user.id,
            food_id=req.food_id,
            order_id=order.id,
            rating=req.rating,
            comment=req.comment,
            is_visible=True,
        )
        self.db.add(review)
        self.db.flush()

        # Recalculate average rating & total reviews for food
        stats = self.db.query(
            func.avg(Review.rating), func.count(Review.id)
        ).filter(Review.food_id == food.id, Review.is_visible == True).first()

        avg_rating = round(float(stats[0]), 2) if stats and stats[0] is not None else req.rating
        total_revs = stats[1] if stats else 1

        food.rating_average = avg_rating
        food.total_reviews = total_revs

        # Explicit RecSys Interaction (weight=4.0 for REVIEW)
        interaction = UserInteraction(
            user_id=user.id,
            food_id=food.id,
            interaction_type="REVIEW",
            interaction_weight=float(req.rating),
        )
        self.db.add(interaction)

        self.db.commit()
        return {
            "id": review.id,
            "food_id": food.id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
        }

    def list_food_reviews(self, food_id: str, page: int = 1, limit: int = 20) -> Tuple[List[dict], int]:
        query = self.db.query(Review).filter(
            Review.food_id == food_id, Review.is_visible == True
        ).order_by(Review.created_at.desc())

        total = query.count()
        offset = (page - 1) * limit
        reviews = query.offset(offset).limit(limit).all()

        results = [
            {
                "id": r.id,
                "food_id": r.food_id,
                "user_id": r.user_id,
                "user_name": r.user.profile.full_name if r.user and r.user.profile else "Người dùng ẩn danh",
                "user_avatar": r.user.profile.avatar_url if r.user and r.user.profile else None,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at,
            }
            for r in reviews
        ]
        return results, total

