from fastapi import FastAPI
from fastapi.responses import FileResponse

from app.routers import auth, application, school, major,subject_group

app = FastAPI()

app.include_router(auth.router)
app.include_router(application.router)
app.include_router(school.router)
app.include_router(major.router)
app.include_router(subject_group.router)

@app.get("/favicon.ico")
def favicon():
    return FileResponse("favicon.ico")

@app.get("/")
def root():
    return {"message": "Admission System API running "}