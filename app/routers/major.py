from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.database import get_db
from app.models.application import Application
from app.models.major import Major
from app.models.major_subject_group import MajorSubjectGroup
from app.models.school import School
from app.models.subject_group import SubjectGroup

from app.models.user import User
from app.schemas.major import MajorCreate, MajorResponse

router = APIRouter(prefix="/majors", tags=["Majors"])

# Tạo ngành mới
@router.post("/", response_model=MajorResponse)
def create_major(data: MajorCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    major = Major(name=data.name, school_id=data.school_id)
    db.add(major)
    db.commit()
    db.refresh(major)
    return major

# Gán tổ hợp môn cho ngành
@router.post("/{major_id}/assign-group/{group_id}")
def assign_group(
    major_id: int, 
    group_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
    ):

    # check tồn tại
    major = db.query(Major).filter(Major.id == major_id).first()
    group = db.query(SubjectGroup).filter(SubjectGroup.id == group_id).first()

    if not major or not group:
        raise HTTPException(status_code=404, detail="Major or Group not found")
    
    # check duplicate mapping
    existing_mapping = db.query(MajorSubjectGroup).filter(
        MajorSubjectGroup.major_id == major_id,
        MajorSubjectGroup.subject_group_id == group_id
    ).first()

    if existing_mapping:
        raise HTTPException(
            status_code=400,
            detail="Group already assigned"
        )
    
    mapping = MajorSubjectGroup(
        major_id=major_id,
        subject_group_id=group_id
    )

    db.add(mapping)
    db.commit()

    return {"message": "Assigned successfully"}

# Lấy danh sách ngành theo trường
@router.get("/", response_model=list[MajorResponse])
def get_majors(
    school_id: int | None = Query(default=None),
    schoolId: int | None = Query(default=None),
    db: Session = Depends(get_db)
):
    selected_school_id = school_id or schoolId
    query = db.query(Major)

    if selected_school_id:
        query = query.filter(Major.school_id == selected_school_id)
    return query.all()

@router.get("/by-school/{school_id}", response_model=list[MajorResponse])
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

@router.get("/{major_id}", response_model=MajorResponse)
def get_major_by_id(
    major_id: int,
    db: Session = Depends(get_db)
):

    major = db.query(Major).filter(
        Major.id == major_id
    ).first()

    if not major:
        raise HTTPException(
            status_code=404,
            detail="Major not found"
        )

    return major

@router.put("/{major_id}", response_model=MajorResponse)
def update_major(
    major_id: int,
    data: MajorCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    major = db.query(Major).filter(
        Major.id == major_id
    ).first()

    if not major:
        raise HTTPException(
            status_code=404,
            detail="Major not found"
        )

    school = db.query(School).filter(
        School.id == data.school_id
    ).first()

    if not school:
        raise HTTPException(
            status_code=404,
            detail="School not found"
        )

    major.name = data.name
    major.school_id = data.school_id

    db.commit()
    db.refresh(major)

    return major

@router.delete("/{major_id}")
def delete_major(
    major_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    major = db.query(Major).filter(
        Major.id == major_id
    ).first()

    if not major:
        raise HTTPException(
            status_code=404,
            detail="Major not found"
        )

    # check applications
    application_exists = db.query(Application).filter(
        Application.major_id == major.id
    ).first()

    if application_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete major with applications"
        )
    
    #delete mapping
    db.query(MajorSubjectGroup).filter(
        MajorSubjectGroup.major_id == major.id
    ).delete()

    db.delete(major)

    db.commit()

    return {
        "message": "Major deleted successfully"
    }

@router.delete("/{major_id}/remove-group/{group_id}")
def remove_group(
    major_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    mapping = db.query(MajorSubjectGroup).filter(
        MajorSubjectGroup.major_id == major_id,
        MajorSubjectGroup.subject_group_id == group_id
    ).first()

    if not mapping:
        raise HTTPException(
            status_code=404,
            detail="Mapping not found"
        )

    db.delete(mapping)

    db.commit()

    return {
        "message": "Subject group removed from major"
    }