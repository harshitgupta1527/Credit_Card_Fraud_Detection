import json
import os
import random
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import datetime

from backend.database.connection import get_db
from backend.models.database_models import User, Prediction, SystemLog, AuditLog
from backend.api.schemas import PredictionRequest, PredictionResponse, HistoryResponse, HistoryItem
from backend.authentication.auth_utils import get_current_user
from backend.services.ml_service import ml_service
from backend.services.pdf_service import generate_prediction_pdf, generate_predictions_csv

router = APIRouter(prefix="/predictions", tags=["Predictions"])

# Locate the creditcard.csv once at startup
_CSV_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "creditcard.csv")
)
_df_cache: Optional[pd.DataFrame] = None

def _get_dataset() -> pd.DataFrame:
    """Lazily loads and caches the creditcard CSV."""
    global _df_cache
    if _df_cache is None:
        if not os.path.exists(_CSV_PATH):
            raise FileNotFoundError(f"creditcard.csv not found at {_CSV_PATH}")
        _df_cache = pd.read_csv(_CSV_PATH)
    return _df_cache

@router.get("/random-sample")
def get_random_sample(
    label: Optional[int] = Query(None, description="0 = Genuine, 1 = Fraud, None = any"),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a random transaction row from the creditcard.csv dataset,
    pre-formatted for the prediction form. Optionally filter by Class (0/1).
    """
    try:
        df = _get_dataset()
        if label is not None:
            subset = df[df["Class"] == label]
        else:
            # 50/50 chance of picking a Fraud vs Genuine transaction
            # This makes testing the model much more interactive instead of 99.8% genuine
            chosen_class = random.choice([0, 1])
            subset = df[df["Class"] == chosen_class]
            
            # Fallback if selected subset is empty for some reason
            if subset.empty:
                subset = df
                
        row = subset.sample(n=1).iloc[0]
        # Build dict of all V1-V28 + Time + Amount
        v_cols = {f"V{i}": round(float(row[f"V{i}"]), 6) for i in range(1, 29)}
        return {
            "Time": round(float(row["Time"]), 2),
            "Amount": round(float(row["Amount"]), 2),
            "actual_class": int(row["Class"]),  # spoiler for educational purposes
            **v_cols
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load sample: {str(e)}")

@router.post("/predict", response_model=PredictionResponse)
def predict(
    payload: PredictionRequest, 
    request: Request, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        # Construct feature dictionary from pydantic request
        raw_features = payload.model_dump()
        
        # Extract metadata features
        time_val = raw_features['Time']
        amount_val = raw_features['Amount']
        
        # Run ML model prediction
        label, prob, confidence, risk, rec, elapsed_ms = ml_service.predict(raw_features)
        
        # Serialize features to string for SQL storage
        features_json_str = json.dumps(raw_features)
        
        # Create database prediction log
        new_pred = Prediction(
            user_id=current_user.id,
            transaction_time=time_val,
            transaction_amount=amount_val,
            features_json=features_json_str,
            prediction_label=label,
            probability=prob,
            confidence=confidence,
            risk_level=risk,
            recommendation=rec,
            response_time_ms=elapsed_ms
        )
        db.add(new_pred)
        db.commit()
        db.refresh(new_pred)
        
        # Log system event
        sys_log = SystemLog(
            event_type="ML_PREDICTION",
            message=f"User {current_user.username} checked amount ${amount_val:.2f}. Result: {label} (Risk: {risk})",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None
        )
        db.add(sys_log)
        db.commit()
        
        return {
            "prediction": label,
            "probability": prob,
            "confidence": confidence,
            "risk": risk,
            "recommendation": rec,
            "response_time_ms": elapsed_ms
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(e)}"
        )

@router.get("/history", response_model=HistoryResponse)
def get_history(
    page: int = 1,
    size: int = 10,
    search: Optional[float] = None, # optional amount search
    sort_by: str = "created_at", # "created_at", "amount", "probability"
    order: str = "desc", # "asc", "desc"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Prediction).filter(Prediction.user_id == current_user.id)
    
    # Apply search filter (transaction amount search)
    if search is not None:
        query = query.filter(Prediction.transaction_amount >= search - 5.0).filter(Prediction.transaction_amount <= search + 5.0)
        
    # Apply sorting
    attr = Prediction.created_at
    if sort_by == "amount":
        attr = Prediction.transaction_amount
    elif sort_by == "probability":
        attr = Prediction.probability
        
    if order == "desc":
        query = query.order_by(attr.desc())
    else:
        query = query.order_by(attr.asc())
        
    # Pagination
    total_count = query.count()
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    
    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "size": size
    }

@router.delete("/{prediction_id}", status_code=status.HTTP_200_OK)
def delete_prediction(
    prediction_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found"
        )
        
    # Check permissions (User can delete their own; Admin can delete any)
    if pred.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation unauthorized"
        )
        
    # Create audit log
    audit = AuditLog(
        action="DELETE_PREDICTION",
        table_name="predictions",
        record_id=prediction_id,
        changed_by=current_user.id,
        old_values=json.dumps({
            "amount": pred.transaction_amount,
            "label": pred.prediction_label,
            "probability": pred.probability
        }),
        new_values=None
    )
    db.add(audit)
    
    db.delete(pred)
    db.commit()
    return {"message": "Prediction log deleted successfully"}

@router.get("/{prediction_id}/pdf")
def export_prediction_pdf(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found"
        )
        
    if pred.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation unauthorized"
        )
        
    # Formulate dict for PDF exporter
    pred_data = {
        "prediction_label": pred.prediction_label,
        "probability": pred.probability,
        "confidence": pred.confidence,
        "risk_level": pred.risk_level,
        "recommendation": pred.recommendation,
        "response_time_ms": pred.response_time_ms,
        "created_at": pred.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "features": json.loads(pred.features_json)
    }
    
    pdf_buffer = generate_prediction_pdf(pred_data, current_user.email)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=security_report_{prediction_id}.pdf"}
    )

@router.get("/export/csv")
def export_history_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve all predictions for user
    preds = db.query(Prediction).filter(Prediction.user_id == current_user.id).order_by(Prediction.created_at.desc()).all()
    
    preds_list = []
    for p in preds:
        preds_list.append({
            "id": p.id,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "transaction_time": p.transaction_time,
            "transaction_amount": p.transaction_amount,
            "prediction_label": p.prediction_label,
            "probability": p.probability,
            "confidence": p.confidence,
            "risk_level": p.risk_level,
            "recommendation": p.recommendation,
            "response_time_ms": p.response_time_ms
        })
        
    csv_content = generate_predictions_csv(preds_list)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fraud_prediction_history.csv"}
    )
