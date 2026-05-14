from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, Enum
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class FileTypeEnum(str, enum.Enum):
    TRANSCRIPT = "TRANSCRIPT"
    CCCD_FRONT = "CCCD_FRONT"
    CCCD_BACK = "CCCD_BACK"
    CERTIFICATE = "CERTIFICATE"


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(
        Integer,
        ForeignKey("applications.id", ondelete="CASCADE")
    )

    file_url = Column(String(1000))

    file_type = Column(Enum(FileTypeEnum))

    file_size = Column(Integer)

    uploaded_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )