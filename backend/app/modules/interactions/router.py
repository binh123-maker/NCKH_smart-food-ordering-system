from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.response import success_response
from app.models.user import User
from app.modules.interactions.schemas import InteractionLogRequest
from app.modules.interactions.services import InteractionService

router = APIRouter(prefix="/interactions", tags=["Interaction Tracking"])

@router.post("", status_code=status.HTTP_201_CREATED, summary="Ghi nhận sự kiện tương tác người dùng (View, Click, Dwell)")
def log_interaction(
    req: InteractionLogRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InteractionService(db)
    data = service.log_interaction(current_user, req)
    return success_response(data=data, message="Ghi nhận tương tác thành công")

