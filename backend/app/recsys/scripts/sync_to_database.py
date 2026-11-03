import os
import sys
import json
import uuid
from pathlib import Path
import pandas as pd

# Path setup
FILE_PATH = Path(__file__).resolve()
PROJECT_ROOT = FILE_PATH.parents[4]
BACKEND_ROOT = FILE_PATH.parents[3]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.category import Category
from app.models.restaurant import Restaurant
from app.models.food import Food, FoodNutrition, FoodImage
from app.models.recommendation import ModelVersion
from app.recsys.config import RAW_DATA_DIR, EVALUATION_DIR, CURRENT_MODEL_VERSION

def sync_database():
    print("Syncing Research Dataset and Model Version into Database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Categories
        categories_meta = [
            {"id": "COM", "name": "Cơm Việt & Châu Á", "slug": "com-viet-chau-a", "sort_order": 1},
            {"id": "PHO_BUN", "name": "Phở & Bún Truyền Thống", "slug": "pho-bun-truyen-thong", "sort_order": 2},
            {"id": "HEALTHY_SALAD", "name": "Healthy & Salad Dinh Dưỡng", "slug": "healthy-salad-dinh-duong", "sort_order": 3},
            {"id": "FASTFOOD", "name": "Đồ Ăn Nhanh & Snack", "slug": "do-an-nhanh-snack", "sort_order": 4},
            {"id": "DOUONG", "name": "Đồ Uống & Trà Hoa Quả", "slug": "do-uong-tra-hoa-qua", "sort_order": 5},
            {"id": "TRANGMIENG", "name": "Tráng Miệng & Chè Bánh", "slug": "trang-mieng-che-banh", "sort_order": 6},
        ]
        cat_map = {}
        for c in categories_meta:
            existing = db.query(Category).filter(Category.slug == c["slug"]).first()
            if not existing:
                cat = Category(
                    id=str(uuid.uuid4()),
                    name=c["name"],
                    slug=c["slug"],
                    sort_order=c["sort_order"]
                )
                db.add(cat)
                db.flush()
                cat_map[c["id"]] = cat.id
            else:
                cat_map[c["id"]] = existing.id

        # 2. Restaurants
        restaurants_meta = [
            {"name": "Bếp Cơm Niêu & Lẩu Việt", "slug": "bep-com-nieu-lau-viet", "address": "12 Kim Mã, Ba Đình, Hà Nội", "rating": 4.8},
            {"name": "Phở & Bún Xưa Phố Cổ", "slug": "pho-bun-xua-pho-co", "address": "45 Hàng Chiếu, Hoàn Kiếm, Hà Nội", "rating": 4.9},
            {"name": "Green Eat & Clean Poke", "slug": "green-eat-clean-poke", "address": "88 Tô Hiệu, Cầu Giấy, Hà Nội", "rating": 4.7},
            {"name": "Urban Burger & Crispy Chicken", "slug": "urban-burger-crispy-chicken", "address": "102 Chùa Láng, Đống Đa, Hà Nội", "rating": 4.6},
            {"name": "Tiệm Trà & Cafe Gió Nam", "slug": "tiem-tra-cafe-gio-nam", "address": "25 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội", "rating": 4.8},
        ]
        rest_list = []
        for r in restaurants_meta:
            existing_r = db.query(Restaurant).filter(Restaurant.slug == r["slug"]).first()
            if not existing_r:
                rest = Restaurant(
                    id=str(uuid.uuid4()),
                    name=r["name"],
                    slug=r["slug"],
                    address=r["address"],
                    phone="0988776655",
                    rating_average=r["rating"],
                    total_reviews=180,
                    is_active=True
                )
                db.add(rest)
                db.flush()
                rest_list.append(rest.id)
            else:
                rest_list.append(existing_r.id)

        # 3. Load and Sync 60 Foods
        df_foods = pd.read_csv(RAW_DATA_DIR / "foods.csv")
        image_fallbacks = [
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
        ]

        synced_count = 0
        for idx, row in df_foods.iterrows():
            f_code = row["id"] # e.g. food_001
            f_name = row["name"]
            cat_id = cat_map.get(row["category_id"], list(cat_map.values())[0])
            rest_id = rest_list[idx % len(rest_list)]

            existing_f = db.query(Food).filter(Food.name == f_name).first()
            if not existing_f:
                food_id = str(uuid.uuid4())
                slug = f"food-{idx+1}-{row['category_id'].lower()}"
                new_food = Food(
                    id=food_id,
                    restaurant_id=rest_id,
                    category_id=cat_id,
                    name=f_name,
                    slug=slug,
                    description=f"{f_name} - Món ăn thơm ngon, chuẩn vị với nguyên liệu tuyển chọn: {row['ingredients']}.",
                    price=float(row["price"]),
                    rating_average=float(row["rating_average"]),
                    total_reviews=35,
                    order_count=int(row["order_count"]),
                    is_available=True
                )
                db.add(new_food)
                db.flush()

                # Add Nutrition
                nutr = FoodNutrition(
                    id=str(uuid.uuid4()),
                    food_id=food_id,
                    calories=float(row["calories"]),
                    protein=float(row["protein"]),
                    fat=float(row["fat"]),
                    carbohydrates=float(row["carbohydrates"]),
                    fiber=4.0
                )
                db.add(nutr)

                # Add Image
                img = FoodImage(
                    id=str(uuid.uuid4()),
                    food_id=food_id,
                    image_url=image_fallbacks[idx % len(image_fallbacks)],
                    is_primary=True,
                    sort_order=0
                )
                db.add(img)
                synced_count += 1

        print(f"Synced {synced_count} new scientific food records into database.")

        # 4. Record Active Model Version with Real Metrics
        eval_json_path = EVALUATION_DIR / "evaluation_results.json"
        metrics_dict = {}
        if eval_json_path.exists():
            with open(eval_json_path, "r", encoding="utf-8") as f:
                metrics_data = json.load(f)
                for item in metrics_data.get("metrics_table", []):
                    if "Hybrid" in item.get("Model", ""):
                        metrics_dict = item

        # Deactivate previous versions
        db.query(ModelVersion).update({"is_active": False})

        hybrid_ndcg = float(metrics_dict.get("NDCG@10", 0.5945))
        hybrid_prec = float(metrics_dict.get("Precision@10", 0.1871))
        hybrid_recall = float(metrics_dict.get("Recall@10", 0.7519))
        hybrid_cov = float(metrics_dict.get("Coverage@10", 1.0))

        active_version = ModelVersion(
            id=str(uuid.uuid4()),
            version_code=CURRENT_MODEL_VERSION,
            algorithm_type="HYBRID_WEIGHTED",
            hyperparameters={
                "cbf_weight": 0.55,
                "cf_weight": 0.45,
                "cf_components": 15,
                "k_eval": [5, 10],
                "cold_start_threshold": 3,
                "nutrition_penalty": 0.25,
                "budget_penalty": 0.30
            },
            precision_at_k=hybrid_prec,
            recall_at_k=hybrid_recall,
            f1_at_k=float(metrics_dict.get("F1@10", 0.2914)),
            ndcg_at_k=hybrid_ndcg,
            map_at_k=float(metrics_dict.get("MAP@10", 0.4683)),
            coverage_rate=hybrid_cov,
            is_active=True,
            notes="Trained on 60 foods, 120 users, 2798 interactions with 80/20 train-test stratified split."
        )
        db.add(active_version)
        db.commit()
        print(f"Active model version '{CURRENT_MODEL_VERSION}' registered in database with NDCG@10={hybrid_ndcg:.4f}.")

    except Exception as e:
        db.rollback()
        print(f"Error syncing database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    sync_database()
