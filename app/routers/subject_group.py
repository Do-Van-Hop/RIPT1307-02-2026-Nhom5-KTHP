from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.subject_group import SubjectGroup
from app.schemas.subject_group import SubjectGroupCreate, SubjectGroupResponse

router = APIRouter(prefix="/subject-groups", tags=["Subject Groups"])


@router.post("/", response_model=SubjectGroupResponse)
def create_group(data: SubjectGroupCreate, db: Session = Depends(get_db)):
    group = SubjectGroup(name=data.name)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("/", response_model=list[SubjectGroupResponse])
def get_groups(db: Session = Depends(get_db)):
    return db.query(SubjectGroup).all()