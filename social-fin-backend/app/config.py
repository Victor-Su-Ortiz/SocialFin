# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache
import os
from pathlib import Path
from dotenv import load_dotenv

# Get the project root directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file explicitly
load_dotenv(BASE_DIR / ".env")


class Settings(BaseSettings):
    # App Settings
    app_name: str = "SocialFin API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Supabase - REQUIRED
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_key: Optional[str] = None

    # JWT Settings - REQUIRED
    jwt_secret_key: Optional[str] = None
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
    return Settings()


# Create a global instance
settings = get_settings()

print(settings.supabase_anon_key)  # Example usage to verify settings are loaded
