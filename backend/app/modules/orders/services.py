import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, AppException, ForbiddenException
from app.models.user import User, UserAddress
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.food import Food
from app.models.interaction import UserInteraction
from app.modules.orders.schemas import OrderCreateRequest, OrderStatusUpdateRequest

VALID_TRANSITIONS = {
    "PENDING": ["CONFIRMED", "CANCELLED"],
    "CONFIRMED": ["PREPARING", "CANCELLED"],
    "PREPARING": ["DELIVERING", "CANCELLED"],
    "DELIVERING": ["COMPLETED"],
    "COMPLETED": [],
    "CANCELLED": [],
}

class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def create_order(self, user: User, req: OrderCreateRequest) -> dict:
        cart = self.db.query(Cart).filter(Cart.user_id == user.id).first()
        if not cart or not cart.items:
            raise AppException("Giỏ hàng của bạn đang trống")

        address = self.db.query(UserAddress).filter(
            UserAddress.id == req.address_id, UserAddress.user_id == user.id
        ).first()
        if not address:
            raise NotFoundException("Địa chỉ giao hàng không hợp lệ")

        # Snapshot address text
        address_text = f"{address.recipient_name} ({address.recipient_phone}) - {address.address_line}, {address.ward or ''}, {address.district or ''}, {address.city}"

        # Calculate totals & check items availability
        subtotal = 0.0
        order_items_to_create = []

        for item in cart.items:
            f = item.food
            if not f or not f.is_available:
                raise AppException(f"Món ăn '{f.name if f else 'N/A'}' hiện không còn phục vụ")
            
            item_price = float(f.price)
            item_total = item_price * item.quantity
            subtotal += item_total

            order_items_to_create.append(
                OrderItem(
                    food_id=f.id,
                    food_name_snapshot=f.name,
                    unit_price_snapshot=item_price,
                    quantity=item.quantity,
                    subtotal=item_total,
                    notes=item.notes,
                )
            )

        delivery_fee = 15000.0  # Standard flat delivery fee
        discount_amount = 0.0
        total_amount = subtotal + delivery_fee - discount_amount

        # Generate unique order code
        timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
        random_suffix = uuid.uuid4().hex[:4].upper()
        order_code = f"ORD-{timestamp_str}-{random_suffix}"

        order = Order(
            order_code=order_code,
            user_id=user.id,
            restaurant_id=cart.restaurant_id,
            address_id=address.id,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            discount_amount=discount_amount,
            total_amount=total_amount,
            status="PENDING",
            payment_method=req.payment_method.upper(),
            payment_status="UNPAID",
            delivery_address_snapshot=address_text,
            delivery_notes=req.delivery_notes,
        )
        self.db.add(order)
        self.db.flush()

        for oi in order_items_to_create:
            oi.order_id = order.id
            self.db.add(oi)

            # Update food order_count
            f_rec = self.db.query(Food).filter(Food.id == oi.food_id).first()
            if f_rec:
                f_rec.order_count += oi.quantity

            # Implicit RecSys Interaction Log (weight=5.0 for ORDER)
            interaction = UserInteraction(
                user_id=user.id,
                food_id=oi.food_id,
                interaction_type="ORDER",
                interaction_weight=5.00,
            )
            self.db.add(interaction)

        # Create Initial Payment Record
        payment = Payment(
            order_id=order.id,
            payment_method=req.payment_method.upper(),
            amount=total_amount,
            status="PENDING",
        )
        self.db.add(payment)

        # Clear cart
        self.db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        cart.restaurant_id = None

        self.db.commit()
        return self.get_order_details(order.id)

    def list_user_orders(
        self, user: User, status: Optional[str] = None, page: int = 1, limit: int = 20
    ) -> Tuple[List[dict], int]:
        query = self.db.query(Order).filter(Order.user_id == user.id)
        if status:
            query = query.filter(Order.status == status.upper())

        query = query.order_by(Order.created_at.desc())
        total = query.count()
        offset = (page - 1) * limit
        orders = query.offset(offset).limit(limit).all()

        results = [
            {
                "id": o.id,
                "order_code": o.order_code,
                "restaurant_name": o.restaurant.name if o.restaurant else "Nhà hàng",
                "total_amount": float(o.total_amount),
                "status": o.status,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "created_at": o.created_at,
                "total_items": sum(i.quantity for i in o.items),
            }
            for o in orders
        ]
        return results, total

    def get_order_details(self, order_id: str, current_user: Optional[User] = None) -> dict:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise NotFoundException("Đơn hàng không tồn tại")

        if current_user and current_user.role == "CUSTOMER" and order.user_id != current_user.id:
            raise ForbiddenException("Bạn không có quyền truy cập đơn hàng này")

        return {
            "id": order.id,
            "order_code": order.order_code,
            "user_id": order.user_id,
            "restaurant_id": order.restaurant_id,
            "restaurant_name": order.restaurant.name if order.restaurant else "Nhà hàng",
            "status": order.status,
            "subtotal": float(order.subtotal),
            "delivery_fee": float(order.delivery_fee),
            "discount_amount": float(order.discount_amount),
            "total_amount": float(order.total_amount),
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "delivery_address": order.delivery_address_snapshot,
            "delivery_notes": order.delivery_notes,
            "cancellation_reason": order.cancellation_reason,
            "created_at": order.created_at,
            "items": [
                {
                    "id": item.id,
                    "food_id": item.food_id,
                    "food_name": item.food_name_snapshot,
                    "unit_price": float(item.unit_price_snapshot),
                    "quantity": item.quantity,
                    "subtotal": float(item.subtotal),
                    "notes": item.notes,
                }
                for item in order.items
            ],
        }

    def cancel_order(self, user: User, order_id: str, reason: str) -> dict:
        order = self.db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
        if not order:
            raise NotFoundException("Đơn hàng không tồn tại")

        if order.status != "PENDING":
            raise AppException("Chỉ có thể hủy đơn hàng khi đang ở trạng thái 'Chờ xử lý'")

        order.status = "CANCELLED"
        order.cancellation_reason = reason
        self.db.commit()
        return self.get_order_details(order.id, user)

    def update_order_status(self, order_id: str, req: OrderStatusUpdateRequest) -> dict:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise NotFoundException("Đơn hàng không tồn tại")

        target_status = req.status.upper()
        allowed = VALID_TRANSITIONS.get(order.status, [])

        if target_status not in allowed:
            raise AppException(
                f"Không thể chuyển trạng thái từ '{order.status}' sang '{target_status}'",
                code="INVALID_STATE_TRANSITION",
            )

        order.status = target_status
        if target_status == "CANCELLED" and req.cancellation_reason:
            order.cancellation_reason = req.cancellation_reason

        if target_status == "COMPLETED" and order.payment:
            order.payment_status = "PAID"
            order.payment.status = "PAID"
            order.payment.paid_at = datetime.now(timezone.utc)

        self.db.commit()
        return self.get_order_details(order.id)

