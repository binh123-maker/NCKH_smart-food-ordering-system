import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.base import Base

logger = logging.getLogger("app.database")

# Ensure postgresql connection uses psycopg2 driver if not specified
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    try:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=settings.DEBUG
        )
        # Test connection
        with engine.connect() as conn:
            pass
    except Exception as e:
        logger.warning(f"Failed to connect to primary DB ({db_url}): {e}. Falling back to SQLite.")
        # Fallback to local SQLite development database if PostgreSQL is not active
        sqlite_fallback_url = "sqlite:///./dev_food_recsys.db"
        engine = create_engine(
            sqlite_fallback_url,
            connect_args={"check_same_thread": False},
            echo=False
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
