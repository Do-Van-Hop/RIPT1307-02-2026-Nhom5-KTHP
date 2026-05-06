from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Major(Base):
    __tablename__ = "majors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"))