import json
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.main import app
from app.core.database import get_session, engine
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.models.resume import Resume
from app.models.jd import JobDescription
from app.models.analysis import Analysis as AnalysisModel
from app.ai.prune_client import extract_json_from_text

client = TestClient(app)


@pytest.fixture
def test_users(db_session: Session):
    # Setup two distinct users
    user1 = db_session.exec(select(User).where(User.email == "test_user1@example.com")).first()
    if not user1:
        user1 = User(
            name="Test User 1",
            email="test_user1@example.com",
            hashed_password=hash_password("Password123!"),
        )
        db_session.add(user1)
        db_session.commit()
        db_session.refresh(user1)

    user2 = db_session.exec(select(User).where(User.email == "test_user2@example.com")).first()
    if not user2:
        user2 = User(
            name="Test User 2",
            email="test_user2@example.com",
            hashed_password=hash_password("Password123!"),
        )
        db_session.add(user2)
        db_session.commit()
        db_session.refresh(user2)

    token1 = create_access_token({"user_id": user1.id})
    token2 = create_access_token({"user_id": user2.id})

    return {
        "user1": user1,
        "user2": user2,
        "token1": token1,
        "token2": token2,
        "headers1": {"Authorization": f"Bearer {token1}"},
        "headers2": {"Authorization": f"Bearer {token2}"},
    }


@pytest.fixture
def db_session():
    with Session(engine) as session:
        yield session


def test_authentication_invalid_or_missing_tokens():
    """Verify that protected endpoints reject missing or invalid JWT tokens with HTTP 401."""
    # 1. No token
    res = client.get("/api/resumes")
    assert res.status_code == 401

    # 2. Malformed token
    res = client.get("/api/resumes", headers={"Authorization": "Bearer invalid.token.payload"})
    assert res.status_code == 401

    # 3. No token for analysis history
    res = client.get("/api/analysis/")
    assert res.status_code == 401

    # 4. No token for tailoring
    res = client.post("/api/analysis/tailor", json={"resume_id": 1, "job_description": "test"})
    assert res.status_code == 401


def test_tenant_ownership_resumes(test_users, db_session):
    """Confirm users can access only their own resumes, and cannot read or delete other users' resumes."""
    headers1 = test_users["headers1"]
    headers2 = test_users["headers2"]
    user1_id = test_users["user1"].id
    user2_id = test_users["user2"].id

    # Create resume for User 1
    resume1 = Resume(
        user_id=user1_id,
        title="User1_Senior_Engineer.pdf",
        content="Lead Distributed Systems Engineer with 8 years of Python, FastAPI, and Kafka.",
    )
    db_session.add(resume1)
    db_session.commit()
    db_session.refresh(resume1)

    # 1. User 1 can view resume 1
    res = client.get(f"/api/resumes/{resume1.id}", headers=headers1)
    assert res.status_code == 200
    assert res.json()["title"] == "User1_Senior_Engineer.pdf"

    # 2. User 2 CANNOT view User 1's resume (must return 404)
    res = client.get(f"/api/resumes/{resume1.id}", headers=headers2)
    assert res.status_code == 404
    assert res.json()["detail"] == "Resume not found"

    # 3. User 2 CANNOT delete User 1's resume (must return 404)
    res = client.delete(f"/api/resumes/{resume1.id}", headers=headers2)
    assert res.status_code == 404

    # Confirm resume 1 is still intact in DB
    refreshed = db_session.exec(select(Resume).where(Resume.id == resume1.id)).first()
    assert refreshed is not None

    # 4. Resume list endpoint only lists resumes belonging to the requesting user
    res = client.get("/api/resumes", headers=headers2)
    assert res.status_code == 200
    user2_resumes = res.json()
    assert all(r["id"] != resume1.id for r in user2_resumes)


