from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException
from sqlalchemy.orm import Session
import cloudinary.uploader

from app.db.database import get_db
from app.models.file import File
from app.models.application import Application
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/files", tags=["Files"])

# Upload file
@router.post("/upload/{application_id}")
def upload_file(
    application_id: int,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check application thuộc user
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Chỉ cho upload khi DRAFT
    if app.status != "DRAFT":
        raise HTTPException(status_code=400, detail="Cannot upload after submit")

    # Validate type
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]

    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Validate size (max 5MB)
    content = file.file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    # Upload lên Cloudinary
    result = cloudinary.uploader.upload(content)

    file_url = result.get("secure_url")

    # Lưu DB
    new_file = File(
        application_id=application_id,
        file_url=file_url,
        file_type=file.content_type,
        file_size=len(content)
    )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    return {
        "file_url": file_url
    }