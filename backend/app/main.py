from sqlmodel import SQLModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ai import router as ai_router
from app.core.database import engine
from app.models.user import User
from app.api.auth import router as auth_router
from app.models.resume import Resume
from app.api.resumes import router as resume_router
from app.models.jd import JobDescription
from app.api.jd import router as jd_router
from app.models.analysis import Analysis
from app.api.analysis import router as analysis_router

app = FastAPI(
    title="AI Resume Screening API",
    description="ATS Analyzer Backend powered by FastAPI and Prune AI",
    version="1.0.0"
)
SQLModel.metadata.create_all(engine)

app.include_router(ai_router, prefix="/api/ai")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(resume_router, prefix="/api/resumes")
app.include_router(jd_router, prefix="/api/jd")
app.include_router(analysis_router, prefix="/api/analysis")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "ATS analyzer backend is running"}
