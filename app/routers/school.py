from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.school import School
from app.schemas.school import SchoolCreate, SchoolResponse

router = APIRouter(prefix="/schools", tags=["Schools"])


@router.post("/", response_model=SchoolResponse)
def create_school(data: SchoolCreate, db: Session = Depends(get_db)):
    school = School(name=data.name)
    db.add(school)
    db.commit()
    db.refresh(school)
    return school


@router.get("/", response_model=list[SchoolResponse])
def get_schools(db: Session = Depends(get_db)):
    return db.query(School).all()