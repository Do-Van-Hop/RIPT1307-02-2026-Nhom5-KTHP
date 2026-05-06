from pydantic import BaseModel

class MajorCreate(BaseModel):
    name: str
    school_id: int

class MajorResponse(BaseModel):
    id: int
    name: str
    school_id: int

    class Config:
        from_attributes = True