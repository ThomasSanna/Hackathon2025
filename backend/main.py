"""
FastAPI application - Main entry point.

This backend provides:
1. Username-based authentication (no password required)
2. JWT token generation for authenticated sessions
3. Per-user configuration storage as JSON

How to run:
    uvicorn main:app --reload --port 8000

API will be available at:
    - http://localhost:8000
    - Docs: http://localhost:8000/docs
    - ReDoc: http://localhost:8000/redoc
"""
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth_router, config_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="User Config API",
    description="Simple authentication and configuration management system",
    version="1.0.0"
)

# ============================================================================
# CORS Configuration
# ============================================================================
# Allow frontend (React) to make requests from different origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://localhost:4321",  # Astro development server
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers including Authorization, Content-Type
)

# ============================================================================
# Include Routers
# ============================================================================
app.include_router(auth_router, prefix="/api")
app.include_router(config_router, prefix="/api")

# ============================================================================
# Root Endpoint
# ============================================================================
@app.get("/")
def root():
    """
    Root endpoint - API information.
    """
    return {
        "message": "User Config API",
        "version": "1.0.0",
        "endpoints": {
            "login": "POST /auth/login",
            "get_config": "GET /config (requires auth)",
            "save_config": "POST /config (requires auth)",
            "docs": "/docs"
        }
    }

# ============================================================================
# Health Check
# ============================================================================
@app.get("/health")
def health_check():
    """
    Health check endpoint - verify API is running.
    """
    return {"status": "healthy"}

"""
============================================================================
FRONTEND INTEGRATION EXAMPLES
============================================================================

1. Login and get token:
    
    fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: 'john_doe'
        })
    })
    .then(res => res.json())
    .then(data => {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        console.log('Logged in as:', data.user.username);
    });

2. Save configuration:
    
    const token = localStorage.getItem('token');
    
    fetch('http://localhost:8000/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            config: {
                theme: 'dark',
                font: 'Arial',
                espace_mot: 5,
                dyslexie: {
                    alternement_typo: true
                }
            }
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log('Config saved:', data.message);
    });

3. Get configuration:
    
    const token = localStorage.getItem('token');
    
    fetch('http://localhost:8000/config', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log('User config:', data.config);
        // Apply config to UI
    });

============================================================================
CURL EXAMPLES
============================================================================

1. Login:
    curl -X POST http://localhost:8000/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username": "john_doe"}'

2. Save config (replace YOUR_TOKEN):
    curl -X POST http://localhost:8000/config \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_TOKEN" \
      -d '{"config": {"theme": "dark", "font": "Arial"}}'

3. Get config (replace YOUR_TOKEN):
    curl -X GET http://localhost:8000/config \
      -H "Authorization: Bearer YOUR_TOKEN"

============================================================================
"""
