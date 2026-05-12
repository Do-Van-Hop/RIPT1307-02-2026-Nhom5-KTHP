from pydantic import BaseModel

class FileItem(BaseModel):
    file_url: str
    file_type: str

class FileResponse(BaseModel):
    id: int
    file_url: str
    file_type: str
    file_size: int

    class Config:
        from_attributes = True