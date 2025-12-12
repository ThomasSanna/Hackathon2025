"""
Database setup and session management for SQLite.
Creates a local file-based database: users.db
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite database URL - creates a file in the current directory
SQLALCHEMY_DATABASE_URL = "sqlite:///./users.db"

# Create engine with SQLite-specific settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Session factory for database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# Dependency to get database session
def get_db():
    """
    Provides a database session for each request.
    Automatically closes the session after the request completes.
    
    Usage in FastAPI routes:
        def my_route(db: Session = Depends(get_db)):
            # Use db to query database
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
