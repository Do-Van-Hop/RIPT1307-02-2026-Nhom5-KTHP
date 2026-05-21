from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    candidate = "candidate"
    
class User(Base):
    __tablename__ = "users"
    
    id  = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())