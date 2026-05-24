from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db

from app.models.application import Application
from app.models.school import School
from app.models.major import Major

from app.models.user import User
from app.core.deps import require_admin

router = APIRouter(
    prefix="/stats",
    tags=["Stats"]
)


@router.get("/")
def get_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):

    #thống kê theo status
    by_status = db.query(
        Application.status,
        func.count(Application.id).label("total")
    ).group_by(
        Application.status
    ).all()

    # thống kê theo school
    by_school = db.query(
        School.name,
        func.count(Application.id).label("total")
    ).join(
        Application,
        Application.school_id == School.id
    ).group_by(
        School.id
    ).all()
    
    # thống kê theo major
    by_major = db.query(
        Major.name,
        func.count(Application.id).label("total")
    ).join(
        Application,
        Application.major_id == Major.id
    ).group_by(
        Major.id
    ).all()

    return {

        "byStatus": [
            {
                "status": item.status,
                "total": item.total
            }
            for item in by_status
        ],

        "bySchool": [
            {
                "school": item.name,
                "total": item.total
            }
            for item in by_school
        ],

        "byMajor": [
            {
                "major": item.name,
                "total": item.total
            }
            for item in by_major
        ]
    }

    