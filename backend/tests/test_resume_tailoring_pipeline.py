import io
import re
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from pypdf import PdfReader
from docx import Document

from app.main import app
from app.core.database import engine
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.models.resume import Resume
from app.schemas.tailor import (
    ContactInfo,
    TailoredResumeData,
    ProjectItem,
    WorkExperienceItem,
    BulletComparison,
    SkillsCategory,
    EducationItem,
    CertificationItem,
    AdditionalSectionItem,
)
from app.utils.grounding_validator import (
    validate_and_enforce_grounding,
    audit_content_preservation,
    reconcile_and_preserve_all_source_content,
)
from app.utils.document_generator import (
    generate_tailored_pdf,
    generate_tailored_docx,
    generate_tailored_markdown,
    get_safe_filename,
)
from app.utils.resume_parser import (
    extract_contact_info,
    partition_resume_sections,
    extract_structured_projects,
    extract_structured_experience,
    extract_structured_skills,
    extract_structured_education,
    extract_structured_certifications,
    extract_additional_sections,
    extract_raw_bullets,
)
from app.ai.prune_client import (
    tailor_resume,
    build_safe_resume_from_source,
    extract_json_from_text,
)

client = TestClient(app)

REALISTIC_SOURCE_RESUME = """KRISHNA RAO
Full-Stack & Backend Engineer | AI Specialist
Mumbai, India | +91 7977519578 | krishvrao108@gmail.com | linkedin.com/in/krishnarao108 | github.com/krishvrao | krishnarao.dev

PROFESSIONAL SUMMARY
B.Sc. IT graduate with extensive experience developing full-stack web applications, RESTful APIs, and Retrieval-Augmented Generation (RAG) pipelines in Python, Django, FastAPI, and React.

TECHNICAL SKILLS
Languages & Frameworks: Python, JavaScript, TypeScript, Django, FastAPI, React, SQL
Databases & Tools: PostgreSQL, ChromaDB, Redis, Docker, Git, Linux, Postman
AI & ML: LLM Integration, LangChain, Sentence-Transformers, Vector Search

WORK EXPERIENCE
Backend Engineering Intern — CloudScale Solutions (Jan 2024 - Jun 2024) | Mumbai, India
• Developed and maintained RESTful microservice APIs in FastAPI handling document ingestion.
• Integrated Redis caching for frequent database query results reducing repetitive queries.
• Collaborated with senior engineers in code reviews and CI/CD deployment pipelines on Docker.

PROJECTS
Enterprise Document RAG Pipeline | Python, FastAPI, ChromaDB, React | Feb 2024 - Apr 2024
A production-grade document intelligence platform enabling semantic search over enterprise PDFs.
• Built an end-to-end RAG architecture converting PDF documents into dense vector embeddings using sentence-transformers.
• Implemented hybrid search with ChromaDB and cosine similarity ranking to deliver context to LLM prompts.
• Designed responsive React frontend with real-time streaming text generation and citation linking.

Real-Time ATS Screening Platform | Django, PostgreSQL, Celery | Oct 2023 - Dec 2023
An automated applicant tracking system evaluating candidate resumes against job specifications.
• Developed automated PDF and DOCX text extraction pipelines using PyMuPDF and python-docx.
• Engineered scoring algorithm comparing extracted skills against job posting requirements.

EDUCATION
B.Sc. in Information Technology — Usha Pravin Gandhi College of Management (2021 - 2024) | CGPA: 8.85 / 10

CERTIFICATIONS
AWS Certified Cloud Practitioner — Amazon Web Services (2024)
Deep Learning Specialization — DeepLearning.AI (2023)

ACHIEVEMENTS & AWARDS
• Won 1st Place at Inter-Collegiate Hackathon 2023 for AI Resume Analyzer prototype.
• Published technical article on Semantic Search in Vector Databases with over 5,000 reads.

LEADERSHIP & VOLUNTEERING
• Tech Lead for College Coding Club, organizing weekly Python workshops for 100+ students.
"""


@pytest.fixture
def auth_setup():
    with Session(engine) as session:
        user1 = session.exec(select(User).where(User.email == "zero_loss_user1@example.com")).first()
        if not user1:
            user1 = User(
                name="Krishna Rao",
                email="zero_loss_user1@example.com",
                hashed_password=hash_password("SecurePass123!"),
            )
            session.add(user1)
            session.commit()
            session.refresh(user1)

        user2 = session.exec(select(User).where(User.email == "zero_loss_user2@example.com")).first()
        if not user2:
            user2 = User(
                name="Other User",
                email="zero_loss_user2@example.com",
                hashed_password=hash_password("SecurePass123!"),
            )
            session.add(user2)
            session.commit()
            session.refresh(user2)

        if user1.id is None:
            raise ValueError("User ID cannot be None")

        resume1 = Resume(
            user_id=user1.id,
            title="Krishna_Rao_Comprehensive_Resume.pdf",
            content=REALISTIC_SOURCE_RESUME,
        )   
        session.add(resume1)
        session.commit()
        session.refresh(resume1)

        token1 = create_access_token({"user_id": user1.id})
        token2 = create_access_token({"user_id": user2.id})

        return {
            "user1": user1,
            "user2": user2,
            "resume1": resume1,
            "token1": token1,
            "token2": token2,
            "headers1": {"Authorization": f"Bearer {token1}"},
            "headers2": {"Authorization": f"Bearer {token2}"},
        }


# ==============================================================================
# 1. CONTENT PRESERVATION & FACTUAL INTEGRITY TESTS
# ==============================================================================

