from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, Enum, TIMESTAMP, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
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
    major = relationship("Major")
    subject_group_id = Column(Integer, ForeignKey("subject_groups.id"))

    full_name = Column(String(255))
    dob = Column(Date)
    phone = Column(String(20))
    
    cccd_number = Column(String(20))
    score = Column(Float)
    scores = Column(JSON)
    priority = Column(Integer)

    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT)

    created_at = Column(TIMESTAMP, server_default=func.now())
    submitted_at = Column(TIMESTAMP, nullable=True)
    reject_reason = Column(String(1000), nullable=True)
    
    files = relationship(
        "File",
        backref="application",
        cascade="all, delete"
    )