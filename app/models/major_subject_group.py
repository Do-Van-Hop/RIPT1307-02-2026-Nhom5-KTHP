from sqlalchemy import Column, Integer, ForeignKey
from app.db.database import Base


class MajorSubjectGroup(Base):
    __tablename__ = "major_subject_groups"

    id = Column(Integer, primary_key=True, index=True)
    major_id = Column(Integer, ForeignKey("majors.id"))
    subject_group_id = Column(Integer, ForeignKey("subject_groups.id"))