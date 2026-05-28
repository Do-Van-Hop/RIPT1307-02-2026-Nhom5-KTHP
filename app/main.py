from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.cloudinary_config import init_cloudinary

from app.routers import auth, application, school, major, subject_group, file, stats


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tuyensinh.netlify.app",
        "http://localhost:5173"
    ], # Trong thực tế nên để url cụ thể của FE
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_cloudinary()

app.include_router(auth.router)
app.include_router(application.router)
app.include_router(school.router)
app.include_router(major.router)
app.include_router(subject_group.router)
app.include_router(file.router)
app.include_router(stats.router)

@app.get("/")
def root():
    return {"message": "Admission System API running "}
