from typing import List, Optional
from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    name: str = "Candidate"
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    portfolio: Optional[str] = None


class BulletComparison(BaseModel):
    original: str
    tailored: str
    explanation: str
    source_evidence: str
    grounding_status: str = "verified"  # "verified", "retained_original", "flagged"


class WorkExperienceItem(BaseModel):
    company: str
    role: str
    location: Optional[str] = None
    dates: Optional[str] = None
    bullets: List[BulletComparison] = Field(default_factory=list)


class ProjectItem(BaseModel):
    title: str
    technologies: Optional[str] = None
    dates: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    bullets: List[BulletComparison] = Field(default_factory=list)


class EducationItem(BaseModel):
    degree: str
    institution: str
    location: Optional[str] = None
    dates: Optional[str] = None
    gpa_or_details: Optional[str] = None


class CertificationItem(BaseModel):
    name: str
    issuer: Optional[str] = None
    date: Optional[str] = None


class SkillsCategory(BaseModel):
    category: str
    skills: List[str] = Field(default_factory=list)


class AdditionalSectionItem(BaseModel):
    heading: str
    items: List[str] = Field(default_factory=list)


class PreservationAuditItem(BaseModel):
    category: str  # "section", "project", "bullet", "work_experience", "education", "skill", "certification", "contact", "additional_section"
    item_name: str
    status: str  # "preserved_unchanged", "rewritten_verified", "added_verified", "flagged_for_review", "missing_or_rejected"
    source_text: str
    tailored_text: Optional[str] = None
    notes: Optional[str] = None


class ContentPreservationAudit(BaseModel):
    preserved_unchanged_count: int = 0
    rewritten_verified_count: int = 0
    added_verified_count: int = 0
    flagged_count: int = 0
    missing_rejected_count: int = 0
    items: List[PreservationAuditItem] = Field(default_factory=list)


class TailoredResumeData(BaseModel):
    contact: ContactInfo
    target_role: str
    target_company: Optional[str] = ""
    seniority: str = "entry-level"
    tone: str = "professional"
    professional_summary: str
    skills_categories: List[SkillsCategory] = Field(default_factory=list)
    experience: List[WorkExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    additional_sections: List[AdditionalSectionItem] = Field(default_factory=list)
    skill_gaps: List[str] = Field(default_factory=list)
    unsupported_claims_flagged: List[str] = Field(default_factory=list)
    validation_summary: str = "Grounding and content preservation validation completed successfully."
    grounding_verified: bool = True
    content_preservation_verified: bool = True
    preservation_audit: ContentPreservationAudit = Field(default_factory=ContentPreservationAudit)
    preservation_warnings: List[str] = Field(default_factory=list)


class ResumeTailorRequest(BaseModel):
    resume_id: int
    target_role: Optional[str] = ""
    job_title: Optional[str] = ""
    company_name: Optional[str] = ""
    job_description: str
    seniority: Optional[str] = "entry-level"
    tone: Optional[str] = "professional"


class TailoredBullet(BaseModel):
    original: str
    tailored: str
    explanation: str


class ResumeTailorResponse(BaseModel):
    resume_id: int
    target_role: str
    company_name: Optional[str] = ""
    tone: str
    seniority: str
    summary: str
    bullets: List[TailoredBullet]
    anti_hallucination_note: str
    tailored_resume: TailoredResumeData
    raw_markdown: str
    grounding_verified: bool
    content_preservation_verified: bool = True
    preservation_audit: ContentPreservationAudit = Field(default_factory=ContentPreservationAudit)
    preservation_warnings: List[str] = Field(default_factory=list)
    skill_gaps: List[str]
    unsupported_claims_flagged: List[str]


class DownloadTailoredDocumentRequest(BaseModel):
    resume_id: int
    format: str = "pdf"  # "pdf" or "docx"
    tailored_resume: TailoredResumeData
