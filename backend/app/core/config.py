from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    APP_NAME: str = "Food Recommendation System"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/food_recsys",
        description="PostgreSQL Connection URL"
    )
    
    # Test SQLite DB for offline schema verification
    TEST_DATABASE_URL: str = "sqlite:///./test_schema.db"
    
    # JWT & Security
    SECRET_KEY: str = "super_secret_temporary_key_for_development_purposes_only_123456"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

