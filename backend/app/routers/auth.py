import os
import re
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timezone
from typing import Optional

from ..db import get_db
from ..models import User, RefreshToken
from ..core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_auth_user,
    require_auth_user
)
from ..core.config import settings

router = APIRouter()

@router.get("/test")
def test_auth():
    """Simple test endpoint without database dependency"""
    return {"status": "ok", "message": "Auth router working"}

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one alphabetical letter")
        if not any(c.isdigit() or not c.isalnum() for c in v):
            raise ValueError("Password must contain at least one number or symbol")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters long")
        if not any(c.isalpha() for c in v):
            raise ValueError("New password must contain at least one alphabetical letter")
        if not any(c.isdigit() or not c.isalnum() for c in v):
            raise ValueError("New password must contain at least one number or symbol")
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    plan: str
    token: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

def _set_auth_cookie(response: Response, token: str):
    """Sets a secure, HttpOnly session cookie adhering to RFC 6265."""
    response.set_cookie(
        key="airsense_access",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
        max_age=settings.JWT_EXPIRES_MIN * 60
    )



@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest, response: Response, db: Session = Depends(get_db)):
    try:
        # Check if user exists in database
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists"
            )
        
        # Create new user with bcrypt-hashed password
        hashed_pw = hash_password(request.password)
        user = User(
            email=request.email,
            password_hash=hashed_pw,
            plan="free"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Issue signed JWT access token
        token = create_access_token(
            {"sub": str(user.id), "email": user.email, "plan": user.plan},
            settings.JWT_EXPIRES_MIN
        )
        
        # Set HttpOnly session cookie
        _set_auth_cookie(response, token)
        
        return UserResponse(
            id=user.id,
            email=user.email,
            plan=user.plan,
            token=token,
            created_at=user.created_at,
            last_login=user.last_login
        )
    except HTTPException:
        raise
    except OperationalError as oe:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service temporarily unavailable. Please start the MySQL service."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/login", response_model=UserResponse)
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        # Query database for user
        user = db.query(User).filter(User.email == request.email).first()
        if not user or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create JWT access token
        token = create_access_token(
            {"sub": str(user.id), "email": user.email, "plan": user.plan},
            settings.JWT_EXPIRES_MIN
        )
        
        # Set HttpOnly cookie
        _set_auth_cookie(response, token)
        
        # Update last login timestamp
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        
        return UserResponse(
            id=user.id,
            email=user.email,
            plan=user.plan,
            token=token,
            created_at=user.created_at,
            last_login=user.last_login
        )
    except HTTPException:
        raise
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service temporarily unavailable."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    # Invalidate refresh tokens in database if user is authenticated and DB is online
    try:
        user_data = get_auth_user(request)
        if user_data:
            db.query(RefreshToken).filter(RefreshToken.user_id == user_data["id"]).delete()
            db.commit()
    except Exception:
        pass
    
    # Strictly delete the session cookie matching path and domain
    response.delete_cookie(
        key="airsense_access",
        domain=settings.COOKIE_DOMAIN,
        path="/"
    )
    return {"ok": True, "message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_current_user(request: Request, db: Session = Depends(get_db)):
    user_data = require_auth_user(request)
    
    # Try fetching fresh record from database
    try:
        user = db.query(User).filter(User.id == user_data["id"]).first()
        if user:
            return UserResponse(
                id=user.id,
                email=user.email,
                plan=user.plan,
                created_at=user.created_at,
                last_login=user.last_login
            )
    except Exception:
        pass
    
    # Fallback to verified JWT claims
    return UserResponse(
        id=int(user_data["id"]) if str(user_data["id"]).isdigit() else 1,
        email=user_data["email"],
        plan=user_data["plan"]
    )

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user_data = require_auth_user(request)
    try:
        user = db.query(User).filter(User.id == user_data["id"]).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")
        
        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect")
        
        user.password_hash = hash_password(payload.new_password)
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        return {"ok": True, "message": "Password updated successfully"}
    except HTTPException:
        raise
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service temporarily unavailable. Password cannot be changed at this time."
        )

