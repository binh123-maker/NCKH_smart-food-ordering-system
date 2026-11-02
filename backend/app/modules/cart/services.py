from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, ConflictException, AppException
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.food import Food
from app.modules.cart.schemas import AddToCartRequest, UpdateCartItemRequest

class CartService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_cart(self, user: User) -> Cart:
        cart = self.db.query(Cart).filter(Cart.user_id == user.id).first()
        if not cart:
            cart = Cart(user_id=user.id)
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)
        return cart

    def get_cart_details(self, user: User) -> dict:
        cart = self.get_or_create_cart(user)
        items = []
        subtotal = 0.0
        total_items = 0

        for item in cart.items:
            f = item.food
            item_subtotal = float(item.unit_price) * item.quantity
            subtotal += item_subtotal
            total_items += item.quantity
            
            primary_img = None
            if f and f.images:
                primary_img = f.images[0].image_url

            items.append({
                "id": item.id,
                "food_id": item.food_id,
                "food_name": f.name if f else "Món không xác định",
                "unit_price": float(item.unit_price),
                "quantity": item.quantity,
                "subtotal": item_subtotal,
                "image_url": primary_img,
                "notes": item.notes,
                "is_available": f.is_available if f else False,
            })

        return {
            "id": cart.id,
            "restaurant_id": cart.restaurant_id,
            "restaurant_name": cart.restaurant.name if cart.restaurant else None,
            "total_items": total_items,
            "subtotal": round(subtotal, 2),
            "items": items,
        }

    def add_to_cart(self, user: User, req: AddToCartRequest) -> dict:
        cart = self.get_or_create_cart(user)
        food = self.db.query(Food).filter(Food.id == req.food_id).first()
        if not food:
            raise NotFoundException("Món ăn không tồn tại")
        if not food.is_available:
            raise AppException("Món ăn hiện tại đang tạm ngưng phục vụ")

        # Single Restaurant Policy Check
        if cart.restaurant_id and cart.restaurant_id != food.restaurant_id:
            if not req.force_clear_if_different_restaurant:
                raise ConflictException(
                    "Giỏ hàng của bạn đang chứa món ăn từ nhà hàng khác. Bạn có muốn làm mới giỏ hàng?",
                    details={"current_restaurant_id": cart.restaurant_id, "new_restaurant_id": food.restaurant_id},
                )
            # Clear old cart items
            self.db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
            cart.restaurant_id = food.restaurant_id
        elif not cart.restaurant_id:
            cart.restaurant_id = food.restaurant_id

        # Check if item already exists
        existing_item = self.db.query(CartItem).filter(
            CartItem.cart_id == cart.id, CartItem.food_id == food.id
        ).first()

        if existing_item:
            existing_item.quantity += req.quantity
            existing_item.unit_price = food.price
            if req.notes is not None:
                existing_item.notes = req.notes
        else:
            new_item = CartItem(
                cart_id=cart.id,
                food_id=food.id,
                quantity=req.quantity,
                unit_price=food.price,
                notes=req.notes,
            )
            self.db.add(new_item)

        self.db.commit()
        return self.get_cart_details(user)

    def update_item_quantity(self, user: User, item_id: str, req: UpdateCartItemRequest) -> dict:
        cart = self.get_or_create_cart(user)
        item = self.db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
        if not item:
            raise NotFoundException("Món trong giỏ không tồn tại")

        item.quantity = req.quantity
        if req.notes is not None:
            item.notes = req.notes
        self.db.commit()
        return self.get_cart_details(user)

    def remove_item(self, user: User, item_id: str) -> dict:
        cart = self.get_or_create_cart(user)
        item = self.db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
        if not item:
            raise NotFoundException("Món trong giỏ không tồn tại")

        self.db.delete(item)
        self.db.flush()

        # If cart empty, reset restaurant_id
        if self.db.query(CartItem).filter(CartItem.cart_id == cart.id).count() == 0:
            cart.restaurant_id = None

        self.db.commit()
        return self.get_cart_details(user)

    def clear_cart(self, user: User) -> None:
        cart = self.get_or_create_cart(user)
        self.db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        cart.restaurant_id = None
        self.db.commit()

