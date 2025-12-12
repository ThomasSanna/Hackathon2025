"""
Authentication utilities: JWT token generation and verification.

How it works:
1. User logs in with username via POST /auth/login
2. Server generates a JWT token containing user_id and username
3. Frontend stores this token (e.g., in localStorage)
4. Frontend sends token in Authorization header: "Bearer <token>"
5. Protected routes verify the token and extract user information
"""
from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User

# JWT Configuration from environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "168"))  # 7 days default

# Security scheme for FastAPI docs
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Generate a JWT token with user information.
    
    Args:
        data: Dictionary containing user_id and username
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """
    Verify JWT token and extract payload.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload containing user_id and username
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        username: str = payload.get("username")
        
        if user_id is None or username is None:
            raise credentials_exception
            
        return {"user_id": user_id, "username": username}
    except JWTError:
        raise credentials_exception

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency for protected routes.
    Extracts and verifies the JWT token from Authorization header.
    
    Usage in routes:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            # current_user is the authenticated User object
            
    Args:
        credentials: Bearer token from Authorization header
        db: Database session
        
    Returns:
        Authenticated User object
        
    Raises:
        HTTPException 401: If token is missing, invalid, or user doesn't exist
    """
    token = credentials.credentials
    token_data = verify_token(token)
    
    # Verify user still exists in database
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user
