from fastapi import FastAPI
from app.routers import auth, application

app = FastAPI()

app.include_router(auth.router)
app.include_router(application.router)

@app.get("/")
def root():
    return {"message": "Admission System API running "}