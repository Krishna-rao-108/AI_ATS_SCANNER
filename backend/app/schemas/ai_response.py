from pydantic import BaseModel


class AIResponse(BaseModel):
    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    gaps: list[str]
    recommendations: list[str]