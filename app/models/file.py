from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.db.database import Base


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(Integer, ForeignKey("applications.id"))
    file_url = Column(String(500))
    file_type = Column(String(50))
    file_size = Column(Integer)

    uploaded_at = Column(TIMESTAMP, server_default=func.now())