from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Any, List, Optional
import datetime

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)

class UserLogin(BaseModel):
    username: str
    password: str

class TokenRefresh(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    name: str
    username: str

class PredictionRequest(BaseModel):
    Time: float = Field(..., description="Seconds elapsed since the first transaction in the dataset")
    Amount: float = Field(..., description="Transaction amount")
    V1: float = 0.0
    V2: float = 0.0
    V3: float = 0.0
    V4: float = 0.0
    V5: float = 0.0
    V6: float = 0.0
    V7: float = 0.0
    V8: float = 0.0
    V9: float = 0.0
    V10: float = 0.0
    V11: float = 0.0
    V12: float = 0.0
    V13: float = 0.0
    V14: float = 0.0
    V15: float = 0.0
    V16: float = 0.0
    V17: float = 0.0
    V18: float = 0.0
    V19: float = 0.0
    V20: float = 0.0
    V21: float = 0.0
    V22: float = 0.0
    V23: float = 0.0
    V24: float = 0.0
    V25: float = 0.0
    V26: float = 0.0
    V27: float = 0.0
    V28: float = 0.0

class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="Genuine or Fraud")
    probability: float
    confidence: str
    risk: str
    recommendation: str
    response_time_ms: float

class HistoryItem(BaseModel):
    id: int
    created_at: datetime.datetime
    transaction_time: float
    transaction_amount: float
    prediction_label: str
    probability: float
    confidence: str
    risk_level: str
    recommendation: str
    response_time_ms: float

    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total_count: int
    page: int
    size: int

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    theme: Optional[str] = None
    threshold: Optional[float] = None

class UserProfile(BaseModel):
    username: str
    email: str
    name: str
    role: str
    created_at: datetime.datetime
    theme: str
    threshold: float

class DashboardTrendItem(BaseModel):
    date: str
    total: int
    fraud: int

class RecentActivityItem(BaseModel):
    id: int
    time: str
    amount: float
    label: str
    risk: str

class DashboardStats(BaseModel):
    total_predictions: int
    fraud_detected: int
    fraud_rate: float
    model_accuracy: float
    model_precision: float
    model_recall: float
    model_f1: float
    recent_activity: List[RecentActivityItem]
    prediction_trends: List[DashboardTrendItem]
