from pydantic import BaseModel
from datetime import date

from app.schemas.file import FileItem

class ApplicationCreate(BaseModel):

    school_id: int
    major_id: int
    subject_group_id: int
    full_name: str
    dob: date
    phone: str
    cccd_number: str
    score: float
    priority: int
    files: list[FileItem]

class ApplicationResponse(BaseModel):
    id: int
    full_name: str
    status: str
    cccd_number: str
    class Config:
        from_attributes = True