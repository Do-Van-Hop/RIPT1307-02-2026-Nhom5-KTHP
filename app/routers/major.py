from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.major import Major
from app.models.major_subject_group import MajorSubjectGroup
from app.models.subject_group import SubjectGroup

from app.schemas.major import MajorCreate, MajorResponse

router = APIRouter(prefix="/majors", tags=["Majors"])

# Tạo ngành mới
@router.post("/", response_model=MajorResponse)
def create_major(data: MajorCreate, db: Session = Depends(get_db)):
    major = Major(name=data.name, school_id=data.school_id)
    db.add(major)
    db.commit()
    db.refresh(major)
    return major

# Gán tổ hợp môn cho ngành
@router.post("/{major_id}/assign-group/{group_id}")
def assign_group(major_id: int, group_id: int, db: Session = Depends(get_db)):
    
    # check tồn tại
    major = db.query(Major).filter(Major.id == major_id).first()
    group = db.query(SubjectGroup).filter(SubjectGroup.id == group_id).first()

    if not major or not group:
        raise HTTPException(status_code=404, detail="Major or Group not found")

    mapping = MajorSubjectGroup(
        major_id=major_id,
        subject_group_id=group_id
    )

    db.add(mapping)
    db.commit()

    return {"message": "Assigned successfully"}

# Lấy danh sách ngành theo trường
@router.get("/by-school/{school_id}")
def get_majors_by_school(school_id: int, db: Session = Depends(get_db)):
    return db.query(Major).filter(Major.school_id == school_id).all()

# Lấy tổ hợp môn của ngành
@router.get("/{major_id}/subject-groups")
def get_groups_by_major(major_id: int, db: Session = Depends(get_db)):
    return db.query(SubjectGroup).join(
        MajorSubjectGroup,
        SubjectGroup.id == MajorSubjectGroup.subject_group_id
    ).filter(
        MajorSubjectGroup.major_id == major_id
    ).all()
