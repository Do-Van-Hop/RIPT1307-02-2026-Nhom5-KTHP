from fastapi import FastAPI

from app.routers import auth, application, school, major,subject_group

app = FastAPI()

app.include_router(auth.router)
app.include_router(application.router)
app.include_router(school.router)
app.include_router(major.router)
app.include_router(subject_group.router)

@app.get("/")
def root():
    return {"message": "Admission System API running "}