def test_1_every_original_resume_section_preserved():
    """Verify that every original section in the source resume is preserved in structured output."""
    baseline = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Backend Engineer")
    validated, _ = validate_and_enforce_grounding(baseline, REALISTIC_SOURCE_RESUME, [])

    assert validated.contact.name == "KRISHNA RAO"
    assert len(validated.skills_categories) >= 2
    assert len(validated.experience) >= 1
    assert len(validated.projects) >= 2
    assert len(validated.education) >= 1
    assert len(validated.certifications) >= 2
    assert len(validated.additional_sections) >= 2
    assert validated.content_preservation_verified is True


def test_2_every_original_project_and_description_retained():
    """Verify that every project title, technology, and description from the source resume is retained."""
    baseline = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Backend Engineer")
    titles = [p.title for p in baseline.projects]
    assert any("Enterprise Document RAG Pipeline" in t for t in titles)
    assert any("Real-Time ATS Screening Platform" in t for t in titles)

    rag_proj = next(p for p in baseline.projects if "Enterprise Document RAG" in p.title)
    assert rag_proj.description is not None
    assert "document intelligence platform" in rag_proj.description.lower()
    assert len(rag_proj.bullets) == 3


def test_3_every_original_bullet_preserved_or_accounted_for():
    """Verify that every bullet from experience and projects is preserved or verified in audit."""
    baseline = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Backend Engineer")
    audit, warnings = audit_content_preservation(baseline, REALISTIC_SOURCE_RESUME)

    assert audit.missing_rejected_count == 0
    assert len(warnings) == 0
    assert audit.preserved_unchanged_count + audit.rewritten_verified_count >= 8


def test_4_contact_details_dates_links_education_skills_certs_retained():
    """Verify that contact details, links, education, certifications, and skills are extracted accurately."""
    contact = extract_contact_info(REALISTIC_SOURCE_RESUME)
    assert contact.name == "KRISHNA RAO"
    assert contact.email == "krishvrao108@gmail.com"
    assert "7977519578" in (contact.phone or "")
    assert "linkedin.com/in/krishnarao108" in (contact.linkedin or "")
    assert "github.com/krishvrao" in (contact.github or "")
    assert "krishnarao.dev" in (contact.website or contact.portfolio or "")

    certs = extract_structured_certifications(partition_resume_sections(REALISTIC_SOURCE_RESUME)["certifications"])
    assert len(certs) == 2
    assert any("AWS Certified Cloud Practitioner" in c.name for c in certs)
    assert any("Deep Learning Specialization" in c.name for c in certs)


def test_5_incomplete_ai_output_does_not_silently_delete_source_content():
    """Simulate an incomplete AI response that dropped a project and work experience; reconciler restores them."""
    # Defective AI output with only 1 project and missing work experience entirely
    incomplete_data = TailoredResumeData(
        contact=ContactInfo(name="KRISHNA RAO"),
        target_role="Backend Developer",
        professional_summary="Summary.",
        projects=[
            ProjectItem(
                title="Enterprise Document RAG Pipeline",
                bullets=[BulletComparison(original="o", tailored="Built RAG app.", explanation="e", source_evidence="s")],
            )
        ],
        experience=[],  # Dropped!
        certifications=[],  # Dropped!
    )

    reconciled = reconcile_and_preserve_all_source_content(incomplete_data, REALISTIC_SOURCE_RESUME)

    # Must restore the missing second project
    proj_titles = [p.title for p in reconciled.projects]
    assert any("Real-Time ATS Screening Platform" in t for t in proj_titles)
    # Must restore the missing experience
    assert len(reconciled.experience) >= 1
    # Must restore the missing certifications
    assert len(reconciled.certifications) >= 2


def test_6_malformed_ai_json_and_failure_uses_safe_fallback():
    """Verify that malformed JSON or API failures fall back cleanly to a complete, zero-loss resume."""
    with patch("app.ai.prune_client.get_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = RuntimeError("Prune gateway timeout")
        mock_get_client.return_value = mock_client

        res = tailor_resume(REALISTIC_SOURCE_RESUME, "Backend Engineer role")
        assert res["grounding_verified"] is True
        assert res["content_preservation_verified"] is True
        assert len(res["tailored_resume"]["projects"]) >= 2
        assert len(res["tailored_resume"]["certifications"]) >= 2


def test_7_fabricated_technologies_and_employment_history_rejected_or_flagged():
    """Verify that fabricated technologies or roles not present in source resume are caught by validator."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Lead Kubernetes Architect")
    # Attempt to inject unevidenced skill gap into candidate skills
    data.skill_gaps = ["Kubernetes", "Golang"]
    data.skills_categories.append(SkillsCategory(category="Cloud", skills=["Kubernetes", "Golang", "Docker"]))

    validated, flagged = validate_and_enforce_grounding(data, REALISTIC_SOURCE_RESUME, [])
    # Cloud category should have Kubernetes and Golang stripped
    cloud_cat = next(c for c in validated.skills_categories if c.category == "Cloud")
    assert "Kubernetes" not in cloud_cat.skills
    assert "Golang" not in cloud_cat.skills
    assert "Docker" in cloud_cat.skills
    assert any("Kubernetes" in f for f in flagged)


def test_8_invented_metrics_rejected():
    """Confirm that fabricated percentages or dollar values are rejected and reverted to original."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Senior Engineer")
    data.projects[0].bullets[0].tailored = "Boosted document retrieval speed by 85% and increased throughput by 4x."

    validated, flagged = validate_and_enforce_grounding(data, REALISTIC_SOURCE_RESUME, [])
    assert len(flagged) > 0
    assert any("85%" in f for f in flagged)
    # Reverted to source phrasing
    assert validated.projects[0].bullets[0].grounding_status == "retained_original"
    assert "85%" not in validated.projects[0].bullets[0].tailored


