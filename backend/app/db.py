# app/db.py
import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

load_dotenv()

logger = logging.getLogger("airq")

HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
PORT = os.getenv("MYSQL_PORT", "3306")
DB   = os.getenv("MYSQL_DB", "airq")
USER = os.getenv("MYSQL_USER", "root")
PWD  = os.getenv("MYSQL_PASSWORD", "")

URL = os.getenv("DATABASE_URL") or f"mysql+pymysql://{USER}:{PWD}@{HOST}:{PORT}/{DB}?charset=utf8mb4"

connect_args = {"check_same_thread": False} if URL.startswith("sqlite") else {}
engine = create_engine(URL, connect_args=connect_args, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def init_db():
    """Create tables if they do not exist, without modifying or deleting existing data."""
    Base.metadata.create_all(bind=engine)

# Safe table creation on module initialization
try:
    init_db()
except Exception as e:
    logger.warning("Database connection/table creation warning on startup: %s", e)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

