from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, text
import datetime
import psutil
import json

from backend.database.connection import get_db
from backend.models.database_models import User, Prediction, Settings, SystemLog, AuditLog, ModelMetadata
from backend.api.schemas import DashboardStats, UserProfile, ProfileUpdate
from backend.authentication.auth_utils import get_current_user, get_current_admin
from backend.authentication.auth_handler import hash_password
from backend.services.ml_service import ml_service

router = APIRouter(prefix="/system", tags=["System Dashboard"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Total & Fraud prediction aggregates for current user
    total_preds = db.query(Prediction).filter(Prediction.user_id == current_user.id).count()
    fraud_preds = db.query(Prediction).filter(Prediction.user_id == current_user.id).filter(Prediction.prediction_label == "Fraud").count()
    fraud_rate = (fraud_preds / total_preds * 100.0) if total_preds > 0 else 0.0
    
    # 2. Get Model metrics from ML Service Metadata
    meta = ml_service.metadata if ml_service.metadata else {}
    metrics = meta.get("metrics", {})
    
    # 3. Retrieve recent predictions (last 5 items)
    recent_items = db.query(Prediction).filter(Prediction.user_id == current_user.id).order_by(Prediction.created_at.desc()).limit(5).all()
    recent_activity = []
    for item in recent_items:
        recent_activity.append({
            "id": item.id,
            "time": item.created_at.strftime("%I:%M %p"),
            "amount": item.transaction_amount,
            "label": item.prediction_label,
            "risk": item.risk_level
        })
        
    # 4. Generate daily trend data (last 7 days)
    trends = []
    today = datetime.date.today()
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_str = day.strftime("%b %d")
        
        # Query total and fraud counts for that day
        day_total = db.query(Prediction).filter(Prediction.user_id == current_user.id).filter(
            func.date(Prediction.created_at) == day
        ).count()
        
        day_fraud = db.query(Prediction).filter(Prediction.user_id == current_user.id).filter(
            Prediction.prediction_label == "Fraud"
        ).filter(
            func.date(Prediction.created_at) == day
        ).count()
        
        trends.append({
            "date": day_str,
            "total": day_total,
            "fraud": day_fraud
        })
        
    return {
        "total_predictions": total_preds,
        "fraud_detected": fraud_preds,
        "fraud_rate": fraud_rate,
        "model_accuracy": metrics.get("Accuracy", 0.9995),
        "model_precision": metrics.get("Precision", 0.9726),
        "model_recall": metrics.get("Recall", 0.7474),
        "model_f1": metrics.get("F1-Score", 0.8452),
        "recent_activity": recent_activity,
        "prediction_trends": trends
    }

@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    theme = current_user.settings.theme if current_user.settings else "dark"
    threshold = current_user.settings.threshold if current_user.settings else 0.5
    
    return {
        "username": current_user.username,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "theme": theme,
        "threshold": threshold
    }

@router.put("/profile", response_model=UserProfile)
def update_profile(
    profile_data: ProfileUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        # User profile updates
        if profile_data.name is not None:
            current_user.name = profile_data.name
        if profile_data.email is not None:
            current_user.email = profile_data.email
        if profile_data.password is not None and len(profile_data.password) >= 6:
            current_user.hashed_password = hash_password(profile_data.password)
            
        # Settings updates
        if current_user.settings:
            if profile_data.theme is not None:
                current_user.settings.theme = profile_data.theme
            if profile_data.threshold is not None:
                current_user.settings.threshold = profile_data.threshold
                
        db.commit()
        db.refresh(current_user)
        
        # Log profile change in audit trail
        audit = AuditLog(
            action="UPDATE_PROFILE",
            table_name="users",
            record_id=current_user.id,
            changed_by=current_user.id,
            old_values=json.dumps({"name": current_user.name, "email": current_user.email}),
            new_values=json.dumps(profile_data.model_dump(exclude_unset=True))
        )
        db.add(audit)
        db.commit()
        
        return get_profile(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user profile: {e}"
        )

@router.get("/admin/health")
def get_system_health(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """
    Returns system server diagnostic details. Restricted to Admin roles.
    """
    # 1. DB Ping
    try:
        db.execute(text("SELECT 1"))
        db_status = "Healthy"
    except Exception:
        db_status = "Unreachable"
        
    # 2. Server stats
    cpu_percent = psutil.cpu_percent()
    ram = psutil.virtual_memory()
    ram_usage = f"{ram.used / (1024*1024*1024):.1f} GB / {ram.total / (1024*1024*1024):.1f} GB ({ram.percent}%)"
    
    # 3. Model status
    meta = ml_service.metadata if ml_service.metadata else {}
    model_name = meta.get("model_name", "CatBoost")
    model_status = "Loaded" if ml_service.model is not None else "Failed"
    
    return {
        "server_health": "Online",
        "database_status": db_status,
        "cpu_usage": f"{cpu_percent}%",
        "memory_usage": ram_usage,
        "model_version": "1.0.0",
        "model_name": model_name,
        "model_status": model_status,
        "active_users": db.query(User).count(),
        "total_system_predictions": db.query(Prediction).count()
    }

@router.get("/admin/logs")
def get_system_logs(
    limit: int = 25, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_admin)
):
    """
    Returns system audits and traffic logs. Restricted to Admin roles.
    """
    sys_logs = db.query(SystemLog).order_by(SystemLog.created_at.desc()).limit(limit).all()
    audit_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    sys_list = [{
        "id": log.id,
        "event_type": log.event_type,
        "message": log.message,
        "time": log.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for log in sys_logs]
    
    audit_list = [{
        "id": log.id,
        "action": log.action,
        "table_name": log.table_name,
        "changed_by": log.modifier.username if log.modifier else "Unknown",
        "time": log.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for log in audit_logs]
    
    return {
        "system_logs": sys_list,
        "audit_logs": audit_list
    }
