import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.user import User, UserProfile, UserPreference, UserAddress
from app.models.restaurant import Restaurant
from app.models.category import Category
from app.models.food import Food, FoodNutrition, Ingredient, FoodIngredient
from app.models.order import Order, OrderItem
from app.models.review import Review, Favorite
from app.models.interaction import UserInteraction
from app.models.recommendation import ModelVersion, RecommendationLog

@pytest.fixture(scope="function")
def db_session():
    """Create an in-memory SQLite database session for unit testing models."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(engine)

def test_user_creation_and_relationships(db_session):
    user = User(
        email="test_user@example.com",
        password_hash="hashed_pw_123",
        phone="0901234567",
        role="CUSTOMER"
    )
    db_session.add(user)
    db_session.flush()

    profile = UserProfile(
        user_id=user.id,
        full_name="Nguyễn Văn A"
    )
    pref = UserPreference(
        user_id=user.id,
        preferred_categories=["com", "bun-pho"],
        daily_calorie_target=2100,
        preferred_protein_min=30.0,
        is_onboarded=True
    )
    db_session.add_all([profile, pref])
    db_session.commit()

    saved_user = db_session.query(User).filter_by(email="test_user@example.com").first()
    assert saved_user is not None
    assert saved_user.profile.full_name == "Nguyễn Văn A"
    assert saved_user.preferences.daily_calorie_target == 2100
    assert saved_user.preferences.is_onboarded is True

def test_food_and_nutrition_features(db_session):
    rest = Restaurant(
        name="Quán Cơm Dinh Dưỡng",
        slug="quan-com-dinh-duong",
        address="123 Nguyễn Văn Cừ, Q5, TP.HCM",
        phone="0987654321"
    )
    cat = Category(
        name="Healthy Food",
        slug="healthy-food"
    )
    db_session.add_all([rest, cat])
    db_session.flush()

    food = Food(
        restaurant_id=rest.id,
        category_id=cat.id,
        name="Cơm ức gà nướng sốt mè",
        slug="com-uc-ga-nuong-sot-me",
        price=55000.0,
        is_available=True
    )
    db_session.add(food)
    db_session.flush()

    nutrition = FoodNutrition(
        food_id=food.id,
        calories=480.0,
        protein=35.0,
        fat=10.0,
        carbohydrates=60.0
    )
    db_session.add(nutrition)
    db_session.commit()

    saved_food = db_session.query(Food).filter_by(slug="com-uc-ga-nuong-sot-me").first()
    assert saved_food is not None
    assert saved_food.nutrition is not None
    assert saved_food.nutrition.calories == 480.0
    assert saved_food.nutrition.protein == 35.0

def test_recsys_interactions_and_model_version(db_session):
    user = User(email="rec_tester@example.com", password_hash="hash")
    rest = Restaurant(name="Rest", slug="rest-rec", address="Addr", phone="0123")
    cat = Category(name="Cat", slug="cat-rec")
    db_session.add_all([user, rest, cat])
    db_session.flush()

    food = Food(restaurant_id=rest.id, category_id=cat.id, name="Salad cá hồi", slug="salad-ca-hoi", price=75000)
    db_session.add(food)
    db_session.flush()

    # Log interaction
    interaction = UserInteraction(
        user_id=user.id,
        food_id=food.id,
        interaction_type="ORDER",
        interaction_weight=5.0,
        dwell_time_seconds=120
    )
    db_session.add(interaction)

    # Log model version
    mv = ModelVersion(
        version_code="v1.0-hybrid-baseline",
        algorithm_type="HYBRID_WEIGHTED",
        hyperparameters={"alpha": 0.5, "k_neighbors": 20},
        precision_at_k=0.3850,
        recall_at_k=0.4210,
        f1_at_k=0.4022,
        ndcg_at_k=0.6120,
        map_at_k=0.3540,
        coverage_rate=0.7850,
        is_active=True
    )
    db_session.add(mv)
    db_session.commit()

    saved_mv = db_session.query(ModelVersion).filter_by(version_code="v1.0-hybrid-baseline").first()
    assert float(saved_mv.precision_at_k) == 0.3850
    assert saved_mv.is_active is True

    interactions = db_session.query(UserInteraction).filter_by(user_id=user.id).all()
    assert len(interactions) == 1
    assert interactions[0].interaction_type == "ORDER"
    assert float(interactions[0].interaction_weight) == 5.0
