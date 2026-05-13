from pydantic import BaseModel, ConfigDict

class FileItem(BaseModel):
    file_url: str
    file_type: str

class FileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_url: str
    file_type: str
    file_size: int