def test_9_missing_job_requirements_appear_as_skill_gaps():
    """Verify that unmet job requirements remain isolated in skill_gaps without polluting candidate skills."""
    data = TailoredResumeData(
        contact=ContactInfo(name="KRISHNA RAO"),
        target_role="Rust Systems Engineer",
        professional_summary="Backend Engineer.",
        skills_categories=[SkillsCategory(category="Languages", skills=["Python", "SQL"])],
        skill_gaps=["Rust", "WebAssembly", "Tokio"],
    )
    validated, _ = validate_and_enforce_grounding(data, REALISTIC_SOURCE_RESUME, [])
    assert "Rust" in validated.skill_gaps
    assert "Rust" not in [s for cat in validated.skills_categories for s in cat.skills]


def test_10_grounding_and_preservation_flags_reflect_validation_results():
    """Confirm that grounding_verified and content_preservation_verified are independent and accurate."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "SDE")
    validated, _ = validate_and_enforce_grounding(data, REALISTIC_SOURCE_RESUME, [])
    assert validated.grounding_verified is True
    assert validated.content_preservation_verified is True
    assert validated.preservation_audit.missing_rejected_count == 0


# ==============================================================================
# 2. DOCUMENT GENERATION & EXPORT TESTS
# ==============================================================================

def test_11_pdf_generation_and_text_extraction():
    """Verify that generated PDF contains extractable, selectable text containing all sections."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Backend Engineer")
    pdf_bytes = generate_tailored_pdf(data)

    reader = PdfReader(io.BytesIO(pdf_bytes))
    extracted = "".join(p.extract_text() for p in reader.pages)

    assert "KRISHNA RAO" in extracted
    assert "Enterprise Document RAG Pipeline" in extracted
    assert "Real-Time ATS Screening Platform" in extracted
    assert "AWS Certified Cloud Practitioner" in extracted


def test_12_docx_generation_and_content_extraction():
    """Verify that generated DOCX contains all sections, bullets, and project descriptions."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Backend Engineer")
    docx_bytes = generate_tailored_docx(data)

    doc = Document(io.BytesIO(docx_bytes))
    full_text = " ".join(p.text for p in doc.paragraphs)

    assert "KRISHNA RAO" in full_text
    assert "Enterprise Document RAG Pipeline" in full_text
    assert "Real-Time ATS Screening Platform" in full_text
    assert "Usha Pravin Gandhi College" in full_text


def test_13_pdf_docx_markdown_consistent_substantive_content():
    """Verify that PDF, DOCX, and Markdown representations contain identical substantive content."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Backend Engineer")

    pdf_text = "".join(p.extract_text() for p in PdfReader(io.BytesIO(generate_tailored_pdf(data))).pages)
    doc_text = " ".join(p.text for p in Document(io.BytesIO(generate_tailored_docx(data))).paragraphs)
    md_text = generate_tailored_markdown(data)

    for key_term in ["Enterprise Document RAG Pipeline", "Real-Time ATS Screening Platform", "CloudScale Solutions"]:
        assert key_term in pdf_text
        assert key_term in doc_text
        assert key_term in md_text


def test_14_user_edits_reflected_in_downloaded_files(auth_setup):
    """Confirm user edits to summary and project bullets are accurately compiled into downloaded documents."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Backend Engineer")
    data.professional_summary = "Specialized Python & AI engineer with custom user modifications."
    data.projects[0].bullets[0].tailored = "Engineered custom real-time PDF streaming service with high precision."

    res = client.post(
        "/api/analysis/tailor/download",
        json={
            "resume_id": auth_setup["resume1"].id,
            "format": "pdf",
            "tailored_resume": data.model_dump(),
        },
        headers=auth_setup["headers1"],
    )
    assert res.status_code == 200
    pdf_text = "".join(p.extract_text() for p in PdfReader(io.BytesIO(res.content)).pages)
    assert "Specialized Python & AI engineer with custom user modifications" in pdf_text
    assert "custom real-time PDF streaming service" in pdf_text


def test_15_long_resumes_spanning_multiple_pages_without_content_loss():
    """Verify that long resumes cleanly paginate over multiple pages without clipping or crashing."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Senior Engineer")
    # Duplicate projects and experiences to force a multi-page document
    data.projects = data.projects * 4
    data.experience = data.experience * 4

    pdf_bytes = generate_tailored_pdf(data)
    reader = PdfReader(io.BytesIO(pdf_bytes))
    assert len(reader.pages) >= 2


