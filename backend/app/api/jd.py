from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.database import get_session
from app.core.security import get_current_user
from app.models.jd import JobDescription
from app.schemas.jd import JobDescriptionCreate, JobDescriptionResponse

router = APIRouter()


@router.post("/", response_model=JobDescriptionResponse)
def create_job_description(
    jd: JobDescriptionCreate,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    new_jd = JobDescription(
        user_id=user_id,
        title=jd.title,
        description=jd.description
    )

    session.add(new_jd)
    session.commit()
    session.refresh(new_jd)

    return new_jd