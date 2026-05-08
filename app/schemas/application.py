from pydantic import BaseModel
from datetime import date
from typing import Optional


class ApplicationCreate(BaseModel):
    school_id: int
    major_id: int
    subject_group_id: int

    full_name: str
    dob: date
    phone: str

    score: float
    priority: int


class ApplicationResponse(BaseModel):
    id: int
    full_name: str
    status: str

    class Config:
        from_attributes = True