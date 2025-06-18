# app/config.py
from functools import lru_cache
from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Get the project root directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file explicitly
load_dotenv(BASE_DIR / ".env")


class Settings(BaseSettings):
    """Application settings using Pydantic for validation and management"""

    # App Settings
    app_name: str = "SocialFin API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Supabase - REQUIRED
    supabase_url: str = "https://your-supabase-url.supabase.co"
    supabase_anon_key: str = "your-anon-key"
    supabase_service_key: str = "your-service-role-key"

    # JWT Settings - REQUIRED
    jwt_secret_key: str = "your-secret-key"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # External APIs - OPTIONAL
    plaid_client_id: Optional[str] = None
    plaid_secret: Optional[str] = None
    plaid_env: str = "sandbox"
    openai_api_key: Optional[str] = None

    # Redis - OPTIONAL (with defaults)
    redis_url: str = "redis://localhost:6379"

    # Celery - OPTIONAL (with defaults)
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    # Email - OPTIONAL
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create a cached instance
@lru_cache()
def get_settings():
    """Get settings instance with caching"""
    return Settings()


# Create a global instance
settings = get_settings()
