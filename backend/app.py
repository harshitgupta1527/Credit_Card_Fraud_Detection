from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
import logging

from backend.database.connection import engine, Base
from backend.config.config import settings
from backend.api import auth, prediction, dashboard

# Configure basic logging formatting
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("fraud_detection")

# Auto-generate database tables in SQLite/PostgreSQL on application startup
try:
    logger.info("Scaffolding database schemas and tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas initialized successfully.")
except Exception as e:
    logger.critical(f"Failed to initialize database tables: {e}")
    raise e

app = FastAPI(
    title="Fraud Guard API",
    description="Enterprise-grade Credit Card Fraud Detection API, built with FastAPI, Pydantic, and Scikit-Learn.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configurations for cross-origin frontend support
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints routers under /api/v1 prefix
app.include_router(auth.router, prefix="/api/v1")
app.include_router(prediction.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")

@app.get("/", status_code=status.HTTP_200_OK)
def root():
    """Root landing check endpoint."""
    return {
        "status": "Online",
        "service": "Credit Card Fraud Detection API Core",
        "documentation": "/docs"
    }

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Public health checker routing."""
    return {"status": "Healthy", "timestamp": str(datetime.datetime.utcnow())}

# Required import for health timestamp calculation
import datetime
