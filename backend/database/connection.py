import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import Generator

# Default to SQLite local file, but allow PostgreSQL via env variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fraud_detection.db")

# SQLite check_same_thread setting is required for Uvicorn multi-threading
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator:
    """
    FastAPI dependency yielding a database session context 
    and ensuring cleanup on request teardown.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
