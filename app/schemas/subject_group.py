from pydantic import BaseModel

class SubjectGroupCreate(BaseModel):
    name: str

class SubjectGroupResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True