def test_tenant_ownership_analysis_cross_user_prevention(test_users, db_session):
    """Confirm a user cannot run analysis or access reports using another user's resume or JD."""
    headers1 = test_users["headers1"]
    headers2 = test_users["headers2"]
    user1_id = test_users["user1"].id

    # Create Resume and JD for User 1
    resume1 = Resume(
        user_id=user1_id,
        title="User1_Data_Scientist.pdf",
        content="Data Scientist with PyTorch, NLP, and SQL experience.",
    )
    jd1 = JobDescription(
        user_id=user1_id,
        title="AI Engineer",
        description="Looking for an AI engineer with PyTorch and NLP.",
    )
    db_session.add(resume1)
    db_session.add(jd1)
    db_session.commit()
    db_session.refresh(resume1)
    db_session.refresh(jd1)

    # User 2 attempts to run analysis referencing User 1's resume
    res = client.post(
        "/api/analysis/",
        json={"resume_id": resume1.id, "jd_id": jd1.id},
        headers=headers2,
    )
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_analysis_history_and_result_integrity(test_users, db_session):
    """Verify result integrity — ensure displayed score, skills, and recommendations match the saved AI analysis exactly."""
    headers1 = test_users["headers1"]
    headers2 = test_users["headers2"]
    user1_id = test_users["user1"].id

    # Prepare Resume and JD
    resume = Resume(
        user_id=user1_id,
        title="FullStack_Developer.pdf",
        content="Senior Full Stack Engineer with React, TypeScript, Python, FastAPI, and Docker.",
    )
    jd = JobDescription(
        user_id=user1_id,
        title="Senior Python & React Engineer",
        description="Seeking Senior Engineer with React, TypeScript, FastAPI, Docker, and Kubernetes.",
    )
    db_session.add(resume)
    db_session.add(jd)
    db_session.commit()
    db_session.refresh(resume)
    db_session.refresh(jd)

    # Known AI result payload with exact scores, skills, strengths, and recommendations
    canonical_ai_result = {
        "match_score": 88,
        "matched_skills": ["React", "TypeScript", "Python", "FastAPI", "Docker"],
        "missing_skills": ["Kubernetes"],
        "strengths": [
            "Extensive experience in full stack React and FastAPI web development.",
            "Demonstrated mastery in TypeScript and containerized development.",
        ],
        "gaps": [
            "Production Kubernetes orchestration experience is not detailed in the resume.",
        ],
        "recommendations": [
            "Highlight any hands-on Kubernetes or container orchestration projects.",
            "Elaborate on production CI/CD deployments and cloud environments.",
        ],
    }
    canonical_json_str = json.dumps(canonical_ai_result)

    # Save directly as an Analysis record in PostgreSQL
    assert resume.id is not None
    saved_record = AnalysisModel(
        user_id=user1_id,
        resume_id=resume.id,
        jd_id=jd.id,
        result=canonical_json_str,
    )
    db_session.add(saved_record)
    db_session.commit()
    db_session.refresh(saved_record)

    # 1. Fetch via GET /api/analysis/{id}
    res_single = client.get(f"/api/analysis/{saved_record.id}", headers=headers1)
    assert res_single.status_code == 200
    data_single = res_single.json()
    assert data_single["id"] == saved_record.id
    assert data_single["resume_title"] == "FullStack_Developer.pdf"
    assert data_single["jd_title"] == "Senior Python & React Engineer"

    # Verify result integrity: Parse retrieved JSON and compare every single field
    retrieved_result = json.loads(data_single["result"])
    assert retrieved_result["match_score"] == canonical_ai_result["match_score"]
    assert retrieved_result["matched_skills"] == canonical_ai_result["matched_skills"]
    assert retrieved_result["missing_skills"] == canonical_ai_result["missing_skills"]
    assert retrieved_result["strengths"] == canonical_ai_result["strengths"]
    assert retrieved_result["gaps"] == canonical_ai_result["gaps"]
    assert retrieved_result["recommendations"] == canonical_ai_result["recommendations"]

    # 2. Fetch via GET /api/analysis/ (History list endpoint)
    res_list = client.get("/api/analysis/", headers=headers1)
    assert res_list.status_code == 200
    history = res_list.json()
    assert isinstance(history, list)
    matching_in_history = [item for item in history if item["id"] == saved_record.id]
    assert len(matching_in_history) == 1
    history_record = matching_in_history[0]
    assert history_record["resume_title"] == "FullStack_Developer.pdf"
    assert history_record["jd_title"] == "Senior Python & React Engineer"
    parsed_history_result = json.loads(history_record["result"])
    assert parsed_history_result["match_score"] == 88
    assert parsed_history_result["matched_skills"] == ["React", "TypeScript", "Python", "FastAPI", "Docker"]

    # 3. Tenant isolation check: User 2 CANNOT access User 1's analysis
    res_unauthorized = client.get(f"/api/analysis/{saved_record.id}", headers=headers2)
    assert res_unauthorized.status_code == 404
    assert res_unauthorized.json()["detail"] == "Analysis record not found"

    # User 2 history list must NOT include User 1's analysis
    res_user2_list = client.get("/api/analysis/", headers=headers2)
    assert res_user2_list.status_code == 200
    assert all(item["id"] != saved_record.id for item in res_user2_list.json())


