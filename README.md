# Enterprise-Safe ATS Analyzer

A production-grade, privacy-first Applicant Tracking System (ATS) screening platform designed for talent acquisition teams and job seekers.

Built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and powered by a high-performance **FastAPI** backend with PostgreSQL and Prune AI.

---

## Architecture Overview

```text
┌─────────────────────────────────┐
│     React + TypeScript + Vite   │
│   (Port 5173 / Production Build)│
└────────────────┬────────────────┘
                 │  REST API (JWT Bearer Auth)
                 ▼
┌─────────────────────────────────┐
│       FastAPI Microservice      │
│   (Port 8000 / Starlette CORS)  │
└───────┬─────────────────┬───────┘
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │   Prune AI   │
│  (SQLModel)  │   │(Ollama/Bedrock)
└──────────────┘   └──────────────┘
```

> **Security & Privacy Guarantee**: Every AI request is executed through the FastAPI backend gateway. Browser client code never interacts with external LLM APIs, and zero secrets or API keys are exposed to the browser.

---

## Quickstart Guide

### 1. Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+) & virtualenv
- PostgreSQL database
- Ollama or remote AI endpoint (via Prune)
- **Tesseract OCR (for scanned & image-based PDF resumes)**:
  - **macOS**: `brew install tesseract`
  - **Ubuntu / Debian**: `sudo apt-get update && sudo apt-get install -y tesseract-ocr libtesseract-dev`
  - **Docker / Production**:
    ```dockerfile
    RUN apt-get update && apt-get install -y tesseract-ocr && rm -rf /var/lib/apt/lists/*
    ```

### 2. Running the Backend
From the repository root:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be live at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Running the Frontend
From the repository root:
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server will launch at `http://localhost:5173`.

To verify TypeScript and create a production build:
```bash
npm run build
```

---

## Feature Matrix & Implementation Status

| Feature | Frontend Status | Backend Endpoint | Status Note |
|---|---|---|---|
| **User Registration** | Complete | `POST /api/auth/signup` | Full end-to-end integration |
| **JWT Authentication** | Complete | `POST /api/auth/login` | Bearer token stored & managed safely |
| **Current User Check** | Complete | `GET /api/auth/me` | Hydrates active session identity |
| **Resume Upload** | Complete | `POST /api/resumes/upload` | Multipart 5MB limit, PDF & DOCX validation |
| **List User Resumes** | Complete | `GET /api/resumes` | Real-time resume document library |
| **View Resume Content** | Complete | `GET /api/resumes/{id}` | Modal displaying backend parsed text |
| **Delete Resume** | Complete | `DELETE /api/resumes/{id}` | Real deletion with confirmation modal |
| **Job Description Save** | Complete | `POST /api/jd/` | Title & description registered in DB |
| **ATS AI Analysis** | Complete | `POST /api/analysis/` | End-to-end AI parse & compatibility scoring |
| **Interactive Results** | Complete | Real API Payload | Animated circular score, skills, gaps, advice |
| **Analysis History** | Complete | `GET /api/analysis/` | Real PostgreSQL history with tenant isolation |
| **Resume Tailoring** | Complete | `POST /api/analysis/tailor` | Factual reformulations without hallucination |
| **Cover Letter Generator**| Complete | `POST /api/analysis/cover-letter` | Tailored letters grounded in resume background |
| **Account Settings** | Complete | Local preferences + JWT | Privacy settings & service health check |

---

## Directory Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── analysis/     # MatchScore, SkillsList, KeywordGaps, Recommendations
│   │   ├── layout/       # AppLayout, Sidebar, Topbar, MobileNav
│   │   └── ui/           # Button, Card, Input, Textarea, Badge, Modal, Skeleton, EmptyState, Toast
│   ├── context/          # AuthContext (JWT session state)
│   ├── hooks/            # useAuth, useResumes
│   ├── lib/              # utils, cn, parseAnalysisResult (resilient JSON parsing)
│   ├── pages/            # Login, Signup, Dashboard, AnalyzeResume, AnalysisResults, MyResumes, etc.
│   ├── services/         # apiClient, authService, resumeService, jdService, analysisService
│   └── types/            # auth, resume, jd, analysis TypeScript interfaces
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```
