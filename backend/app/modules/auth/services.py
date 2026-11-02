from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import AppException, ConflictException, UnauthorizedException, NotFoundException
from app.models.user import User, UserProfile, UserPreference, RefreshToken
from app.models.cart import Cart
from app.modules.auth.schemas import RegisterRequest, LoginRequest, TokenResponse

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, req: RegisterRequest) -> TokenResponse:
        # Check duplicate email
        if self.db.query(User).filter(User.email == req.email).first():
            raise ConflictException("Email này đã được sử dụng. Vui lòng chọn email khác")
        
        # Check duplicate phone if provided
        if req.phone and self.db.query(User).filter(User.phone == req.phone).first():
            raise ConflictException("Số điện thoại này đã được sử dụng")

        user = User(
            email=req.email,
            password_hash=hash_password(req.password),
            phone=req.phone,
            role=req.role or "CUSTOMER",
            is_active=True,
        )
        self.db.add(user)
        self.db.flush()

        # Initialize profile
        profile = UserProfile(
            user_id=user.id,
            full_name=req.full_name,
        )
        # Initialize default preference for RecSys
        preference = UserPreference(
            user_id=user.id,
            is_onboarded=False,
        )
        # Initialize active cart
        cart = Cart(user_id=user.id)

        self.db.add_all([profile, preference, cart])
        self.db.flush()

        return self._issue_tokens(user, profile.full_name)

    def login(self, req: LoginRequest) -> TokenResponse:
        user = self.db.query(User).filter(User.email == req.email).first()
        if not user or not verify_password(req.password, user.password_hash):
            raise UnauthorizedException("Email hoặc mật khẩu không chính xác")
        if not user.is_active:
            raise UnauthorizedException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ")

        full_name = user.profile.full_name if user.profile else user.email
        return self._issue_tokens(user, full_name)

    def refresh_access_token(self, refresh_token_str: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token_str)
            if payload.get("type") != "refresh":
                raise UnauthorizedException("Token không đúng định dạng Refresh Token")
            user_id = payload.get("sub")
        except jwt.PyJWTError:
            raise UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn")

        token_record = self.db.query(RefreshToken).filter(
            RefreshToken.token_hash == refresh_token_str,
            RefreshToken.is_revoked == False,
        ).first()

        if not token_record or token_record.expires_at < datetime.now(timezone.utc):
            raise UnauthorizedException("Refresh token đã hết hạn hoặc đã bị thu hồi")

        user = self.db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            raise UnauthorizedException("Người dùng không tồn tại")

        # Revoke old refresh token (Rotation)
        token_record.is_revoked = True
        self.db.flush()

        full_name = user.profile.full_name if user.profile else user.email
        return self._issue_tokens(user, full_name)

    def _issue_tokens(self, user: User, full_name: str) -> TokenResponse:
        token_data = {"sub": user.id, "email": user.email, "role": user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Store refresh token record
        rt = RefreshToken(
            user_id=user.id,
            token_hash=refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            is_revoked=False,
        )
        self.db.add(rt)
        self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=user.id,
            email=user.email,
            role=user.role,
            full_name=full_name,
        )

