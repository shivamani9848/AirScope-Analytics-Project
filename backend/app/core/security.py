from typing import Optional, Literal, Dict, Any
from datetime import datetime, timedelta, timezone
from fastapi import Request, Header, HTTPException, Depends
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from passlib.context import CryptContext
from .config import settings

Plan = Literal["free", "pro", "enterprise"]

import bcrypt

def require_api_key(req: Request):
    if req.headers.get("X-API-KEY") != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Missing or invalid API key")

def hash_password(plain: str) -> str:
    """Hash a plain text password using bcrypt with cryptographic salt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode('utf-8')[:72], salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain text password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode('utf-8')[:72], hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(payload: Dict[str, Any], expires_minutes: int) -> str:
    """Create a signed JWT access token with expiration and issued-at timestamps."""
    now = datetime.now(timezone.utc)
    to_encode = payload.copy()
    expire = now + timedelta(minutes=expires_minutes)
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and cryptographically verify a JWT access token using HS256."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]}
        )
        return payload
    except (ExpiredSignatureError, InvalidTokenError):
        return None

def get_auth_user(request: Request) -> Optional[Dict[str, Any]]:
    """Get authenticated user from HttpOnly cookie or Bearer Authorization header."""
    # 1. Check HttpOnly cookie first (preferred browser security model)
    token = request.cookies.get("airsense_access")
    
    # 2. Check Authorization Bearer header (for API / CLI clients)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if token:
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            return {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "plan": (payload.get("plan") or "free").lower()
            }
    
    return None

def require_auth_user(request: Request) -> Dict[str, Any]:
    """Dependency that mandates authenticated user credentials."""
    user = get_auth_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in.")
    return user

def get_plan(request: Request) -> Plan:
    """
    Get verified subscription plan strictly from authenticated user token/session.
    Unauthenticated requests strictly default to 'free' to prevent client-side privilege escalation.
    """
    user = get_auth_user(request)
    if user and user.get("plan"):
        plan = str(user["plan"]).strip().lower()
        if plan in {"free", "pro", "enterprise"}:
            return plan  # type: ignore
    return "free"
