import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine, SessionLocal
from app.models.base import Base
import app.models  # load all models
from app.models.user import User, UserProfile, UserPreference, UserAddress
from app.models.restaurant import Restaurant
from app.models.category import Category
from app.models.food import Food, FoodNutrition, FoodImage
from app.models.recommendation import ModelVersion
from app.core.security import hash_password

def seed_database():
    print("Creating tables if not exists...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already seeded
        existing_admin = db.query(User).filter(User.email == "admin@foodrecsys.com").first()
        if existing_admin:
            print("Database already contains seed data. Skipping seed.")
            return

        print("Seeding Users...")
        # 1. Admin user
        admin = User(
            id="usr-admin",
            email="admin@foodrecsys.com",
            password_hash=hash_password("Admin@123456"),
            phone="0900000001",
            role="ADMIN",
            is_active=True
        )
        admin_profile = UserProfile(
            user_id="usr-admin",
            full_name="Quản trị viên Hệ thống",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
        )
        db.add(admin)
        db.add(admin_profile)

        # 2. Customer user
        customer = User(
            id="usr-customer",
            email="customer@example.com",
            password_hash=hash_password("Customer@123456"),
            phone="0901234567",
            role="CUSTOMER",
            is_active=True
        )
        customer_profile = UserProfile(
            user_id="usr-customer",
            full_name="Nguyễn Văn A",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80"
        )
        customer_pref = UserPreference(
            user_id="usr-customer",
            preferred_categories=["cat-1", "cat-3"],
            budget_per_meal=65000,
            daily_calorie_target=1800,
            preferred_protein_min=30,
            dietary_restrictions=["Eat Clean", "Ít dầu mỡ"],
            is_onboarded=True
        )
        customer_addr = UserAddress(
            user_id="usr-customer",
            recipient_name="Nguyễn Văn A",
            recipient_phone="0901234567",
            address_line="123 Nguyễn Huệ, Phường Bến Nghé",
            district="Quận 1",
            city="TP. Hồ Chí Minh",
            is_default=True
        )
        db.add(customer)
        db.add(customer_profile)
        db.add(customer_pref)
        db.add(customer_addr)

        # 3. Categories
        print("Seeding Categories...")
        categories = [
            Category(id="cat-1", name="Cơm văn phòng", slug="com-van-phong", description="Cơm dinh dưỡng, đủ chất cho dân văn phòng", sort_order=1),
            Category(id="cat-2", name="Bún & Phở", slug="bun-pho", description="Các món sợi nước truyền thống Việt Nam", sort_order=2),
            Category(id="cat-3", name="Healthy & Salad", slug="healthy-salad", description="Thực đơn Eat Clean, giàu đạm, ít calo", sort_order=3),
            Category(id="cat-4", name="Đồ uống & Trà sữa", slug="do-uong-tra-sua", description="Trà giải nhiệt, nước ép nguyên chất", sort_order=4),
            Category(id="cat-5", name="Ăn vặt & Fastfood", slug="an-vat-fastfood", description="Khoai tây, gà rán, bánh tráng nướng", sort_order=5),
        ]
        db.add_all(categories)

        # 4. Restaurants
        print("Seeding Restaurants...")
        restaurants = [
            Restaurant(
                id="rest-1",
                name="Bếp Xanh Dinh Dưỡng - Eat Clean",
                slug="bep-xanh-dinh-duong",
                description="Chuyên các phần cơm Eat Clean chuẩn macro dinh dưỡng cho người tập luyện và văn phòng.",
                address="45 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM",
                phone="0911223344",
                email="contact@bepxanh.vn",
                opening_hours="07:00 - 21:00",
                rating_average=4.9,
                total_reviews=128,
                is_active=True
            ),
            Restaurant(
                id="rest-2",
                name="Cơm Tấm Ba Ghiền Sài Gòn",
                slug="com-tam-ba-ghien",
                description="Hương vị cơm tấm sườn nướng than hoa truyền thống lừng danh Sài Gòn.",
                address="84 Đặng Văn Ngữ, Phường 10, Phú Nhuận, TP.HCM",
                phone="0933445566",
                email="baghien@comtam.vn",
                opening_hours="06:30 - 22:00",
                rating_average=4.8,
                total_reviews=310,
                is_active=True
            ),
            Restaurant(
                id="rest-3",
                name="Phở Thìn Lò Đúc - Chi Nhánh HCM",
                slug="pho-thin-lo-duc",
                description="Phở bò tái lăn xào lửa lớn đượm mùi gừng tỏi thơm nức.",
                address="110 Hai Bà Trưng, Đa Kao, Quận 1, TP.HCM",
                phone="0944556677",
                opening_hours="06:00 - 21:30",
                rating_average=4.7,
                total_reviews=140,
                is_active=True
            ),
            Restaurant(
                id="rest-4",
                name="Tiệm Trà Mộc & Nước Ép Tươi",
                slug="tiem-tra-moc",
                description="Nước ép lạnh nguyên chất và trà thảo mộc organic không đường hóa học.",
                address="15 Nguyễn Thị Minh Khai, Bến Nghé, Quận 1, TP.HCM",
                phone="0955667788",
                opening_hours="08:00 - 22:30",
                rating_average=4.8,
                total_reviews=88,
                is_active=True
            )
        ]
        db.add_all(restaurants)

        # 5. Foods & Nutrition
        print("Seeding Foods...")
        foods_data = [
            {
                "id": "food-1",
                "restaurant_id": "rest-1",
                "category_id": "cat-3",
                "name": "Cơm ức gà nướng sốt mè rang",
                "slug": "com-uc-ga-nuong-me-rang",
                "description": "Ức gà áp chảo mềm mọng nước, ăn kèm gạo lứt dẻo, rau củ luộc và sốt mè rang béo thơm chuẩn vị.",
                "price": 59000,
                "original_price": 69000,
                "rating_average": 4.9,
                "total_reviews": 128,
                "order_count": 850,
                "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
                "nutrition": {"calories": 485, "protein": 42, "fat": 9, "carbohydrates": 58, "fiber": 4, "sodium": 420}
            },
            {
                "id": "food-2",
                "restaurant_id": "rest-1",
                "category_id": "cat-3",
                "name": "Salad cá hồi áp chảo sốt bơ tỏi",
                "slug": "salad-ca-hoi-ap-chao",
                "description": "Cá hồi Nauy áp chảo da giòn, xà lách Romaine tươi giòn, trứng cút lòng đào và sốt bơ tỏi chanh thanh nhẹ.",
                "price": 85000,
                "original_price": 95000,
                "rating_average": 4.8,
                "total_reviews": 95,
                "order_count": 420,
                "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
                "nutrition": {"calories": 420, "protein": 32, "fat": 16, "carbohydrates": 18, "fiber": 5, "sodium": 380}
            },
            {
                "id": "food-3",
                "restaurant_id": "rest-2",
                "category_id": "cat-1",
                "name": "Cơm tấm sườn bì chả đặc biệt",
                "slug": "com-tam-suon-bi-cha",
                "description": "Cơm tấm hạt tấm nhuyễn dẻo thơm, miếng sườn cốt lết dày ướp mật ong nướng than hồng, chả trứng hấp thơm ngậy.",
                "price": 65000,
                "rating_average": 4.9,
                "total_reviews": 310,
                "order_count": 1420,
                "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
                "nutrition": {"calories": 720, "protein": 35, "fat": 28, "carbohydrates": 82, "fiber": 2, "sodium": 850}
            },
            {
                "id": "food-4",
                "restaurant_id": "rest-3",
                "category_id": "cat-2",
                "name": "Phở bò tái lăn Hà Nội",
                "slug": "pho-bo-tai-lan",
                "description": "Bánh phở tươi mềm mướt, thịt bò bắp xào lăn lửa lớn dậy mùi tỏi và gừng, ngập tràn hành hoa và nước dùng béo ngọt.",
                "price": 60000,
                "rating_average": 4.7,
                "total_reviews": 140,
                "order_count": 670,
                "image_url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80",
                "nutrition": {"calories": 510, "protein": 30, "fat": 14, "carbohydrates": 66, "fiber": 2, "sodium": 980}
            },
            {
                "id": "food-5",
                "restaurant_id": "rest-4",
                "category_id": "cat-4",
                "name": "Trà sữa Ô Long nướng trân châu hoàng kim",
                "slug": "tra-sua-o-long-nuong",
                "description": "Lá trà Ô long rang mộc thơm khói nhẹ, sữa tươi thanh trùng và trân châu hoàng kim dẻo dai nấu đường nâu.",
                "price": 35000,
                "original_price": 45000,
                "rating_average": 4.8,
                "total_reviews": 88,
                "order_count": 890,
                "image_url": "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80",
                "nutrition": {"calories": 290, "protein": 4, "fat": 7, "carbohydrates": 52, "fiber": 1, "sodium": 60}
            },
            {
                "id": "food-6",
                "restaurant_id": "rest-1",
                "category_id": "cat-3",
                "name": "Bowl Bò sốt tiêu đen kèm bắp ngọt",
                "slug": "bowl-bo-sot-tieu-den",
                "description": "Thịt thăn bò Úc xào tiêu đen thơm lừng, bắp ngọt hạt vàng, đậu Edamame Nhật Bản và cơm gạo lứt huyết rồng.",
                "price": 75000,
                "rating_average": 4.9,
                "total_reviews": 64,
                "order_count": 310,
                "image_url": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80",
                "nutrition": {"calories": 520, "protein": 38, "fat": 12, "carbohydrates": 64, "fiber": 6, "sodium": 480}
            }
        ]

        for item in foods_data:
            food = Food(
                id=item["id"],
                restaurant_id=item["restaurant_id"],
                category_id=item["category_id"],
                name=item["name"],
                slug=item["slug"],
                description=item["description"],
                price=item["price"],
                original_price=item.get("original_price"),
                rating_average=item["rating_average"],
                total_reviews=item["total_reviews"],
                order_count=item["order_count"],
                is_available=True
            )
            db.add(food)
            
            # Nutrition
            nut = item["nutrition"]
            nutrition = FoodNutrition(
                food_id=item["id"],
                calories=nut["calories"],
                protein=nut["protein"],
                fat=nut["fat"],
                carbohydrates=nut["carbohydrates"],
                fiber=nut.get("fiber"),
                sodium=nut.get("sodium")
            )
            db.add(nutrition)
            
            # Primary Image
            f_img = FoodImage(
                food_id=item["id"],
                image_url=item["image_url"],
                is_primary=True,
                sort_order=0
            )
            db.add(f_img)

        # 6. RecSys Model Version
        print("Seeding Model Versions...")
        mv = ModelVersion(
            id="mv-1",
            version_code="v1.0.4-hybrid",
            algorithm_type="HYBRID_WEIGHTED",
            hyperparameters={"cb_weight": 0.4, "cf_weight": 0.6, "top_k": 10},
            precision_at_k=0.7250,
            recall_at_k=0.6810,
            f1_at_k=0.7023,
            ndcg_at_k=0.8420,
            map_at_k=0.7040,
            coverage_rate=0.9420,
            is_active=True,
            notes="Active baseline hybrid recommendation pipeline for production serving."
        )
        db.add(mv)

        db.commit()
        print("Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print("Seeding error:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
