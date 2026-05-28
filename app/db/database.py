import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL

DATABASE_URL = os.getenv("DATABASE_URL")

connect_args = {}
if 'aivencloud.com' in DATABASE_URL:
    connect_args = {
        "ssl": {
            "ca": "./ca.pem"
        }
    }

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# Dependency dùng trong API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()