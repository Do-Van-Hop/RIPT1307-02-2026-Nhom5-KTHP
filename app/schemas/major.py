from pydantic import BaseModel, ConfigDict

class MajorCreate(BaseModel):
    name: str
    school_id: int

class MajorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    school_id: int