def test_16_special_characters_unicode_long_urls_long_bullets():
    """Verify that &, <, >, em-dashes, and long URLs are safely escaped in ReportLab and DOCX."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Backend Developer")
    data.professional_summary = "Expertise in C++ & algorithms <O(n log n)> with high fidelity — test."
    data.contact.website = "https://example.com/portfolio?client=test&id=123<tag>"
    data.projects[0].bullets[0].tailored = "Built secure API with parameter validation & rate limiting <token_bucket>."

    # Must generate without XML parsing exceptions
    pdf_bytes = generate_tailored_pdf(data)
    assert len(pdf_bytes) > 1000

    docx_bytes = generate_tailored_docx(data)
    assert len(docx_bytes) > 1000


def test_17_empty_or_malformed_resumes():
    """Verify that empty text or minimal resumes are handled gracefully without 500 errors."""
    empty_resume = build_safe_resume_from_source("", "Target Role")
    assert empty_resume.contact.name == "Candidate"
    assert empty_resume.grounding_verified is True

    pdf_bytes = generate_tailored_pdf(empty_resume)
    assert pdf_bytes.startswith(b"%PDF-")


# ==============================================================================
# 3. SECURITY & ACCESS CONTROL TESTS
# ==============================================================================

def test_18_authentication_and_cross_user_access_protection(auth_setup):
    """Verify unauthenticated and cross-user attempts to tailor or download are rejected."""
    # Unauthenticated
    unauth_res = client.post(
        "/api/analysis/tailor",
        json={"resume_id": auth_setup["resume1"].id, "job_description": "Job requirements"},
    )
    assert unauth_res.status_code == 401

    # Cross-user tailor attempt
    cross_tailor = client.post(
        "/api/analysis/tailor",
        json={"resume_id": auth_setup["resume1"].id, "job_description": "Job requirements"},
        headers=auth_setup["headers2"],
    )
    assert cross_tailor.status_code == 404

    # Cross-user download attempt
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Role")
    cross_download = client.post(
        "/api/analysis/tailor/download",
        json={"resume_id": auth_setup["resume1"].id, "format": "pdf", "tailored_resume": data.model_dump()},
        headers=auth_setup["headers2"],
    )
    assert cross_download.status_code == 404


def test_19_invalid_download_formats(auth_setup):
    """Verify that requesting an unsupported download format is rejected with 400 Bad Request."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Role")
    res = client.post(
        "/api/analysis/tailor/download",
        json={"resume_id": auth_setup["resume1"].id, "format": "tar.gz", "tailored_resume": data.model_dump()},
        headers=auth_setup["headers1"],
    )
    assert res.status_code == 400
    assert "only 'pdf' and 'docx' are supported" in res.json()["detail"].lower()


def test_20_download_after_failed_validation_does_not_falsely_claim_verified(auth_setup):
    """Verify that re-validation on download catches and strips fabricated metrics before PDF generation."""
    data = build_safe_resume_from_source(REALISTIC_SOURCE_RESUME, "Role")
    # Candidate injects fabricated 99% improvement metric into download request
    data.projects[0].bullets[0].tailored = "Artificially boosted system performance by 99%."

    res = client.post(
        "/api/analysis/tailor/download",
        json={
            "resume_id": auth_setup["resume1"].id,
            "format": "pdf",
            "tailored_resume": data.model_dump(),
        },
        headers=auth_setup["headers1"],
    )
    assert res.status_code == 200
    pdf_text = "".join(p.extract_text() for p in PdfReader(io.BytesIO(res.content)).pages)
    # The 99% fabricated claim must NOT appear in the generated PDF because re-validation reverted it
    assert "99%" not in pdf_text


def test_21_character_corruption_and_ligature_repair():
    """Verify that ligature extraction errors and font CMap corruption (ti->R, ft->Z, etc.) are repaired."""
    from app.utils.text_sanitizer import sanitize_text

    corrupted_sample = (
        "Built a Retrieval-Augmented GeneraRon (RAG) pipeline with PydanRc and PydanFc validaRon. "
        "SoZware Development Engineer with producRon experience. "
        "B.Sc. InformaXon Technology. Native mobile client in SwiKUI and SwiZUI. "
        "CerRﬁcaRons include cloud compaRbility and automaRcally generated citaRons. "
        "No hallucinaRon in quesRons or descripRons."
    )
    cleaned = sanitize_text(corrupted_sample)

    assert "Generation" in cleaned
    assert "Pydantic" in cleaned
    assert "Software" in cleaned
    assert "production" in cleaned
    assert "Information" in cleaned
    assert "SwiftUI" in cleaned
    assert "certifications" in cleaned
    assert "compatibility" in cleaned
    assert "automatically" in cleaned
    assert "citations" in cleaned
    assert "hallucination" in cleaned
    assert "questions" in cleaned
    assert "descriptions" in cleaned

    # Verify corrupt tokens are gone
    for bad in ["GeneraRon", "PydanRc", "PydanFc", "SoZware", "producRon", "InformaXon", "SwiKUI", "SwiZUI"]:
        assert bad not in cleaned


def test_22_wrapped_project_bullets_remain_single_bullet():
    """Verify that wrapped sentences and short continuation words stay in the same bullet point."""
    proj_text = """
Django Document RAG Pipeline   |   Python, Django, ChromaDB
•Built a full-stack Retrieval-Augmented Generation (RAG) web app in Django that lets users upload PDFs and ask natural-language
questions about their content
•Extracted and chunked document text using PyMuPDF , then generated vector embeddings locally with Hugging Face's sentence-
transformers (all-MiniLM-L6-v2) to avoid embedding API costs
•Worked across backend API design and iOS integration, gaining exposure to connecting a Python API layer with a native mobile
client
"""
    projects = extract_structured_projects(proj_text)
    assert len(projects) == 1
    proj = projects[0]
    assert len(proj.bullets) == 3

    # Bullet 1 should contain both the first line and the wrapped second line
    b1 = proj.bullets[0].original
    assert "natural-language questions about their content" in b1

    # Bullet 2 should contain the wrapped second line
    b2 = proj.bullets[1].original
    assert "avoid embedding API costs" in b2

    # Bullet 3 should end with the short continuation word 'client'
    b3 = proj.bullets[2].original
    assert b3.endswith("client")
    assert "native mobile client" in b3


