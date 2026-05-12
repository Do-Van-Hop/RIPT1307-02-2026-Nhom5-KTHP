from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, Enum, TIMESTAMP
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    school_id = Column(Integer, ForeignKey("schools.id"))
    major_id = Column(Integer, ForeignKey("majors.id"))
    subject_group_id = Column(Integer, ForeignKey("subject_groups.id"))

    full_name = Column(String(255))
    dob = Column(Date)
    phone = Column(String(20))
    
    cccd_number = Column(String(20))

    score = Column(Float)
    priority = Column(Integer)

    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT)

    created_at = Column(TIMESTAMP, server_default=func.now())