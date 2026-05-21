from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.database import get_db
from app.models.school import School
from app.models.user import User
from app.models.major import Major
from app.schemas import school
from app.schemas.school import SchoolCreate, SchoolResponse

router = APIRouter(prefix="/schools", tags=["Schools"])


@router.post("/", response_model=SchoolResponse)
def create_school(
    data: SchoolCreate, 
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
    ):
    school = School(name=data.name)
    db.add(school)
    db.commit()
    db.refresh(school)
    return school


@router.get("/", response_model=list[SchoolResponse])
def get_schools(db: Session = Depends(get_db)):
    return db.query(School).all()

@router.get("/{school_id}", response_model=SchoolResponse)
def get_school_by_id(
    school_id: int,
    db: Session = Depends(get_db)
):

    school = db.query(School).filter(
        School.id == school_id
    ).first()

    if not school:
        raise HTTPException(
            status_code=404,
            detail="School not found"
        )

    return school

@router.put("/{school_id}", response_model=SchoolResponse)
def update_school(
    school_id: int,
    data: SchoolCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    school = db.query(School).filter(
        School.id == school_id
    ).first()

    if not school:
        raise HTTPException(
            status_code=404,
            detail="School not found"
        )

    school.name = data.name

    db.commit()
    db.refresh(school)

    return school

@router.delete("/{school_id}")
def delete_school(
    school_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    school = db.query(School).filter(
        School.id == school_id
    ).first()

    if not school:
        raise HTTPException(
            status_code=404,
            detail="School not found"
        )
    major_exists = db.query(Major).filter(
        Major.school_id == school.id
    ).first()

    if major_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete school with majors"
        )        

    db.delete(school)

    db.commit()

    return {
        "message": "School deleted successfully"
    }