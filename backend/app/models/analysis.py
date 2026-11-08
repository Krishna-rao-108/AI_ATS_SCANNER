
from sqlmodel import SQLModel, Field


class Analysis(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int
    resume_id: int
    jd_id: int | None = Field(default=None, foreign_key="jobdescription.id")
    analysis_type: str = Field(default="job_match")
    result: str
