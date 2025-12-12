"""
Pydantic schemas for request/response validation.
These define the structure of JSON data sent to/from the API.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime

# === Request Schemas ===

class LoginRequest(BaseModel):
    """Request body for POST /auth/login"""
    username: str = Field(..., min_length=1, description="Username for login/registration")
    
    @validator('username')
    def normalize_username(cls, v):
        """Trim whitespace from username"""
        return v.strip()

class ConfigRequest(BaseModel):
    """Request body for POST /config"""
    config: Optional[Dict[str, Any]] = Field(default=None, description="User configuration as JSON object")
    favorites: Optional[list[str]] = Field(default=None, description="List of favorite document IDs")

# === Response Schemas ===

class UserResponse(BaseModel):
    """Basic user information returned in responses"""
    id: int
    username: str
    
    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    """Response for POST /auth/login"""
    user: UserResponse
    token: str = Field(..., description="JWT token for authenticated requests")

class ConfigResponse(BaseModel):
    """Response for GET /config and POST /config"""
    user: UserResponse
    config: Optional[Dict[str, Any]] = None
    favorites: Optional[list[str]] = None
    message: Optional[str] = None

class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str