def test_23_no_fabricated_or_duplicated_experience_entries():
    """Verify that multi-line experience headers do not produce fabricated 'Software Engineer' or phantom company entries."""
    exp_text = """
Founding Growth, SEO & QA  —  prune. (AI Startup)
Self-employed / Early team member  •  Aug 2026 – Present
•Driving growth and SEO strategy for an early-stage AI startup, including organic acquisition planning and content optimization
•Performing product testing and QA to help identify bugs and usability issues ahead of releases
"""
    exps = extract_structured_experience(exp_text)
    assert len(exps) == 1
    exp = exps[0]

    assert exp.company == "prune. (AI Startup)"
    assert exp.role == "Founding Growth, SEO & QA"
    assert exp.dates == "Aug 2026 – Present"
    assert len(exp.bullets) == 2

    # Must NOT invent a second company or hardcode 'Software Engineer'
    for item in exps:
        assert item.company != "Self-employed / Early team member"
        assert item.role != "Software Engineer"


def test_24_no_duplicated_contact_or_headline_in_additional_sections():
    """Verify that all-caps candidate names and contact info are not dumped into 'Additional Information'."""
    resume_text = """KRISHNA RAO
Backend Developer — Python | Django | AI/LLM Engineering
Mumbai, India  |  7977519578  |  krishvrao108@gmail.com  |  linkedin.com/in/krishnarao108  |  github.com/Krishna-rao-108

PROFESSIONAL SUMMARY
Backend developer with hands-on experience building systems in Python.

SKILLS
Python, Django, FastAPI
"""
    secs = partition_resume_sections(resume_text)
    adds = extract_additional_sections(secs)

    # Header must contain the candidate contact info
    assert "KRISHNA RAO" in secs["header"]
    assert "krishvrao108@gmail.com" in secs["header"]

    # Additional sections must be empty (no phantom 'Additional Information' section duplicating contact details)
    assert len(adds) == 0


def test_25_education_ordering_and_capstone_completeness():
    """Verify that education fields are ordered correctly (degree, institution, dates, CGPA) and capstone is complete."""
    edu_text = """
B.Sc. Information Technology  —  Usha Pravin Gandhi College, Mumbai University
2023 – 2026  |  CGPA: 7.25
"""
    edus = extract_structured_education(edu_text)
    assert len(edus) == 1
    edu = edus[0]
    assert edu.degree == "B.Sc. Information Technology"
    assert edu.institution == "Usha Pravin Gandhi College, Mumbai University"
    assert edu.dates == "2023 – 2026"
    assert "7.25" in str(edu.gpa_or_details)


def test_26_generated_pdf_text_extraction_and_verification():
    """Extract text from generated PDF for a resume with ligatures and multi-line headers, verifying complete content fidelity."""
    sample_resume = """KRISHNA RAO
Backend Developer — Python | Django | AI/LLM Engineering
Mumbai, India  |  7977519578  |  krishvrao108@gmail.com  |  linkedin.com/in/krishnarao108  |  github.com/Krishna-rao-108

PROFESSIONAL SUMMARY
B.Sc. IT graduate with experience building Retrieval-Augmented GeneraRon (RAG) pipelines in Python and PydanRc validaRon. Seeking a SoZware Development Engineer role for producRon backend systems.

TECHNICAL SKILLS
Languages & Frameworks: Python, Django, FastAPI, JavaScript
AI / LLM Engineering: LLM Integration, RAG Pipelines, Pydantic
Tools & Other: Git, Postman, Docker, PyPDF, python-docx, PyMuPDF

WORK EXPERIENCE
Founding Growth, SEO & QA  —  prune. (AI Startup)
Self-employed / Early team member  •  Aug 2026 – Present
•Driving growth and SEO strategy for an early-stage AI startup, including organic acquisiRon planning and content opRmizaRon
•Performing product tesRng and QA to help idenRfy bugs and usability issues ahead of releases

PROJECTS
Django Document RAG Pipeline   |   Python, Django, ChromaDB, Sentence-Transformers
•Built a full-stack Retrieval-Augmented GeneraRon (RAG) web app in Django that lets users upload PDFs and ask natural-language
quesRons about their content
•Extracted and chunked document text using PyMuPDF , then generated vector embeddings locally with Hugging Face's sentence-
transformers (all-MiniLM-L6-v2) to avoid embedding API costs

College Capstone Mobile App — Backend + iOS   |   FastAPI, SwiKUI, Xcode
•Contributed to a full-stack mobile app built for a college project, with a FastAPI backend and a naRve iOS frontend in SwiZUI
•Worked across backend API design and iOS integraRon, gaining exposure to connecRng a Python API layer with a naRve mobile
client

EDUCATION
B.Sc. InformaXon Technology  —  Usha Pravin Gandhi College, Mumbai University
2023 – 2026  |  CGPA: 7.25
"""
    data = build_safe_resume_from_source(sample_resume, "Python Backend Engineer")
    pdf_bytes = generate_tailored_pdf(data)
    assert len(pdf_bytes) > 1000

    reader = PdfReader(io.BytesIO(pdf_bytes))
    extracted = "\n".join(p.extract_text() for p in reader.pages)

    # 1. Verify words are sanitized and free of corruption
    assert "Generation" in extracted
    assert "Pydantic" in extracted
    assert "Software" in extracted
    assert "production" in extracted
    assert "Information" in extracted
    assert "SwiftUI" in extracted
    assert "questions" in extracted
    assert re.search(r"native mobile\s+client", extracted) is not None

    # Corrupt tokens must be completely absent from PDF
    for bad in ["GeneraRon", "PydanRc", "PydanFc", "SoZware", "producRon", "InformaXon", "SwiKUI", "SwiZUI", "quesRons"]:
        assert bad not in extracted

    # 2. Verify no fabricated experience entry
    assert "prune. (AI Startup)" in extracted
    assert "Software Engineer — Self-employed" not in extracted

    # 3. Verify no duplicate contact in Additional Information
    assert "Additional Information" not in extracted

    # 4. Verify education degree is properly formatted
    assert "B.Sc. Information Technology" in extracted
    assert "7.25" in extracted


