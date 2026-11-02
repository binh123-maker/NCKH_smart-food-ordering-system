from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.response import success_response
from app.models.user import User
from app.modules.auth.schemas import RegisterRequest, LoginRequest, RefreshTokenRequest
from app.modules.auth.services import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Đăng ký tài khoản mới")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    token_response = service.register(req)
    return success_response(data=token_response.model_dump(), message="Đăng ký tài khoản thành công")

@router.post("/login", summary="Đăng nhập hệ thống")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    token_response = service.login(req)
    return success_response(data=token_response.model_dump(), message="Đăng nhập thành công")

@router.post("/refresh", summary="Cấp mới Access Token bằng Refresh Token")
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    token_response = service.refresh_access_token(req.refresh_token)
    return success_response(data=token_response.model_dump(), message="Cấp mới token thành công")

@router.get("/me", summary="Lấy thông tin tài khoản hiện tại")
def get_me(current_user: User = Depends(get_current_user)):
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "full_name": current_user.profile.full_name if current_user.profile else None,
        "avatar_url": current_user.profile.avatar_url if current_user.profile else None,
        "is_onboarded": current_user.preferences.is_onboarded if current_user.preferences else False,
    }
    return success_response(data=user_data, message="Lấy thông tin thành công")

