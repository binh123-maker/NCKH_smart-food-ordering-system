from typing import Any, Optional, Dict
from pydantic import BaseModel

class MetaResponse(BaseModel):
    page: Optional[int] = None
    limit: Optional[int] = None
    total: Optional[int] = None
    total_pages: Optional[int] = None

class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = "Thao tác thành công"
    error: Optional[Dict[str, Any]] = None
    meta: Optional[MetaResponse] = None

def success_response(
    data: Any = None,
    message: str = "Thao tác thành công",
    page: Optional[int] = None,
    limit: Optional[int] = None,
    total: Optional[int] = None,
) -> dict:
    meta = None
    if page is not None and limit is not None and total is not None:
        total_pages = (total + limit - 1) // limit if limit > 0 else 1
        meta = {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        }
    return {
        "success": True,
        "data": data,
        "message": message,
        "error": None,
        "meta": meta,
    }

def error_response(code: str, message: str, details: Any = None) -> dict:
    return {
        "success": False,
        "data": None,
        "message": message,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
        "meta": None,
    }