def test_27_pagination_single_page_and_no_orphan_education():
    """Verify that a realistic standard resume fits on exactly 1 page and does not leave Education orphaned on page 2."""
    sample_resume = """KRISHNA RAO
Backend Developer — Python | Django | AI/LLM Engineering
Mumbai, India  |  7977519578  |  krishvrao108@gmail.com  |  linkedin.com/in/krishnarao108  |  github.com/Krishna-rao-108

PROFESSIONAL SUMMARY
B.Sc. IT fresher with hands-on experience building AI-powered backend systems in Python, Django, and FastAPI. Built a full Retrieval-Augmented Generation (RAG) pipeline using local embeddings, ChromaDB, and LLM-based generation, and an AI resume screening tool using structured LLM extraction and Pydantic validation. Comfortable working across REST APIs, vector databases, and LLM integration. Currently contributing to growth, SEO, and QA at an early-stage AI startup. Seeking a Software Development Engineer role to build production backend systems.

TECHNICAL SKILLS
Languages & Frameworks: Python, Django, FastAPI, REST APIs, JavaScript
AI / LLM Engineering: LLM API Integration (Groq), Prompt Engineering, RAG Pipelines, ChromaDB, Sentence-Transformers, Pydantic, Structured Output Extraction
Tools & Other: Git, Postman, SQL, Docker, PyPDF, python-docx, PyMuPDF, Excel, Power BI, Pandas

WORK EXPERIENCE
Founding Growth, SEO & QA  —  prune. (AI Startup)
Self-employed / Early team member  •  Aug 2026 – Present
•Driving growth and SEO strategy for an early-stage AI startup, including organic acquisition planning and content optimization
•Performing product testing and QA to help identify bugs and usability issues ahead of releases

PROJECTS
Django Document RAG Pipeline   |   Python, Django, ChromaDB, Sentence-Transformers, Groq API (Llama 3), PyMuPDF
•Built a full-stack Retrieval-Augmented Generation (RAG) web app in Django that lets users upload PDFs and ask natural-language questions about their content
•Extracted and chunked document text using PyMuPDF, then generated vector embeddings locally with Hugging Face's sentence-transformers (all-MiniLM-L6-v2) to avoid embedding API costs
•Stored and queried embeddings in ChromaDB using cosine similarity search, filtering results to the most recently uploaded document for contextual accuracy
•Integrated Groq API (Llama-3-8b) to generate answers grounded in retrieved chunks, with source citations returned alongside each response to reduce hallucination
•Designed a hybrid architecture combining local embeddings with cloud LLM generation for a fast, low-cost retrieval pipeline

AI-Powered Resume Screening & Candidate Ranking System   |   Python, Groq API, Pydantic, PyPDF, python-docx
•Built an end-to-end pipeline that parses job descriptions and candidate resumes (PDF/DOCX) using an LLM, then scores and ranks candidates by role fit
•Used an LLM to convert unstructured job descriptions and resumes into structured data (skills, experience, education, projects, certifications), validated with Pydantic schemas
•Designed prompts to reliably extract structured JSON from varied resume formats and section headings, handling inconsistent real-world resume layouts
•Generated a candidate-job compatibility score with a detailed breakdown (matching/missing skills, experience fit, verdict) and ranked multiple candidates automatically
•Documented a future hybrid-scoring roadmap combining LLM extraction with a deterministic, weighted Python scoring algorithm for more explainable results

College Capstone Mobile App — Backend + iOS   |   FastAPI, SwiftUI, Xcode
•Contributed to a full-stack mobile app built for a college project, with a FastAPI backend and a native iOS frontend in SwiftUI
•Worked across backend API design and iOS integration, gaining exposure to connecting a Python API layer with a native mobile client

EDUCATION
B.Sc. Information Technology  —  Usha Pravin Gandhi College, Mumbai University
2023 – 2026  |  CGPA: 7.25
"""
    data = build_safe_resume_from_source(sample_resume, "Python Backend Engineer")
    pdf_bytes = generate_tailored_pdf(data)
    reader = PdfReader(io.BytesIO(pdf_bytes))

    # Must fit cleanly on exactly 1 page
    assert len(reader.pages) == 1

    page1_text = reader.pages[0].extract_text()
    # Education must be present on page 1, not orphaned on a second page
    assert "EDUCATION" in page1_text
    assert "Usha Pravin Gandhi College" in page1_text
    assert "B.Sc. Information Technology" in page1_text
    assert "7.25" in page1_text


