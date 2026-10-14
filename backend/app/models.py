from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, BigInteger, 
    Enum, ForeignKey, Float, UniqueConstraint, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    email = Column(String(190), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    plan = Column(Enum('free', 'pro', 'enterprise', name='plan_enum'), default='free', nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    # Relationship to refresh tokens
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationship to user
    user = relationship("User", back_populates="refresh_tokens")

class Geocode(Base):
    __tablename__ = "geocodes"
    
    city = Column(String(100), primary_key=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    country = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Measurement(Base):
    __tablename__ = "measurements"
    
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    ts = Column(DateTime, nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    pm25 = Column(Float, nullable=True)
    pm10 = Column(Float, nullable=True)
    source = Column(String(50), nullable=False, index=True)
    
    __table_args__ = (
        UniqueConstraint("ts", "city", "source", name="uq_ts_city_source"),
        Index("idx_city_source_ts", "city", "source", "ts"),
    )


