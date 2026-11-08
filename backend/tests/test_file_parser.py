import io
import os
import tempfile
import pytest
from unittest.mock import patch
from PIL import Image, ImageDraw
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from docx import Document
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.main import app
from app.core.database import engine
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.models.resume import Resume
from app.utils.file_parser import (
    CorruptFileError,
    EmptyExtractedTextError,
    FileParsingError,
    InvalidResumeTextError,
    OCRDependencyError,
    UnsupportedFileTypeError,
    extract_text,
    extract_text_from_docx,
    extract_text_from_pdf,
    is_insufficient_text,
    is_tesseract_available,
    validate_extracted_text,
)

client = TestClient(app)


@pytest.fixture
def test_user(db_session: Session):
    user = db_session.exec(
        select(User).where(User.email == "file_parser_user@example.com")
    ).first()
    if not user:
        user = User(
            name="File Parser User",
            email="file_parser_user@example.com",
            hashed_password=hash_password("Password123!"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    token = create_access_token({"user_id": user.id})
    return {
        "user": user,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture
def db_session():
    with Session(engine) as session:
        yield session


def create_text_pdf(content_lines: list[str]) -> bytes:
    """Helper to generate a valid digital text-based PDF using ReportLab."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    y = 750
    for line in content_lines:
        c.drawString(72, y, line)
        y -= 20
        if y < 50:
            c.showPage()
            y = 750
    c.save()
    return buf.getvalue()


def create_image_pdf(text_lines: list[str], width: int = 800, height: int = 600) -> bytes:
    """
    Helper to generate a scanned/image-based PDF:
    Draws text onto a PIL raster image, then saves it as a PDF without any digital font text.
    """
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    y = 40
    for line in text_lines:
        draw.text((40, y), line, fill=(0, 0, 0))
        y += 35

    buf = io.BytesIO()
    img.save(buf, "PDF")
    return buf.getvalue()


def create_docx(paragraphs: list[str], table_rows: list[list[str]] | None = None) -> bytes:
    """Helper to generate a valid DOCX file in memory."""
    doc = Document()
    for p in paragraphs:
        doc.add_paragraph(p)

    if table_rows:
        table = doc.add_table(rows=len(table_rows), cols=len(table_rows[0]))
        for r_idx, row in enumerate(table_rows):
            for c_idx, cell_value in enumerate(row):
                table.cell(r_idx, c_idx).text = cell_value

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


# -------------------------------------------------------------------------
# Unit Tests for file_parser.py
# -------------------------------------------------------------------------

def test_extract_text_based_pdf():
    """Verify that normal digital PDFs extract quickly and completely without triggering OCR."""
    pdf_bytes = create_text_pdf([
        "ALICE SMITH",
        "Senior Backend Engineer | alice.smith@example.com",
        "Experience: 6 years developing microservices in Python, FastAPI, and PostgreSQL.",
        "Skills: Python, FastAPI, Docker, Kubernetes, AWS, SQL, Git",
    ])

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        temp_path = f.name

    try:
        with patch("app.utils.file_parser._perform_ocr_on_pdf_pages") as mock_ocr:
            text = extract_text(temp_path)
            # OCR should not be invoked when standard extraction succeeds
            mock_ocr.assert_not_called()

        assert "ALICE SMITH" in text
        assert "alice.smith@example.com" in text
        assert "FastAPI" in text
        assert "PostgreSQL" in text
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_extract_image_based_pdf_using_ocr():
    """Verify that image-based PDFs (which contain no digital text stream) trigger OCR fallback."""
    pdf_bytes = create_image_pdf([
        "BOB JOHNSON",
        "Lead DevOps Architect",
        "Email: bob.devops@example.com",
        "Extensive experience with Terraform, Kubernetes, and Docker CI/CD.",
    ])

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(pdf_bytes)
        temp_path = f.name

    try:
        text = extract_text(temp_path)
        assert len(text) > 30
        assert "BOB" in text.upper()
        assert "KUBERNETES" in text.upper() or "DOCKER" in text.upper()
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_extract_docx_paragraphs_and_tables():
    """Verify that DOCX parsing extracts paragraphs and table content while preserving formatting."""
    docx_bytes = create_docx(
        paragraphs=[
            "CAROL WHITE",
            "Full Stack Developer | carol@example.com",
            "Building scalable web applications using React and FastAPI.",
        ],
        table_rows=[
            ["Core Skills", "React, TypeScript, FastAPI, PostgreSQL"],
            ["Tools", "Docker, Git, Vite, Tailwind CSS"],
        ],
    )

    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
        f.write(docx_bytes)
        temp_path = f.name

    try:
        text = extract_text(temp_path)
        assert "CAROL WHITE" in text
        assert "carol@example.com" in text
        assert "React" in text
        assert "Tailwind CSS" in text
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_empty_image_pdf_raises_clear_error():
    """Verify that a completely blank image-based PDF raises EmptyExtractedTextError."""
    # Blank white image
    img = Image.new("RGB", (600, 400), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, "PDF")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(buf.getvalue())
        temp_path = f.name

    try:
        with pytest.raises(EmptyExtractedTextError) as exc_info:
            extract_text(temp_path)
        assert "No readable text found in the uploaded resume" in str(exc_info.value)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_corrupt_pdf_file_raises_corrupt_file_error():
    """Verify that corrupted PDF bytes raise CorruptFileError with a clear description."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(b"%PDF-1.4 completely corrupted binary junk \x00\x01\xfe\xff")
        temp_path = f.name

    try:
        with pytest.raises(CorruptFileError) as exc_info:
            extract_text(temp_path)
        assert "corrupted" in str(exc_info.value).lower() or "failed to read" in str(exc_info.value).lower()
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_corrupt_docx_file_raises_corrupt_file_error():
    """Verify that corrupted DOCX files raise CorruptFileError."""
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as f:
        f.write(b"PK\x03\x04 not a valid zip or docx archive")
        temp_path = f.name

    try:
        with pytest.raises(CorruptFileError) as exc_info:
            extract_text(temp_path)
        assert "corrupted" in str(exc_info.value).lower() or "failed to read" in str(exc_info.value).lower()
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_unsupported_file_extension():
    """Verify that unsupported extensions raise UnsupportedFileTypeError."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
        f.write(b"Plain text resume")
        temp_path = f.name

    try:
        with pytest.raises(UnsupportedFileTypeError) as exc_info:
            extract_text(temp_path)
        assert "Unsupported file type" in str(exc_info.value)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_ocr_dependency_missing_raises_actionable_error():
    """Verify that when Tesseract is missing and OCR is needed, OCRDependencyError is raised."""
    # Blank image PDF that forces OCR fallback
    img = Image.new("RGB", (400, 200), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, "PDF")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(buf.getvalue())
        temp_path = f.name

    try:
        with patch("app.utils.file_parser.is_tesseract_available", return_value=False):
            with pytest.raises(OCRDependencyError) as exc_info:
                extract_text(temp_path)
            assert "Tesseract OCR is not installed" in str(exc_info.value)
            assert "brew install tesseract" in str(exc_info.value)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_validation_rejects_binary_garbage_and_tiny_snippets():
    """Verify that text validation rejects corrupted binary strings and trivial snippets."""
    # Too short
    with pytest.raises(EmptyExtractedTextError):
        validate_extracted_text("Page 1")

    # Binary garbage
    garbage = "hello " + "".join(chr(i) for i in range(1, 20)) * 5
    with pytest.raises(InvalidResumeTextError):
        validate_extracted_text(garbage)

    # Valid resume text
    valid = "David Miller\nLead Full Stack Engineer with 7 years of React and Python experience."
    assert validate_extracted_text(valid) == valid


# -------------------------------------------------------------------------
# Integration Tests for POST /api/resumes/upload
# -------------------------------------------------------------------------

def test_upload_endpoint_text_pdf(test_user):
    """Test POST /api/resumes/upload with a standard digital PDF."""
    pdf_bytes = create_text_pdf([
        "EMMA WATSON",
        "Full Stack Developer | emma.watson@example.com",
        "Experience: 5 years building frontend and backend applications with React, TypeScript, and FastAPI.",
        "Skills: React, TypeScript, Python, FastAPI, Docker, SQL",
    ])

    response = client.post(
        "/api/resumes/upload",
        files={"file": ("emma_watson_resume.pdf", pdf_bytes, "application/pdf")},
        headers=test_user["headers"],
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Resume uploaded successfully"
    assert "resume_id" in data
    assert data["filename"] == "emma_watson_resume.pdf"


def test_upload_endpoint_image_based_pdf_with_ocr(test_user):
    """Test POST /api/resumes/upload with an image-based scanned PDF (exercises OCR end-to-end)."""
    pdf_bytes = create_image_pdf([
        "FRANK UNDERWOOD",
        "Executive Strategy Consultant",
        "frank.underwood@example.com",
        "Proven track record of high-stakes negotiations and organizational alignment.",
    ])

    response = client.post(
        "/api/resumes/upload",
        files={"file": ("frank_scanned_resume.pdf", pdf_bytes, "application/pdf")},
        headers=test_user["headers"],
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Resume uploaded successfully"
    assert "resume_id" in data
    assert data["filename"] == "frank_scanned_resume.pdf"


def test_upload_endpoint_docx(test_user):
    """Test POST /api/resumes/upload with a valid DOCX file."""
    docx_bytes = create_docx([
        "GRACE HOPPER",
        "Pioneering Computer Scientist | grace.hopper@example.com",
        "Developed first compiler concepts and early programming languages.",
        "Skills: Compilers, Systems Architecture, Machine Code",
    ])

    response = client.post(
        "/api/resumes/upload",
        files={
            "file": (
                "grace_hopper.docx",
                docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        headers=test_user["headers"],
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Resume uploaded successfully"
    assert "resume_id" in data
    assert data["filename"] == "grace_hopper.docx"


def test_upload_endpoint_corrupt_pdf(test_user):
    """Test POST /api/resumes/upload with a corrupt PDF returns HTTP 400 with clear message."""
    response = client.post(
        "/api/resumes/upload",
        files={"file": ("corrupt.pdf", b"%PDF-corruptjunk", "application/pdf")},
        headers=test_user["headers"],
    )

    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "corrupt" in detail or "unable to parse" in detail or "failed to read" in detail


def test_upload_endpoint_blank_pdf(test_user):
    """Test POST /api/resumes/upload with a blank image PDF returns HTTP 400 'No readable text'."""
    img = Image.new("RGB", (400, 400), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, "PDF")

    response = client.post(
        "/api/resumes/upload",
        files={"file": ("blank.pdf", buf.getvalue(), "application/pdf")},
        headers=test_user["headers"],
    )

    assert response.status_code == 400
    assert "no readable text found" in response.json()["detail"].lower()


def test_upload_endpoint_oversized_file(test_user):
    """Test POST /api/resumes/upload with file exceeding 5MB returns HTTP 413."""
    oversized_data = b"0" * (5 * 1024 * 1024 + 1024)  # 5 MB + 1 KB

    response = client.post(
        "/api/resumes/upload",
        files={"file": ("huge_resume.pdf", oversized_data, "application/pdf")},
        headers=test_user["headers"],
    )

    assert response.status_code == 413
    assert "exceeds the maximum limit" in response.json()["detail"]


def test_upload_endpoint_disallowed_extension(test_user):
    """Test POST /api/resumes/upload with disallowed extension returns HTTP 400."""
    response = client.post(
        "/api/resumes/upload",
        files={"file": ("resume.png", b"image data", "image/png")},
        headers=test_user["headers"],
    )

    assert response.status_code == 400
    assert "only pdf and docx files are allowed" in response.json()["detail"].lower()
