from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.response import success_response
from app.models.user import User
from app.modules.users.schemas import UpdateProfileRequest, AddressCreateRequest, PreferenceUpdateRequest, ChangePasswordRequest
from app.modules.users.services import UserService

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("/profile", summary="Lấy hồ sơ cá nhân")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = UserService(db)
    return success_response(data=service.get_profile(current_user), message="Lấy hồ sơ thành công")

@router.put("/profile", summary="Cập nhật hồ sơ cá nhân")
def update_profile(req: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = UserService(db)
    return success_response(data=service.update_profile(current_user, req), message="Cập nhật hồ sơ thành công")

@router.post("/change-password", summary="Đổi mật khẩu")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = UserService(db)
    service.change_password(current_user, req)
    return success_response(message="Đổi mật khẩu thành công")

@router.get("/addresses", summary="Danh sách địa chỉ giao hàng")
def get_addresses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = UserService(db)
    return success_response(data=service.get_addresses(current_user), message="Lấy danh sách địa chỉ thành công")

@router.post("/addresses", status_code=status.HTTP_201_CREATED, summary="Thêm địa chỉ giao hàng mới")
def add_address(req: AddressCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = UserService(db)
    return success_response(data=service.add_address(current_user, req), message="Thêm địa chỉ thành công")

@router.put("/addresses/{address_id}/default", summary="Đặt địa chỉ mặc định")
def set_default_address(address_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = UserService(db)
    service.set_default_address(current_user, address_id)
    return success_response(message="Đặt địa chỉ mặc định thành công")

@router.delete("/addresses/{address_id}", summary="Xóa địa chỉ giao hàng")
def delete_address(address_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = UserService(db)
    service.delete_address(current_user, address_id)
    return success_response(message="Xóa địa chỉ thành công")

@router.get("/preferences", summary="Lấy sở thích ẩm thực & mục tiêu dinh dưỡng RecSys")
def get_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = UserService(db)
    return success_response(data=service.get_preferences(current_user), message="Lấy sở thích thành công")

@router.put("/preferences", summary="Cập nhật khảo sát Onboarding & mục tiêu dinh dưỡng")
def update_preferences(req: PreferenceUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = UserService(db)
    return success_response(data=service.update_preferences(current_user, req), message="Cập nhật sở thích thành công")

