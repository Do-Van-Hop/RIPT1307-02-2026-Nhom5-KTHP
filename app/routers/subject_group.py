from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.database import get_db
from app.models.application import Application
from app.models.major_subject_group import MajorSubjectGroup
from app.models.subject_group import SubjectGroup
from app.models.user import User
from app.schemas.subject_group import SubjectGroupCreate, SubjectGroupResponse

router = APIRouter(prefix="/subject-groups", tags=["Subject Groups"])


@router.post("/", response_model=SubjectGroupResponse)
def create_group(data: SubjectGroupCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    group = SubjectGroup(name=data.name)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("/", response_model=list[SubjectGroupResponse])
def get_groups(db: Session = Depends(get_db)):
    return db.query(SubjectGroup).all()

@router.get("/{group_id}", response_model=SubjectGroupResponse)
def get_subject_group_by_id(
    group_id: int,
    db: Session = Depends(get_db)
):

    group = db.query(SubjectGroup).filter(
        SubjectGroup.id == group_id
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Subject group not found"
        )

    return group

@router.put("/{group_id}", response_model=SubjectGroupResponse)
def update_subject_group(
    group_id: int,
    data: SubjectGroupCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    group = db.query(SubjectGroup).filter(
        SubjectGroup.id == group_id
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Subject group not found"
        )

    group.name = data.name

    db.commit()
    db.refresh(group)

    return group

@router.delete("/{group_id}")
def delete_subject_group(
    group_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    group = db.query(SubjectGroup).filter(
        SubjectGroup.id == group_id
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Subject group not found"
        )

    # check applications
    application_exists = db.query(Application).filter(
        Application.subject_group_id == group.id
    ).first()

    if application_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete subject group with applications"
        )

    # delete mappings
    db.query(MajorSubjectGroup).filter(
        MajorSubjectGroup.subject_group_id == group.id
    ).delete()

    db.delete(group)

    db.commit()

    return {
        "message": "Subject group deleted successfully"
    }