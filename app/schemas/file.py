from pydantic import BaseModel


class FileResponse(BaseModel):
    id: int
    file_url: str
    file_type: str
    file_size: int

    class Config:
        from_attributes = True