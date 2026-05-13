from pydantic import BaseModel, ConfigDict

class SchoolCreate(BaseModel):
    name: str

class SchoolResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
