from sqlalchemy import Column, Integer, String
from app.db.database import Base

class SubjectGroup(Base):
    __tablename__ = "subject_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)