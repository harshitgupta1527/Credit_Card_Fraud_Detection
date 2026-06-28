from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import datetime
from backend.database.connection import get_db
from backend.models.database_models import User, Settings, SystemLog
from backend.api.schemas import UserRegister, UserLogin, TokenResponse, TokenRefresh
from backend.authentication.auth_handler import (
    hash_password, verify_password, create_access_token, create_refresh_token, verify_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def log_event(db: Session, event_type: str, message: str, user_id: int = None, ip: str = None):
    """Utility log event helper."""
    sys_log = SystemLog(
        event_type=event_type,
        message=message,
        user_id=user_id,
        ip_address=ip
    )
    db.add(sys_log)
    db.commit()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, request: Request, db: Session = Depends(get_db)):
    # Check if user already exists by username
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if user already exists by email
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )
        
    # Create new user
    hashed = hash_password(user_data.password)
    
    # The first registered user will be Admin, others will be standard Users
    role = "Admin" if db.query(User).count() == 0 else "User"
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed,
        name=user_data.name,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default user settings
    default_settings = Settings(
        user_id=new_user.id,
        theme="dark",
        enable_notifications=True,
        threshold=0.5
    )
    db.add(default_settings)
    db.commit()
    
    log_event(
        db, 
        "USER_REGISTRATION", 
        f"Registered new user account: {new_user.username} ({new_user.role})", 
        new_user.id, 
        request.client.host if request.client else None
    )
    
    return {"message": "User registered successfully"}

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
        
    # Generate tokens
    payload = {"sub": user.username, "role": user.role, "uid": user.id}
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)
    
    log_event(
        db, 
        "USER_LOGIN", 
        f"User logged in successfully: {user.username}", 
        user.id, 
        request.client.host if request.client else None
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": user.role,
        "name": user.name,
        "username": user.username
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh(refresh_data: TokenRefresh, db: Session = Depends(get_db)):
    # Decode and validate refresh token
    payload = verify_token(refresh_data.refresh_token, token_type="refresh")
    username = payload.get("sub")
    
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User session is invalid"
        )
        
    # Generate new pair of tokens
    new_payload = {"sub": user.username, "role": user.role, "uid": user.id}
    access_token = create_access_token(new_payload)
    refresh_token = create_refresh_token(new_payload)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": user.role,
        "name": user.name,
        "username": user.username
    }
