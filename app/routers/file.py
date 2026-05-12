from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException, Form
import cloudinary.uploader

from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload")
def upload_file(
    file: UploadFile = FastAPIFile(...),
    file_type: str = Form(...),
    current_user: User = Depends(get_current_user)
):

    # Validate loại file
    allowed_types = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type"
        )

    # Đọc file
    content = file.file.read()

    # Validate size (5MB)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large"
        )

    # Upload Cloudinary
    result = cloudinary.uploader.upload(content)

    file_url = result.get("secure_url")

    return {
        "file_url": file_url,
        "file_type": file_type
    }