"""
Database models for User and UserConfig tables.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    """
    User model - stores basic user information.
    One user can have one configuration.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship to UserConfig (one-to-one)
    config = relationship("UserConfig", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserConfig(Base):
    """
    UserConfig model - stores JSON configuration per user.
    One configuration per user (enforced by unique user_id).
    """
    __tablename__ = "user_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    config = Column(Text, nullable=True)  # Stores JSON as text (nullable to allow favorites-only)
    favorites = Column(Text, nullable=True)  # Stores favorite document IDs as JSON array text
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship to User
    user = relationship("User", back_populates="config")
