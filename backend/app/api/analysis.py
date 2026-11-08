import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select, col

logger = logging.getLogger(__name__)

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.resume import Resume
from app.models.jd import JobDescription
from app.models.user import User
from app.models.analysis import Analysis as AnalysisModel
from app.schemas.analysis import (
    AnalysisCreate,
    AnalysisResponse,
    AnalysisHistoryItem,
    ResumeTailorRequest,
    ResumeTailorResponse,
    DownloadTailoredDocumentRequest,
    CoverLetterRequest,
    CoverLetterResponse,
)
from app.schemas.tailor import (
    TailoredResumeData,
    ContentPreservationAudit,
)
from app.ai.prune_client import (
    analyze_resume,
    analyze_resume_general,
    tailor_resume,
    generate_cover_letter,
)
from app.utils.document_generator import (
    generate_tailored_pdf,
    generate_tailored_docx,
    get_safe_filename,
)

router = APIRouter()


def require_id(value: int | None, message: str) -> int:
    """Ensure a database record has an ID before using it."""
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message,
        )
    return value


@router.post("/", response_model=AnalysisResponse)
def create_analysis(
    analysis: AnalysisCreate,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    resume = session.exec(
        select(Resume).where(
            Resume.id == analysis.resume_id,
            Resume.user_id == user_id,
        )
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    resume_id = require_id(resume.id, "Resume ID is missing.")

    jd_id: int | None = None
    analysis_type: str = analysis.analysis_type or ("job_match" if analysis.jd_id is not None else "general")

    if analysis.jd_id is not None:
        jd = session.exec(
            select(JobDescription).where(
                JobDescription.id == analysis.jd_id,
                JobDescription.user_id == user_id,
            )
        ).first()

        if not jd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job description not found",
            )

        jd_id = require_id(jd.id, "Job description ID is missing.")

        try:
            ai_result = analyze_resume(resume.content, jd.description)

            if not isinstance(ai_result, str) or not ai_result.strip():
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="AI returned an empty or invalid response.",
                )

        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Job match analysis processing failure: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI analysis service is unavailable.",
            )
    else:
        # General Resume Check without a job description
        if analysis.analysis_type == "job_match":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description ID (jd_id) is required for Job Match analysis.",
            )

        try:
            ai_result = analyze_resume_general(resume.content)

            if not isinstance(ai_result, str) or not ai_result.strip():
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="AI returned an empty or invalid response.",
                )

        except HTTPException:
            raise
        except Exception as exc:
            logger.error("General resume analysis processing failure: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI analysis service is unavailable.",
            )

    saved_analysis = AnalysisModel(
        user_id=user_id,
        resume_id=resume_id,
        jd_id=jd_id,
        analysis_type=analysis_type,
        result=ai_result,
    )

    try:
        session.add(saved_analysis)
        session.commit()
        session.refresh(saved_analysis)
    except Exception:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save the analysis.",
        )

    saved_id = require_id(saved_analysis.id, "Analysis ID is missing.")

    return AnalysisResponse(
        id=saved_id,
        resume_id=resume_id,
        jd_id=jd_id,
        analysis_type=saved_analysis.analysis_type,
        result=ai_result,
    )


