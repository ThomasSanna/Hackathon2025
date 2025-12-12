"""
API routes for authentication and configuration management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import json

from database import get_db
from models import User, UserConfig
from schemas import LoginRequest, LoginResponse, ConfigRequest, ConfigResponse, UserResponse
from auth import create_access_token, get_current_user

# Create routers
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
config_router = APIRouter(prefix="/config", tags=["Configuration"])

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@auth_router.post("/login", response_model=LoginResponse, status_code=200)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login or create user with username only (no password).
    
    Flow:
    1. Frontend sends username via POST /auth/login
    2. If username doesn't exist, create new user
    3. Generate JWT token for this user
    4. Return user info + token
    5. Frontend stores token and uses it in Authorization header
    
    Example request:
        POST /auth/login
        {
            "username": "john_doe"
        }
        
    Example response:
        {
            "user": {
                "id": 1,
                "username": "john_doe"
            },
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
    """
    username = request.username
    
    # Validate username
    if not username or len(username.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty"
        )
    
    # Check if user exists, create if not
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        # Create new user
        user = User(username=username)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Generate JWT token
    token_data = {
        "user_id": user.id,
        "username": user.username
    }
    token = create_access_token(token_data)
    
    return LoginResponse(
        user=UserResponse(id=user.id, username=user.username),
        token=token
    )

# ============================================================================
# CONFIGURATION ROUTES (Protected)
# ============================================================================

@config_router.post("", response_model=ConfigResponse, status_code=200)
def save_config(
    request: ConfigRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save or update user configuration.
    Protected route - requires valid JWT token.
    
    Frontend usage:
    1. Include Authorization header: "Bearer <token>"
    2. Send configuration as JSON object
    3. Configuration is stored/updated for the authenticated user
    
    Example request:
        POST /config
        Headers:
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        Body:
            {
                "config": {
                    "theme": "dark",
                    "font": "Arial",
                    "espace_mot": 5,
                    "dyslexie": {
                        "alternement_typo": true
                    }
                }
            }
            
    Example response:
        {
            "user": {
                "id": 1,
                "username": "john_doe"
            },
            "config": {
                "theme": "dark",
                "font": "Arial",
                ...
            },
            "message": "Configuration saved successfully"
        }
    """
    # Validate that at least config or favorites is provided
    if not request.config and request.favorites is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either config or favorites"
        )
    
    # Check if user already has a configuration
    existing_config = db.query(UserConfig).filter(
        UserConfig.user_id == current_user.id
    ).first()
    
    if existing_config:
        # Update existing configuration
        if request.config:
            config_json = json.dumps(request.config)
            existing_config.config = config_json
        
        if request.favorites is not None:
            favorites_json = json.dumps(request.favorites)
            existing_config.favorites = favorites_json
        
        existing_config.updated_at = datetime.utcnow()
        
        # Get the current values for response
        response_config = json.loads(existing_config.config) if existing_config.config else None
        response_favorites = json.loads(existing_config.favorites) if existing_config.favorites else None
    else:
        # Create new configuration with provided values
        config_json = json.dumps(request.config) if request.config else None
        favorites_json = json.dumps(request.favorites) if request.favorites is not None else None
        
        new_config = UserConfig(
            user_id=current_user.id,
            config=config_json,
            favorites=favorites_json
        )
        db.add(new_config)
        
        response_config = request.config
        response_favorites = request.favorites
    
    db.commit()
    
    return ConfigResponse(
        user=UserResponse(id=current_user.id, username=current_user.username),
        config=response_config,
        favorites=response_favorites,
        message="Configuration saved successfully"
    )

@config_router.get("", response_model=ConfigResponse, status_code=200)
def get_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve user configuration.
    Protected route - requires valid JWT token.
    
    Frontend usage:
    1. Include Authorization header: "Bearer <token>"
    2. Receive user's saved configuration
    3. If no configuration exists, config will be null
    
    Example request:
        GET /config
        Headers:
            Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            
    Example response (with config):
        {
            "user": {
                "id": 1,
                "username": "john_doe"
            },
            "config": {
                "theme": "dark",
                "font": "Arial",
                ...
            }
        }
        
    Example response (no config):
        {
            "user": {
                "id": 1,
                "username": "john_doe"
            },
            "config": null
        }
    """
    # Look up user's configuration
    user_config = db.query(UserConfig).filter(
        UserConfig.user_id == current_user.id
    ).first()
    
    # Parse JSON config and favorites if exists
    config_data = None
    favorites_data = None
    if user_config:
        config_data = json.loads(user_config.config) if user_config.config else None
        favorites_data = json.loads(user_config.favorites) if user_config.favorites else None
    
    return ConfigResponse(
        user=UserResponse(id=current_user.id, username=current_user.username),
        config=config_data,
        favorites=favorites_data
    )