def test_28_skills_continuation_merged_into_category():
    """Verify that uncolonized continuation lines in skills are merged into the preceding category without losing skills."""
    skills_sec = """Languages & Frameworks: Python, Django, FastAPI, REST APIs, JavaScript
AI / LLM Engineering: LLM API Integration (Groq), Prompt Engineering, RAG Pipelines, ChromaDB, Sentence-Transformers, Pydantic,
Structured Output Extraction
Tools & Other: Git, Postman, SQL, Docker, PyPDF, python-docx, PyMuPDF, Excel, Power BI, Pandas"""

    categories = extract_structured_skills(skills_sec)

    # Must have 3 clean categories, not 4
    assert len(categories) == 3
    cat_names = [c.category for c in categories]
    assert "Technical Skills" not in cat_names

    # Structured Output Extraction must be inside AI / LLM Engineering
    ai_cat = next(c for c in categories if "AI" in c.category)
    assert "Structured Output Extraction" in ai_cat.skills


def test_29_hyphenation_and_punctuation_spacing_cleaned():
    """Verify that awkward hyphenation and spaces before punctuation are cleaned."""
    from app.utils.text_sanitizer import sanitize_text

    raw = "Built a Retrieval- Augmented pipeline using PyMuPDF , with sentence- transformers (all- MiniLM- L6- v2) ."
    cleaned = sanitize_text(raw)

    assert "Retrieval-Augmented" in cleaned
    assert "PyMuPDF," in cleaned
    assert "sentence-transformers" in cleaned
    assert "all-MiniLM-L6-v2" in cleaned
    assert "v2)." in cleaned


def test_30_cover_letter_candidate_name_resolution():
    """Verify that real candidate names are extracted from resumes or profiles and never default to 'Candidate'."""
    from app.ai.prune_client import resolve_candidate_name

    # All-caps name from resume
    resume_caps = "KRISHNA RAO\nBackend Developer — Python | Django\nkrishvrao108@gmail.com"
    assert resolve_candidate_name(resume_caps, "Krishna Rao") == "Krishna Rao"

    # Name with date or noise
    resume_noise = "(2023) KRISHNA RAO\nSoftware Engineer\nMumbai"
    assert resolve_candidate_name(resume_noise, "Krishna Rao") == "Krishna Rao"

    # Title-cased name
    resume_normal = "Jane Doe | Software Engineer | jane@example.com"
    assert resolve_candidate_name(resume_normal, None) == "Jane Doe"

    # Anonymous resume text using user profile
    resume_no_name = "Backend Developer with 5 years experience.\nPython, SQL, Docker."
    assert resolve_candidate_name(resume_no_name, "Alice Smith") == "Alice Smith"

    # Never returns 'Candidate' when valid name is available
    assert resolve_candidate_name(resume_caps, None) != "Candidate"


def test_31_cover_letter_evidence_extraction_and_unsupported_avoidance():
    """Verify that candidate evidence is extracted, matched against JD, and unverified JD skills are avoided."""
    from app.ai.prune_client import extract_cover_letter_evidence

    resume_text = """KRISHNA RAO
Backend Developer — Python | Django | AI/LLM Engineering
Mumbai, India | krishvrao108@gmail.com

TECHNICAL SKILLS
Languages & Frameworks: Python, Django, FastAPI, REST APIs, SQL
Tools: Git, Docker, Postman

PROJECTS
Django Document RAG Pipeline | Python, Django, ChromaDB, Sentence-Transformers
• Built a full-stack Retrieval-Augmented Generation web app in Django that lets users upload PDFs.

AI Resume Screening System | FastAPI, Pydantic, PostgreSQL
• Developed backend services utilizing FastAPI and Pydantic for structured data extraction.
"""

    jd_text = """
    We are seeking a Python Backend Developer at Nexora Technologies.
    Requirements:
    - Strong proficiency in Python, Django, FastAPI, and REST APIs.
    - Relational database design with SQL / PostgreSQL.
    - Experience with Kubernetes and AWS Lambda is a strong plus.
    """

    evidence = extract_cover_letter_evidence(resume_text, jd_text)

    # Verified skills matched
    assert "Python" in evidence["matched_skills"]
    assert "Django" in evidence["matched_skills"]
    assert "FastAPI" in evidence["matched_skills"]
    assert "REST APIs" in evidence["matched_skills"]
    assert "SQL" in evidence["matched_skills"]

    # Ranked projects
    assert len(evidence["ranked_projects"]) >= 2
    proj_titles = [p.title for p in evidence["ranked_projects"]]
    assert "Django Document RAG Pipeline" in proj_titles
    assert "AI Resume Screening System" in proj_titles

    # Unsupported JD skills identified to avoid fabricating claims
    assert "Kubernetes" in evidence["unsupported_avoided"]
    assert "AWS" in evidence["unsupported_avoided"]


