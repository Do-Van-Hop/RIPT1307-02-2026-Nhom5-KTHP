from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.user import User
from app.models.major import Major
from app.models.major_subject_group import MajorSubjectGroup
from app.schemas.application import ApplicationCreate, ApplicationResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])

# Tạo hồ sơ mới
@router.post("/", response_model=ApplicationResponse)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Check major có thuộc school không
    major = db.query(Major).filter(
        Major.id == data.major_id,
        Major.school_id == data.school_id
    ).first()

    if not major:
        raise HTTPException(status_code=400, detail="Major does not belong to this school")

    # 2. Check subject_group có thuộc major không
    valid_group = db.query(MajorSubjectGroup).filter(
        MajorSubjectGroup.major_id == data.major_id,
        MajorSubjectGroup.subject_group_id == data.subject_group_id
    ).first()

    if not valid_group:
        raise HTTPException(status_code=400, detail="Invalid subject group for this major")

    # 3. Tạo hồ sơ
    app = Application(
        user_id=current_user.id,
        school_id=data.school_id,
        major_id=data.major_id,
        subject_group_id=data.subject_group_id,

        full_name=data.full_name,
        dob=data.dob,
        phone=data.phone,

        score=data.score,
        priority=data.priority,
        status=ApplicationStatus.DRAFT
    )

    db.add(app)
    db.commit()
    db.refresh(app)

    return app

# Xem hồ sơ của bản thân
@router.get("/my")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Application).filter(
        Application.user_id == current_user.id
    ).all()
    
# Nộp hồ sơ (chuyển trạng thái từ DRAFT sang SUBMITTED)
@router.put("/{app_id}/submit")
def submit_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.status != ApplicationStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Already submitted")

    app.status = ApplicationStatus.PENDING

    db.commit()

    return {"message": "Application submitted"}