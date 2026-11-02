from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class OrderCreateRequest(BaseModel):
    address_id: str
    payment_method: str = Field(default="COD", description="COD, VNPAY, MOMO")
    delivery_notes: Optional[str] = None

class OrderStatusUpdateRequest(BaseModel):
    status: str = Field(description="CONFIRMED, PREPARING, DELIVERING, COMPLETED, CANCELLED")
    cancellation_reason: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: str
    food_id: str
    food_name: str
    unit_price: float
    quantity: int
    subtotal: float
    notes: Optional[str] = None

class OrderSummaryResponse(BaseModel):
    id: str
    order_code: str
    restaurant_name: str
    total_amount: float
    status: str
    payment_method: str
    payment_status: str
    created_at: datetime
    total_items: int

class OrderDetailResponse(BaseModel):
    id: str
    order_code: str
    user_id: str
    restaurant_id: str
    restaurant_name: str
    status: str
    subtotal: float
    delivery_fee: float
    discount_amount: float
    total_amount: float
    payment_method: str
    payment_status: str
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse]