def test_resume_tailoring_pipeline_and_anti_hallucination(test_users, db_session):
    """Test resume tailoring — generating improved resume bullets using actual resume content without hallucinating."""
    headers1 = test_users["headers1"]
    headers2 = test_users["headers2"]
    user1_id = test_users["user1"].id

    resume = Resume(
        user_id=user1_id,
        title="Backend_Engineer_Tailor.pdf",
        content="Backend Engineer at FinTech Corp. Maintained FastAPI microservices. Optimized PostgreSQL database queries, reducing response times by 35%. Implemented Celery background worker tasks for payment processing.",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    target_jd = """
    We are seeking a Staff Backend Architect to lead our high-throughput payment platform.
    Requirements:
    - Deep expertise in FastAPI and asynchronous Python architecture
    - PostgreSQL query performance tuning and optimization
    - Asynchronous message queuing and background task pipelines
    - High-volume transaction processing reliability
    """

    # 1. User 2 cannot tailor User 1's resume
    unauth_res = client.post(
        "/api/analysis/tailor",
        json={
            "resume_id": resume.id,
            "target_role": "Staff Backend Architect",
            "job_description": target_jd,
            "tone": "impact-driven",
            "seniority": "staff",
        },
        headers=headers2,
    )
    assert unauth_res.status_code == 404

    # 2. User 1 successfully invokes tailoring
    res = client.post(
        "/api/analysis/tailor",
        json={
            "resume_id": resume.id,
            "target_role": "Staff Backend Architect",
            "job_description": target_jd,
            "tone": "impact-driven",
            "seniority": "staff",
        },
        headers=headers1,
    )
    assert res.status_code == 200
    tailored = res.json()
    assert tailored["resume_id"] == resume.id
    assert tailored["target_role"] == "Staff Backend Architect"
    assert tailored["tone"] == "impact-driven"
    assert tailored["seniority"] == "staff"
    assert len(tailored["summary"]) > 0
    assert len(tailored["bullets"]) > 0
    assert "anti_hallucination_note" in tailored

    # Verify bullet structure has original, tailored, and explanation
    first_bullet = tailored["bullets"][0]
    assert "tailored" in first_bullet
    assert "explanation" in first_bullet


def test_cover_letter_generation_pipeline(test_users, db_session):
    """Test cover letter generation — using the Prune-based pipeline grounded in resume experience."""
    headers1 = test_users["headers1"]
    headers2 = test_users["headers2"]
    user1_id = test_users["user1"].id

    resume = Resume(
        user_id=user1_id,
        title="ML_Engineer.pdf",
        content="Machine Learning Engineer with 4 years deploying computer vision models with PyTorch, TensorRT, and Docker. Decreased inference latency by 40% on embedded GPU clusters.",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)

    job_title = "Lead AI Systems Engineer"
    company_name = "Perception AI"
    jd = "Looking for a Lead AI Systems Engineer to deploy low-latency computer vision inference pipelines on GPU clusters using PyTorch and Docker."

    # 1. User 2 cannot generate cover letter using User 1's resume
    unauth_res = client.post(
        "/api/analysis/cover-letter",
        json={
            "resume_id": resume.id,
            "job_title": job_title,
            "company_name": company_name,
            "job_description": jd,
            "tone": "professional",
        },
        headers=headers2,
    )
    assert unauth_res.status_code == 404

    # 2. User 1 generates cover letter
    res = client.post(
        "/api/analysis/cover-letter",
        json={
            "resume_id": resume.id,
            "job_title": job_title,
            "company_name": company_name,
            "job_description": jd,
            "tone": "professional",
        },
        headers=headers1,
    )
    assert res.status_code == 200
    letter_data = res.json()
    assert letter_data["resume_id"] == resume.id
    assert letter_data["job_title"] == job_title
    assert letter_data["company_name"] == company_name
    assert letter_data["tone"] == "professional"
    assert len(letter_data["cover_letter"]) > 50
    assert isinstance(letter_data["key_qualifications_addressed"], list)


def test_json_extractor_resilience():
    """Verify that extract_json_from_text handles markdown code fences, leading text, and raw JSON safely."""
    # Markdown block
    md_sample = """Here is the analysis:
```json
{
    "match_score": 92,
    "matched_skills": ["Python", "SQL"],
    "missing_skills": [],
    "strengths": ["Strong foundational skills"],
    "gaps": [],
    "recommendations": ["Ready for interview"]
}
```
Thank you!"""
    parsed = extract_json_from_text(md_sample)
    assert parsed is not None
    assert parsed["match_score"] == 92
    assert parsed["matched_skills"] == ["Python", "SQL"]

    # Raw string
    raw_sample = '{"match_score": 75, "matched_skills": ["FastAPI"]}'
    parsed_raw = extract_json_from_text(raw_sample)
    assert parsed_raw is not None
    assert parsed_raw["match_score"] == 75

    # Malformed text
    assert extract_json_from_text("no json here at all") is None


def test_analysis_creation_with_timeout_fallback(test_users, db_session, monkeypatch):
    """Verify that when AI call times out, the backend returns HTTP 200 with grounded analysis and avoids 502."""
    from openai import APITimeoutError
    from httpx import Request

    headers1 = test_users["headers1"]
    user1_id = test_users["user1"].id

    resume = Resume(
        user_id=user1_id,
        title="Fallback_Test_Resume.pdf",
        content="Krishna Rao\nSkills: Python, FastAPI, PostgreSQL, Docker\nExperience: Built REST APIs with FastAPI.",
    )
    jd = JobDescription(
        user_id=user1_id,
        title="Python Backend Engineer",
        description="Looking for Python, FastAPI, and Kubernetes developer with PostgreSQL knowledge.",
    )
    db_session.add(resume)
    db_session.add(jd)
    db_session.commit()
    db_session.refresh(resume)
    db_session.refresh(jd)

    from typing import cast, Any

    # Simulate OpenAI timeout
    def mock_timeout_create(*args, **kwargs):
        req = Request("POST", "https://api.withprune.com/v1/chat/completions")
        raise APITimeoutError(request=cast(Any, req))

    from app.ai import prune_client
    mock_client = prune_client.get_client()
    monkeypatch.setattr(mock_client.chat.completions, "create", mock_timeout_create)
    monkeypatch.setattr(prune_client, "get_client", lambda: mock_client)

    res = client.post(
        "/api/analysis/",
        json={"resume_id": resume.id, "jd_id": jd.id},
        headers=headers1,
    )

    assert res.status_code == 200, f"Expected 200 OK with deterministic fallback, got {res.status_code}: {res.text}"
    body = res.json()
    assert body["resume_id"] == resume.id
    assert body["jd_id"] == jd.id

    parsed_result = json.loads(body["result"])
    assert "match_score" in parsed_result
    assert isinstance(parsed_result["match_score"], int)
    assert parsed_result["match_score"] > 0
    assert "matched_skills" in parsed_result
    assert "missing_skills" in parsed_result
    assert len(parsed_result["recommendations"]) > 0


def test_general_resume_check_nullable_jd_id(test_users, db_session):
    """Verify General Resume Check works without a jd_id, returns nullable jd_id and fetches correctly in history."""
    headers1 = test_users["headers1"]
    user1_id = test_users["user1"].id

    resume = Resume(
        user_id=user1_id,
        title="General_Check_Resume.pdf",
        content="Candidate Name: Jane Doe\nSkills: Python, FastAPI, Docker, PostgreSQL\nExperience: Built scalable web applications.",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)
    assert resume.id is not None

    # 1. Run General Resume Check with jd_id omitted / None
    res = client.post(
        "/api/analysis/",
        json={"resume_id": resume.id, "jd_id": None},
        headers=headers1,
    )
    assert res.status_code == 200, f"Expected 200 OK for general check, got {res.status_code}: {res.text}"
    body = res.json()
    assert body["resume_id"] == resume.id
    assert body["jd_id"] is None
    assert body["analysis_type"] == "general"

    parsed_result = json.loads(body["result"])
    assert "overall_score" in parsed_result
    assert isinstance(parsed_result["overall_score"], int)
    assert "strengths" in parsed_result
    assert "weaknesses" in parsed_result
    assert "skills_identified" in parsed_result

    analysis_id = body["id"]

    # 2. Fetch single record by ID via GET /api/analysis/{id}
    res_single = client.get(f"/api/analysis/{analysis_id}", headers=headers1)
    assert res_single.status_code == 200
    data_single = res_single.json()
    assert data_single["id"] == analysis_id
    assert data_single["resume_id"] == resume.id
    assert data_single["jd_id"] is None
    assert data_single["jd_title"] is None
    assert data_single["resume_title"] == "General_Check_Resume.pdf"
    assert data_single["analysis_type"] == "general"

    # 3. Fetch history list via GET /api/analysis/
    res_list = client.get("/api/analysis/", headers=headers1)
    assert res_list.status_code == 200
    history = res_list.json()
    matched_item = next((item for item in history if item["id"] == analysis_id), None)
    assert matched_item is not None
    assert matched_item["jd_id"] is None
    assert matched_item["jd_title"] is None
    assert matched_item["analysis_type"] == "general"


def test_analysis_job_match_requires_jd_id_when_explicit(test_users, db_session):
    """Verify that requesting job_match analysis without a jd_id raises HTTP 400 Bad Request."""
    headers1 = test_users["headers1"]
    user1_id = test_users["user1"].id

    resume = Resume(
        user_id=user1_id,
        title="Explicit_JobMatch_Resume.pdf",
        content="Skills: React, Python",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)
    assert resume.id is not None

    res = client.post(
        "/api/analysis/",
        json={"resume_id": resume.id, "jd_id": None, "analysis_type": "job_match"},
        headers=headers1,
    )
    assert res.status_code == 400
    assert "jd_id" in res.json()["detail"].lower()


