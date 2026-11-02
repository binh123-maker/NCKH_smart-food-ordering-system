from typing import Optional, List
from datetime import date
from pydantic import BaseModel, Field

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    gender: Optional[str] = Field(default=None, max_length=20)
    date_of_birth: Optional[date] = None

class AddressCreateRequest(BaseModel):
    recipient_name: str = Field(min_length=2, max_length=100)
    recipient_phone: str = Field(min_length=8, max_length=20)
    address_line: str = Field(min_length=5, max_length=255)
    ward: Optional[str] = None
    district: Optional[str] = None
    city: str = Field(default="TP. Hồ Chí Minh")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool = False

class AddressResponse(BaseModel):
    id: str
    recipient_name: str
    recipient_phone: str
    address_line: str
    ward: Optional[str] = None
    district: Optional[str] = None
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool

class PreferenceUpdateRequest(BaseModel):
    preferred_categories: Optional[List[str]] = None
    budget_per_meal: Optional[float] = None
    daily_calorie_target: Optional[int] = None
    preferred_protein_min: Optional[float] = None
    dietary_restrictions: Optional[List[str]] = None
    is_onboarded: bool = True

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6, max_length=100)

