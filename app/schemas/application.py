from pydantic import BaseModel, ConfigDict
from datetime import date

from app.schemas.file import FileItem, FileResponse

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
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    status: str
    cccd_number: str

class ApplicationDetailResponse(BaseModel):

    id: int
    school_id: int
    major_id: int
    subject_group_id: int
    full_name: str
    dob: date
    phone: str
    cccd_number: str
    score: float
    priority: int
    status: str
    files: list[FileResponse]
    reject_reason: str | None = None
    model_config = ConfigDict(
        from_attributes=True
    )
    
class ApplicationUpdate(BaseModel):

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
    
class ApplicationStatusUpdate(BaseModel):
    status: str
    reason: str | None = None