from typing import Optional
from pydantic import BaseModel, Field

class CategoryCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    sort_order: int = 0

class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    sort_order: Optional[int] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    sort_order: int

