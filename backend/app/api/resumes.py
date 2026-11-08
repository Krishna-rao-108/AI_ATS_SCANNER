import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.resume import Resume
from app.schemas.resume import (
    ResumeDeleteResponse,
    ResumeDetailResponse,
    ResumeResponse,
    ResumeUploadResponse,
)
from app.utils.file_parser import (
    CorruptFileError,
    EmptyExtractedTextError,
    FileParsingError,
    InvalidResumeTextError,
    OCRDependencyError,
    extract_text,
)

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
CHUNK_SIZE = 64 * 1024  # 64 KB
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    suffix = Path(file.filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are allowed.",
        )

    # Ensure extension matches declared MIME type
    if (suffix == ".pdf" and file.content_type != "application/pdf") or (
        suffix == ".docx"
        and file.content_type
        != "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content type does not match its file extension.",
        )

    temp_path = None
    try:
        # Stream file in chunks to enforce size limit without loading large files into memory
        file_size = 0
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            while chunk := await file.read(CHUNK_SIZE):
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail="File size exceeds the maximum limit of 5 MB.",
                    )
                temp_file.write(chunk)

        # Extract text from temporary file
        try:
            text = extract_text(temp_path)
        except OCRDependencyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e),
            )
        except CorruptFileError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        except (EmptyExtractedTextError, InvalidResumeTextError) as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        except FileParsingError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to parse resume. Please ensure the file is a valid, uncorrupted PDF or DOCX file.",
            )

        if not text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No readable text found in the uploaded resume.",
            )

        resume = Resume(
            user_id=user_id,
            title=file.filename,
            content=text,
        )

        session.add(resume)
        session.commit()
        session.refresh(resume)

        if resume.id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save resume.",
            )

        return ResumeUploadResponse(
            message="Resume uploaded successfully",
            resume_id=resume.id,
            filename=resume.title,
        )

    finally:
        # Always clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


@router.get("", response_model=list[ResumeResponse])
def get_user_resumes(
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(Resume).where(Resume.user_id == user_id)
    resumes = session.exec(statement).all()
    return resumes


@router.get("/{resume_id}", response_model=ResumeDetailResponse)
def get_resume(
    resume_id: int,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(Resume).where(
        Resume.id == resume_id, Resume.user_id == user_id
    )
    resume = session.exec(statement).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    return resume


@router.delete("/{resume_id}", response_model=ResumeDeleteResponse)
def delete_resume(
    resume_id: int,
    user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(Resume).where(
        Resume.id == resume_id, Resume.user_id == user_id
    )
    resume = session.exec(statement).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    session.delete(resume)
    session.commit()

    return ResumeDeleteResponse(message="Resume deleted successfully")