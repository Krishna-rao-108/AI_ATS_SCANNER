from typing import List, Optional
from pydantic import BaseModel

from app.schemas.tailor import (
    ContactInfo,
    BulletComparison,
    WorkExperienceItem,
    ProjectItem,
    EducationItem,
    CertificationItem,
    SkillsCategory,
    TailoredResumeData,
    ResumeTailorRequest,
    TailoredBullet,
    ResumeTailorResponse,
    DownloadTailoredDocumentRequest,
)


class AnalysisCreate(BaseModel):
    resume_id: int
    jd_id: Optional[int] = None
    analysis_type: Optional[str] = None


class AnalysisResponse(BaseModel):
    id: int
    resume_id: int
    jd_id: Optional[int] = None
    analysis_type: Optional[str] = "job_match"
    result: str


class AnalysisHistoryItem(BaseModel):
    id: int
    resume_id: int
    jd_id: Optional[int] = None
    analysis_type: Optional[str] = "job_match"
    resume_title: Optional[str] = None
    jd_title: Optional[str] = None
    result: str


class CoverLetterRequest(BaseModel):
    resume_id: int
    job_title: str
    company_name: str
    job_description: str
    tone: Optional[str] = "professional"


class CoverLetterResponse(BaseModel):
    resume_id: int
    job_title: str
    company_name: str
    tone: str
    candidate_name: Optional[str] = None
    recipient: Optional[str] = None
    opening_paragraph: Optional[str] = None
    evidence_paragraph: Optional[str] = None
    contribution_paragraph: Optional[str] = None
    closing_paragraph: Optional[str] = None
    sign_off: Optional[str] = None
    cover_letter: str
    key_qualifications_addressed: List[str] = []
    verified_skills_referenced: List[str] = []
    unsupported_skills_avoided: List[str] = []
    word_count: Optional[int] = None