from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.exceptions import NotFoundException, AppException
from app.models.user import User
from app.models.order import Order
from app.models.food import Food
from app.models.restaurant import Restaurant
from app.models.interaction import UserInteraction
from app.models.recommendation import ModelVersion, RecommendationLog

class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_kpis(self) -> dict:
        total_revenue = self.db.query(func.sum(Order.total_amount)).filter(
            Order.status == "COMPLETED"
        ).scalar() or 0.0

        total_orders = self.db.query(Order).count()
        completed_orders = self.db.query(Order).filter(Order.status == "COMPLETED").count()
        cancelled_orders = self.db.query(Order).filter(Order.status == "CANCELLED").count()
        total_customers = self.db.query(User).filter(User.role == "CUSTOMER").count()
        total_foods = self.db.query(Food).count()
        total_restaurants = self.db.query(Restaurant).count()
        total_interactions = self.db.query(UserInteraction).count()

        # Order status distribution
        status_counts = dict(
            self.db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
        )

        return {
            "total_revenue": float(total_revenue),
            "total_orders": total_orders,
            "completed_orders": completed_orders,
            "cancelled_orders": cancelled_orders,
            "total_customers": total_customers,
            "total_foods": total_foods,
            "total_restaurants": total_restaurants,
            "total_interactions_logged": total_interactions,
            "order_status_distribution": status_counts,
        }

    def list_users(
        self, role: Optional[str] = None, page: int = 1, limit: int = 20
    ) -> Tuple[List[dict], int]:
        query = self.db.query(User)
        if role:
            query = query.filter(User.role == role.upper())

        query = query.order_by(User.created_at.desc())
        total = query.count()
        offset = (page - 1) * limit
        users = query.offset(offset).limit(limit).all()

        results = [
            {
                "id": u.id,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "is_active": u.is_active,
                "full_name": u.profile.full_name if u.profile else None,
                "created_at": u.created_at,
            }
            for u in users
        ]
        return results, total

    def toggle_user_active(self, user_id: str, admin_user: User) -> dict:
        if user_id == admin_user.id:
            raise AppException("Bạn không thể tự khóa tài khoản của chính mình")

        target_user = self.db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise NotFoundException("Người dùng không tồn tại")

        target_user.is_active = not target_user.is_active
        self.db.commit()
        return {"id": target_user.id, "email": target_user.email, "is_active": target_user.is_active}

    def list_all_orders(
        self, status: Optional[str] = None, page: int = 1, limit: int = 20
    ) -> Tuple[List[dict], int]:
        query = self.db.query(Order)
        if status:
            query = query.filter(Order.status == status.upper())

        query = query.order_by(Order.created_at.desc())
        total = query.count()
        offset = (page - 1) * limit
        orders = query.offset(offset).limit(limit).all()

        results = [
            {
                "id": o.id,
                "order_code": o.order_code,
                "user_name": o.user.profile.full_name if o.user and o.user.profile else o.user.email,
                "user_phone": o.user.phone if o.user else None,
                "restaurant_name": o.restaurant.name if o.restaurant else None,
                "total_amount": float(o.total_amount),
                "status": o.status,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "created_at": o.created_at,
            }
            for o in orders
        ]
        return results, total

    def get_recsys_status(self) -> dict:
        active_model = self.db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
        total_interactions = self.db.query(UserInteraction).count()
        total_recommendations = self.db.query(RecommendationLog).count()

        model_info = None
        if active_model:
            model_info = {
                "version_code": active_model.version_code,
                "algorithm_type": active_model.algorithm_type,
                "precision_at_k": float(active_model.precision_at_k),
                "recall_at_k": float(active_model.recall_at_k),
                "f1_at_k": float(active_model.f1_at_k),
                "ndcg_at_k": float(active_model.ndcg_at_k),
                "map_at_k": float(active_model.map_at_k),
                "coverage_rate": float(active_model.coverage_rate),
                "trained_at": active_model.trained_at,
            }

        return {
            "active_model": model_info,
            "total_interactions_collected": total_interactions,
            "total_serving_logs": total_recommendations,
            "pipeline_status": "ONLINE_ACTIVE_SERVING",
        }

