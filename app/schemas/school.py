from pydantic import BaseModel

class SchoolCreate(BaseModel):
    name: str

class SchoolResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True