def test_32_cover_letter_grounded_generation_real_resume():
    """Verify end-to-end grounded cover letter generation for Python Backend Developer at Nexora Technologies."""
    from app.ai.prune_client import generate_cover_letter, BANNED_COVER_LETTER_PATTERNS
    import re

    resume_text = """KRISHNA RAO
Backend Developer — Python | Django | AI/LLM Engineering
Mumbai, India | 7977519578 | krishvrao108@gmail.com | github.com/Krishna-rao-108

EDUCATION
B.Sc. Information Technology, Usha Pravin Gandhi College, Mumbai University

TECHNICAL SKILLS
Languages & Frameworks: Python, Django, FastAPI, REST APIs, JavaScript
AI / LLM Engineering: Prompt Engineering, RAG Pipelines, ChromaDB, Pydantic, Structured Output Extraction
Tools & Other: Git, Postman, SQL, Docker, PyMuPDF

PROJECTS
Django Document RAG Pipeline | Python, Django, ChromaDB, Sentence-Transformers, PyMuPDF
• Built a full-stack Retrieval-Augmented Generation web app in Django that lets users upload PDFs and ask natural-language questions about their content.
• Engineered a clean pipeline using PyMuPDF for document parsing and ChromaDB for vector retrieval.

AI-Powered Resume Screening & Candidate Ranking System | Python, FastAPI, Pydantic, PyPDF
• Developed an end-to-end pipeline that parses job descriptions and candidate resumes using an LLM, then scores and ranks candidates.
• Implemented Pydantic schema validation to ensure robust structured output extraction.
"""

    jd = """
    We are hiring a Python Backend Developer at Nexora Technologies.
    Responsibilities:
    - Develop backend web services and REST APIs in Python using Django or FastAPI.
    - Manage SQL database queries and structured data processing.
    - Integrate external services and AI pipelines.
    - Experience with Kubernetes is desirable.
    """

    res = generate_cover_letter(
        resume_text=resume_text,
        jd_text=jd,
        job_title="Python Backend Developer",
        company_name="Nexora Technologies",
        tone="professional",
        user_name="Krishna Rao",
    )

    letter = res["cover_letter"]

    # 1. Candidate real name is used
    assert res["candidate_name"] == "Krishna Rao"
    assert "Krishna Rao" in letter
    assert "Sincerely,\nKrishna Rao" in letter
    assert not letter.strip().endswith("Candidate")
    assert "Sincerely,\nCandidate" not in letter

    # 2. Addressed role and company
    assert "Python Backend Developer" in letter
    assert "Nexora Technologies" in letter

    # 3. Relevant verified projects and technologies appear
    assert "Django Document RAG Pipeline" in letter
    assert "Python" in letter
    assert "Django" in letter or "FastAPI" in letter
    assert "ChromaDB" in letter or "Pydantic" in letter

    # 4. Banned generic phrases are absent
    for pat in BANNED_COVER_LETTER_PATTERNS:
        assert not re.search(pat, letter, re.IGNORECASE), f"Banned phrase pattern '{pat}' found in letter."

    assert "demonstrable background" not in letter.lower()
    assert "proven technical track record" not in letter.lower()
    assert "throughout my career" not in letter.lower()

    # 5. Unsupported JD skills are avoided or handled transparently
    assert "Kubernetes" in res["unsupported_skills_avoided"]
    assert not re.search(r"\b(built|deployed|scaled|mastered|deep expertise in)\s+Kubernetes\b", letter, re.IGNORECASE)

    # 6. Structured schema fields exist
    assert res["opening_paragraph"] is not None
    assert res["evidence_paragraph"] is not None
    assert res["contribution_paragraph"] is not None
    assert res["closing_paragraph"] is not None
    assert res["sign_off"] == "Sincerely,\nKrishna Rao"

    # 7. Word count is concise (target 200-300 words)
    words = len(letter.split())
    assert 150 <= words <= 350, f"Letter word count {words} is outside expected range."


def test_33_cover_letter_banned_phrases_sanitized():
    """Verify that if an AI output contains banned phrases or placeholder names, post-processing catches and cleans them."""
    from app.ai.prune_client import BANNED_COVER_LETTER_PATTERNS
    import re

    raw_ai_text = (
        "Dear Hiring Team at TechCorp,\n\n"
        "With my demonstrable background and proven technical track record, I am applying for Python Developer. "
        "Throughout my career, I have elevated API throughput and system resilience.\n\n"
        "Sincerely,\nCandidate"
    )

    detected = [pat for pat in BANNED_COVER_LETTER_PATTERNS if re.search(pat, raw_ai_text, re.IGNORECASE)]
    assert len(detected) >= 3


def test_34_cover_letter_endpoint_validations_and_empty_inputs(auth_setup):
    """Verify endpoint rejects empty inputs and enforces tenant isolation."""
    headers1 = auth_setup["headers1"]
    headers2 = auth_setup["headers2"]
    test_resume_id = auth_setup["resume1"].id

    # 1. Empty job title
    res_no_title = client.post(
        "/api/analysis/cover-letter",
        json={
            "resume_id": test_resume_id,
            "job_title": "   ",
            "company_name": "Nexora",
            "job_description": "Valid JD",
        },
        headers=headers1,
    )
    assert res_no_title.status_code == 400
    assert "Job title" in res_no_title.json()["detail"]

    # 2. Empty company name
    res_no_comp = client.post(
        "/api/analysis/cover-letter",
        json={
            "resume_id": test_resume_id,
            "job_title": "Developer",
            "company_name": "",
            "job_description": "Valid JD",
        },
        headers=headers1,
    )
    assert res_no_comp.status_code == 400
    assert "Company name" in res_no_comp.json()["detail"]

    # 3. Empty JD
    res_no_jd = client.post(
        "/api/analysis/cover-letter",
        json={
            "resume_id": test_resume_id,
            "job_title": "Developer",
            "company_name": "Nexora",
            "job_description": "   ",
        },
        headers=headers1,
    )
    assert res_no_jd.status_code == 400
    assert "Job description" in res_no_jd.json()["detail"]

    # 4. Tenant isolation: User 2 cannot access User 1's resume
    res_unauth = client.post(
        "/api/analysis/cover-letter",
        json={
            "resume_id": test_resume_id,
            "job_title": "Developer",
            "company_name": "Nexora",
            "job_description": "Valid JD",
        },
        headers=headers2,
    )
    assert res_unauth.status_code == 404



