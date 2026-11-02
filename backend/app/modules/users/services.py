from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.security import verify_password, hash_password
from app.core.exceptions import NotFoundException, BadRequestException, AppException, UnauthorizedException
from app.models.user import User, UserProfile, UserAddress, UserPreference
from app.modules.users.schemas import UpdateProfileRequest, AddressCreateRequest, PreferenceUpdateRequest, ChangePasswordRequest

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_profile(self, user: User) -> dict:
        profile = user.profile
        return {
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "full_name": profile.full_name if profile else None,
            "avatar_url": profile.avatar_url if profile else None,
            "gender": profile.gender if profile else None,
            "date_of_birth": str(profile.date_of_birth) if profile and profile.date_of_birth else None,
        }

    def update_profile(self, user: User, req: UpdateProfileRequest) -> dict:
        if req.phone and req.phone != user.phone:
            existing_phone = self.db.query(User).filter(User.phone == req.phone, User.id != user.id).first()
            if existing_phone:
                raise AppException("Số điện thoại này đã được sử dụng bởi tài khoản khác", code="PHONE_EXISTS")
            user.phone = req.phone

        profile = user.profile
        if not profile:
            profile = UserProfile(user_id=user.id, full_name=req.full_name or user.email)
            self.db.add(profile)

        if req.full_name is not None:
            profile.full_name = req.full_name
        if req.avatar_url is not None:
            profile.avatar_url = req.avatar_url
        if req.gender is not None:
            profile.gender = req.gender
        if req.date_of_birth is not None:
            profile.date_of_birth = req.date_of_birth

        self.db.commit()
        return self.get_profile(user)

    def change_password(self, user: User, req: ChangePasswordRequest) -> None:
        if not verify_password(req.old_password, user.password_hash):
            raise UnauthorizedException("Mật khẩu hiện tại không chính xác")
        user.password_hash = hash_password(req.new_password)
        self.db.commit()

    def get_addresses(self, user: User) -> List[dict]:
        addresses = self.db.query(UserAddress).filter(UserAddress.user_id == user.id).all()
        return [
            {
                "id": a.id,
                "recipient_name": a.recipient_name,
                "recipient_phone": a.recipient_phone,
                "address_line": a.address_line,
                "ward": a.ward,
                "district": a.district,
                "city": a.city,
                "latitude": float(a.latitude) if a.latitude else None,
                "longitude": float(a.longitude) if a.longitude else None,
                "is_default": a.is_default,
            }
            for a in addresses
        ]

    def add_address(self, user: User, req: AddressCreateRequest) -> dict:
        existing_count = self.db.query(UserAddress).filter(UserAddress.user_id == user.id).count()
        is_default = req.is_default or existing_count == 0

        if is_default:
            self.db.query(UserAddress).filter(UserAddress.user_id == user.id).update({"is_default": False})

        addr = UserAddress(
            user_id=user.id,
            recipient_name=req.recipient_name,
            recipient_phone=req.recipient_phone,
            address_line=req.address_line,
            ward=req.ward,
            district=req.district,
            city=req.city,
            latitude=req.latitude,
            longitude=req.longitude,
            is_default=is_default,
        )
        self.db.add(addr)
        self.db.commit()
        self.db.refresh(addr)
        return {
            "id": addr.id,
            "recipient_name": addr.recipient_name,
            "recipient_phone": addr.recipient_phone,
            "address_line": addr.address_line,
            "ward": addr.ward,
            "district": addr.district,
            "city": addr.city,
            "latitude": float(addr.latitude) if addr.latitude else None,
            "longitude": float(addr.longitude) if addr.longitude else None,
            "is_default": addr.is_default,
        }

    def set_default_address(self, user: User, address_id: str) -> None:
        addr = self.db.query(UserAddress).filter(
            UserAddress.id == address_id, UserAddress.user_id == user.id
        ).first()
        if not addr:
            raise NotFoundException("Địa chỉ không tồn tại")

        self.db.query(UserAddress).filter(UserAddress.user_id == user.id).update({"is_default": False})
        addr.is_default = True
        self.db.commit()

    def delete_address(self, user: User, address_id: str) -> None:
        addr = self.db.query(UserAddress).filter(
            UserAddress.id == address_id, UserAddress.user_id == user.id
        ).first()
        if not addr:
            raise NotFoundException("Địa chỉ không tồn tại")
        
        was_default = addr.is_default
        self.db.delete(addr)
        self.db.flush()

        if was_default:
            first_remain = self.db.query(UserAddress).filter(UserAddress.user_id == user.id).first()
            if first_remain:
                first_remain.is_default = True

        self.db.commit()

    def get_preferences(self, user: User) -> dict:
        pref = user.preferences
        if not pref:
            pref = UserPreference(user_id=user.id, is_onboarded=False)
            self.db.add(pref)
            self.db.commit()
            self.db.refresh(pref)

        return {
            "preferred_categories": pref.preferred_categories or [],
            "budget_per_meal": float(pref.budget_per_meal) if pref.budget_per_meal else None,
            "daily_calorie_target": pref.daily_calorie_target,
            "preferred_protein_min": float(pref.preferred_protein_min) if pref.preferred_protein_min else None,
            "dietary_restrictions": pref.dietary_restrictions or [],
            "is_onboarded": pref.is_onboarded,
        }

    def update_preferences(self, user: User, req: PreferenceUpdateRequest) -> dict:
        pref = user.preferences
        if not pref:
            pref = UserPreference(user_id=user.id)
            self.db.add(pref)

        if req.preferred_categories is not None:
            pref.preferred_categories = req.preferred_categories
        if req.budget_per_meal is not None:
            pref.budget_per_meal = req.budget_per_meal
        if req.daily_calorie_target is not None:
            pref.daily_calorie_target = req.daily_calorie_target
        if req.preferred_protein_min is not None:
            pref.preferred_protein_min = req.preferred_protein_min
        if req.dietary_restrictions is not None:
            pref.dietary_restrictions = req.dietary_restrictions
        pref.is_onboarded = req.is_onboarded

        self.db.commit()
        return self.get_preferences(user)

