from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.core.response import success_response

# Module routers
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.restaurants.router import router as restaurants_router
from app.modules.categories.router import router as categories_router
from app.modules.foods.router import router as foods_router
from app.modules.cart.router import router as cart_router
from app.modules.orders.router import router as orders_router
from app.modules.reviews.router import router as reviews_router
from app.modules.favorites.router import router as favorites_router
from app.modules.interactions.router import router as interactions_router
from app.modules.recommendations.router import router as recommendations_router
from app.modules.admin.router import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed data if not present
    try:
        from app.core.database import engine
        from app.models.base import Base
        import app.models  # load all models
        Base.metadata.create_all(bind=engine)

        from app.scripts.seed_data import seed_database
        seed_database()

        try:
            from app.core.database import SessionLocal
            from app.models.food import Food
            with SessionLocal() as db:
                if db.query(Food).count() == 0:
                    from app.recsys.scripts.sync_to_database import sync_database
                    sync_database()
        except Exception as seed_err:
            print(f"Dataset sync notice: {seed_err}")
    except Exception as e:
        print(f"Startup database initialization error: {e}")
    yield


app = FastAPI(
    title="Food Ordering & Recommendation System API",
    description="Hệ thống Backend đặt đồ ăn trực tuyến tích hợp hệ thống gợi ý món ăn (Modular Monolith, Clean Architecture).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Health check
@app.get("/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
def health_check():
    return success_response(
        data={"status": "healthy", "env": settings.APP_ENV, "app_name": settings.APP_NAME},
        message="Hệ thống đang hoạt động bình thường",
    )

# Register API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(users_router, prefix=api_v1_prefix)
app.include_router(restaurants_router, prefix=api_v1_prefix)
app.include_router(categories_router, prefix=api_v1_prefix)
app.include_router(foods_router, prefix=api_v1_prefix)
app.include_router(cart_router, prefix=api_v1_prefix)
app.include_router(orders_router, prefix=api_v1_prefix)
app.include_router(reviews_router, prefix=api_v1_prefix)
app.include_router(favorites_router, prefix=api_v1_prefix)
app.include_router(interactions_router, prefix=api_v1_prefix)
app.include_router(recommendations_router, prefix=api_v1_prefix)
app.include_router(admin_router, prefix=api_v1_prefix)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
