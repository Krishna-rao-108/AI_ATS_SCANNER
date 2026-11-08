from pydantic import BaseModel


class ResumeUploadResponse(BaseModel):
    message: str
    resume_id: int
    filename: str


class ResumeResponse(BaseModel):
    id: int
    title: str


class ResumeDetailResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str


class ResumeDeleteResponse(BaseModel):
    message: str
