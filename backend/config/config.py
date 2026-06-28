import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """
    Application configuration settings, loaded from environment variables 
    or local .env files.
    """
    # Security Configuration
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "9f8a3d6b2c5e1f0a7b4c8d3e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fraud_detection.db")
    
    # CORS Configuration (allows frontend connection)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