@router.get("/", response_model=list[AnalysisHistoryItem])
def get_user_analyses(
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    analyses = session.exec(
        select(AnalysisModel)
        .where(AnalysisModel.user_id == user_id)
        .order_by(col(AnalysisModel.id).desc())
    ).all()

    # Load related titles in batches.
    resume_ids = {a.resume_id for a in analyses if a.resume_id is not None}
    jd_ids = {a.jd_id for a in analyses if a.jd_id is not None}

    resumes_map: dict[int, str] = {}
    if resume_ids:
        resumes = session.exec(
            select(Resume).where(col(Resume.id).in_(resume_ids))
        ).all()
        resumes_map = {
            r.id: r.title for r in resumes if r.id is not None
        }

    jds_map: dict[int, str] = {}
    if jd_ids:
        jds = session.exec(
            select(JobDescription).where(col(JobDescription.id).in_(jd_ids))
        ).all()
        jds_map = {
            j.id: j.title for j in jds if j.id is not None
        }

    results = []

    for item in analyses:
        analysis_id = require_id(item.id, "Analysis ID is missing.")

        results.append(
            AnalysisHistoryItem(
                id=analysis_id,
                resume_id=item.resume_id,
                jd_id=item.jd_id,
                analysis_type=item.analysis_type,
                resume_title=resumes_map.get(
                    item.resume_id, f"Resume #{item.resume_id}"
                ),
                jd_title=(
                    jds_map.get(
                        item.jd_id, f"Job Description #{item.jd_id}"
                    )
                    if item.jd_id is not None
                    else None
                ),
                result=item.result,
            )
        )

    return results


@router.get("/{analysis_id}", response_model=AnalysisHistoryItem)
def get_analysis_detail(
    analysis_id: int,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    item = session.exec(
        select(AnalysisModel).where(
            AnalysisModel.id == analysis_id,
            AnalysisModel.user_id == user_id,
        )
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found",
        )

    resume = session.exec(
        select(Resume).where(Resume.id == item.resume_id)
    ).first()

    jd = None
    if item.jd_id is not None:
        jd = session.exec(
            select(JobDescription).where(JobDescription.id == item.jd_id)
        ).first()

    jd_title = (
        (jd.title if jd else f"Job Description #{item.jd_id}")
        if item.jd_id is not None
        else None
    )

    return AnalysisHistoryItem(
        id=require_id(item.id, "Analysis ID is missing."),
        resume_id=item.resume_id,
        jd_id=item.jd_id,
        analysis_type=item.analysis_type,
        resume_title=resume.title if resume else f"Resume #{item.resume_id}",
        jd_title=jd_title,
        result=item.result,
    )


@router.post("/tailor", response_model=ResumeTailorResponse)
def tailor_resume_bullets_endpoint(
    req: ResumeTailorRequest,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    resume = session.exec(
        select(Resume).where(
            Resume.id == req.resume_id,
            Resume.user_id == user_id,
        )
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    resume_id = require_id(resume.id, "Resume ID is missing.")

    try:
        data = tailor_resume(
            resume_text=resume.content,
            jd_text=req.job_description,
            tone=req.tone or "professional",
            seniority=req.seniority or "entry-level",
            target_role=req.target_role or req.job_title or "",
            company_name=req.company_name or "",
        )

        if not isinstance(data, dict):
            raise ValueError("AI returned an invalid tailoring response.")

        tailored_resume_raw = data.get("tailored_resume")
        if isinstance(tailored_resume_raw, TailoredResumeData):
            tailored_resume_val = tailored_resume_raw
        elif isinstance(tailored_resume_raw, dict):
            tailored_resume_val = TailoredResumeData.model_validate(tailored_resume_raw)
        else:
            raise ValueError("AI returned an invalid tailored resume payload.")

        audit_raw = data.get("preservation_audit")
        if isinstance(audit_raw, ContentPreservationAudit):
            audit_val = audit_raw
        elif isinstance(audit_raw, dict):
            audit_val = ContentPreservationAudit.model_validate(audit_raw)
        else:
            audit_val = ContentPreservationAudit()

        return ResumeTailorResponse(
            resume_id=resume_id,
            target_role=data.get("target_role", req.target_role or req.job_title or "Target Role"),
            company_name=data.get("company_name", req.company_name or ""),
            tone=data.get("tone", req.tone or "professional"),
            seniority=data.get("seniority", req.seniority or "entry-level"),
            summary=data.get("summary", ""),
            bullets=data.get("bullets", []),
            anti_hallucination_note=data.get("anti_hallucination_note", ""),
            tailored_resume=tailored_resume_val,
            raw_markdown=data.get("raw_markdown", ""),
            grounding_verified=data.get("grounding_verified", True),
            content_preservation_verified=data.get("content_preservation_verified", True),
            preservation_audit=audit_val,
            preservation_warnings=data.get("preservation_warnings", []),
            skill_gaps=data.get("skill_gaps", []),
            unsupported_claims_flagged=data.get("unsupported_claims_flagged", []),
        )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI resume tailoring service is unavailable.",
        )


@router.post("/tailor/download")
def download_tailored_document_endpoint(
    req: DownloadTailoredDocumentRequest,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Generates and securely streams a polished ATS-friendly PDF or DOCX tailored resume.
    Ensures multi-tenant ownership check, re-validation against source resume,
    in-memory streaming, and safe filename generation.
    """
    resume = session.exec(
        select(Resume).where(
            Resume.id == req.resume_id,
            Resume.user_id == user_id,
        )
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    fmt = req.format.strip().lower()
    if fmt not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format requested. Only 'pdf' and 'docx' are supported.",
        )

    # Re-validate tailored resume against source resume to ensure grounding integrity
    from app.utils.resume_parser import extract_raw_bullets
    from app.utils.grounding_validator import validate_and_enforce_grounding

    raw_bullets = extract_raw_bullets(resume.content)
    validated_resume, _ = validate_and_enforce_grounding(
        req.tailored_resume, resume.content, raw_bullets
    )

    candidate_name = validated_resume.contact.name or "Candidate"
    filename = get_safe_filename(candidate_name, fmt)

    try:
        if fmt == "pdf":
            file_bytes = generate_tailored_pdf(validated_resume)
            media_type = "application/pdf"
        else:
            file_bytes = generate_tailored_docx(validated_resume)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        return Response(
            content=file_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate {fmt.upper()} document: {str(e)}",
        )


@router.post("/cover-letter", response_model=CoverLetterResponse)
def generate_cover_letter_endpoint(
    req: CoverLetterRequest,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not req.job_title or not req.job_title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job title is required and cannot be empty.",
        )
    if not req.company_name or not req.company_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name is required and cannot be empty.",
        )
    if not req.job_description or not req.job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is required and cannot be empty.",
        )

    resume = session.exec(
        select(Resume).where(
            Resume.id == req.resume_id,
            Resume.user_id == user_id,
        )
    ).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    if not resume.content or not resume.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected resume contains no readable text content.",
        )

    resume_id = require_id(resume.id, "Resume ID is missing.")
    user = session.get(User, user_id)
    user_name = user.name if user else None

    try:
        data = generate_cover_letter(
            resume_text=resume.content,
            jd_text=req.job_description.strip(),
            job_title=req.job_title.strip(),
            company_name=req.company_name.strip(),
            tone=req.tone or "professional",
            user_name=user_name,
        )

        if not isinstance(data, dict):
            raise ValueError("AI returned an invalid cover letter response.")

        return CoverLetterResponse(
            resume_id=resume_id,
            job_title=req.job_title.strip(),
            company_name=req.company_name.strip(),
            tone=req.tone or "professional",
            candidate_name=data.get("candidate_name"),
            recipient=data.get("recipient"),
            opening_paragraph=data.get("opening_paragraph"),
            evidence_paragraph=data.get("evidence_paragraph"),
            contribution_paragraph=data.get("contribution_paragraph"),
            closing_paragraph=data.get("closing_paragraph"),
            sign_off=data.get("sign_off"),
            cover_letter=data.get("cover_letter", ""),
            key_qualifications_addressed=data.get(
                "key_qualifications_addressed", []
            ),
            verified_skills_referenced=data.get(
                "verified_skills_referenced", []
            ),
            unsupported_skills_avoided=data.get(
                "unsupported_skills_avoided", []
            ),
            word_count=data.get("word_count"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI cover letter service is unavailable: {str(e)}",
        )
