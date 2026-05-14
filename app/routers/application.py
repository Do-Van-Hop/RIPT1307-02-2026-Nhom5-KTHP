from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.models.application import (
    Application,
    ApplicationStatus
)

from app.models.user import User
from app.models.major import Major
from app.models.major_subject_group import MajorSubjectGroup
from app.models.file import File

from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationDetailResponse,
    ApplicationUpdate,
    ApplicationStatusUpdate
)

from app.core.deps import (
    get_current_user,
    require_admin
)

from app.services.email_service import send_email

router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)

@router.post("/", response_model=ApplicationResponse)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    major = db.query(Major).filter(
        Major.id == data.major_id,
        Major.school_id == data.school_id
    ).first()

    if not major:
        raise HTTPException(
            status_code=400,
            detail="Major does not belong to this school"
        )

    valid_group = db.query(MajorSubjectGroup).filter(
        MajorSubjectGroup.major_id == data.major_id,
        MajorSubjectGroup.subject_group_id == data.subject_group_id
    ).first()

    if not valid_group:
        raise HTTPException(
            status_code=400,
            detail="Invalid subject group for this major"
        )

    app = Application(
        user_id=current_user.id,

        school_id=data.school_id,
        major_id=data.major_id,
        subject_group_id=data.subject_group_id,

        full_name=data.full_name,
        dob=data.dob,
        phone=data.phone,

        cccd_number=data.cccd_number,

        score=data.score,
        scores=data.scores,
        priority=data.priority,

        status=ApplicationStatus.DRAFT
    )

    db.add(app)
    db.commit()
    db.refresh(app)

    for item in data.files:

        new_file = File(
            application_id=app.id,
            file_url=item.file_url,
            file_type=item.file_type,
            file_size=None
        )

        db.add(new_file)

    db.commit()

    return app

@router.get("/my")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    applications = db.query(Application).filter(
        Application.user_id == current_user.id
    ).all()

    return applications

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
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # Chỉ submit khi đang draft
    if app.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=400,
            detail="Application already submitted"
        )

    app.status = ApplicationStatus.PENDING

    db.commit()

    return {
        "message": "Application submitted"
    }

# filter, phân trang application (admin)
@router.get("/")
def get_applications(
    status: str | None = Query(default=None),
    school_id: int | None = Query(default=None),
    major_id: int | None = Query(default=None),

    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),

    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    query = db.query(Application)

    if status:
        query = query.filter(
            Application.status == status
        )

    if school_id:
        query = query.filter(
            Application.school_id == school_id
        )
        
    if major_id:
        query = query.filter(
            Application.major_id == major_id
        )

    total = query.count()

    offset = (page - 1) * limit

    applications = query.offset(offset).limit(limit).all()

    return {
        "items": applications,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get(
    "/{app_id}",
    response_model=ApplicationDetailResponse
)
def get_application_detail(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    app = db.query(Application).filter(
        Application.id == app_id
    ).first()

    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    if current_user.role.value == "admin":
        return app

    if app.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Permission denied"
        )

    return app

@router.put(
    "/{app_id}",
    response_model=ApplicationResponse
)
def update_application(
    app_id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    if app.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=400,
            detail="Only DRAFT application can be edited"
        )

    major = db.query(Major).filter(
        Major.id == data.major_id,
        Major.school_id == data.school_id
    ).first()

    if not major:
        raise HTTPException(
            status_code=400,
            detail="Major does not belong to this school"
        )

    valid_group = db.query(MajorSubjectGroup).filter(
        MajorSubjectGroup.major_id == data.major_id,
        MajorSubjectGroup.subject_group_id == data.subject_group_id
    ).first()

    if not valid_group:
        raise HTTPException(
            status_code=400,
            detail="Invalid subject group for this major"
        )

    app.school_id = data.school_id
    app.major_id = data.major_id
    app.subject_group_id = data.subject_group_id

    app.full_name = data.full_name
    app.dob = data.dob
    app.phone = data.phone

    app.cccd_number = data.cccd_number

    app.score = data.score
    app.scores = data.scores
    app.priority = data.priority

    db.query(File).filter(
        File.application_id == app.id
    ).delete()

    for item in data.files:

        new_file = File(
            application_id=app.id,
            file_url=item.file_url,
            file_type=item.file_type,
            file_size=None
        )

        db.add(new_file)

    db.commit()

    db.refresh(app)

    return app

@router.delete("/{app_id}")
def delete_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    if app.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=400,
            detail="Only DRAFT application can be deleted"
        )

    db.delete(app)

    db.commit()

    return {
        "message": "Application deleted successfully"
    }
    
@router.patch("/admin/{app_id}/status")
def update_application_status(
    app_id: int,
    data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    app = db.query(Application).filter(
        Application.id == app_id
    ).first()

    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    if app.status != ApplicationStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Only PENDING application can change status"
        )

    allowed_status = [
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED
    ]

    try:
        new_status = ApplicationStatus(data.status)

    except:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    if new_status not in allowed_status:
        raise HTTPException(
            status_code=400,
            detail="Status not allowed"
        )

    app.status = new_status

    if new_status == ApplicationStatus.REJECTED:

        if not data.reason:
            raise HTTPException(
                status_code=400,
                detail="Reject reason is required"
            )

        app.reject_reason = data.reason

    else:

        app.reject_reason = None

    db.commit()
    db.refresh(app)

    user = db.query(User).filter(
        User.id == app.user_id
    ).first()

    try:

        if new_status == ApplicationStatus.APPROVED:

            send_email(
                to_email=user.email,
                subject="Hồ sơ đã được duyệt",
                body="Chúc mừng! Hồ sơ của bạn đã được duyệt."
            )

        else:

            reason_text = data.reason or "Không có lý do cụ thể"

            send_email(
                to_email=user.email,
                subject="Hồ sơ bị từ chối",
                body=f"Hồ sơ của bạn bị từ chối.\nLý do: {reason_text}"
            )

    except Exception as e:
        print("Send email error:", e)

    return {
        "message": "Application status updated",
        "new_status": app.status
    }