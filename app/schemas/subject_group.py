from pydantic import BaseModel, ConfigDict

class SubjectGroupCreate(BaseModel):
    name: str
    subjects: list[str]

class SubjectGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    subjects: list[str]
