from sqlalchemy.orm import Session
from app.models.user import User
from app.models.food import Food
from app.models.interaction import UserInteraction
from app.core.exceptions import NotFoundException
from app.modules.interactions.schemas import InteractionLogRequest

WEIGHT_MAP = {
    "VIEW": 1.0,
    "CLICK": 1.5,
    "ADD_TO_CART": 3.0,
}

class InteractionService:
    def __init__(self, db: Session):
        self.db = db

    def log_interaction(self, user: User, req: InteractionLogRequest) -> dict:
        food = self.db.query(Food).filter(Food.id == req.food_id).first()
        if not food:
            raise NotFoundException("Món ăn không tồn tại")

        int_type = req.interaction_type.upper()
        weight = WEIGHT_MAP.get(int_type, 1.0)

        record = UserInteraction(
            user_id=user.id,
            food_id=food.id,
            interaction_type=int_type,
            interaction_weight=weight,
            dwell_time_seconds=req.dwell_time_seconds,
            context_data=req.context_data,
        )
        self.db.add(record)
        self.db.commit()

        return {"id": record.id, "food_id": food.id, "type": int_type}

