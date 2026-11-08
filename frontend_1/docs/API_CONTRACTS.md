# API contracts needed from the FastAPI backend

The frontend runs on **demo data** until `VITE_API_BASE_URL` is set. All calls live in
`src/lib/api/services.ts`; types in `src/lib/api/types.ts`. Paths below are **proposed** —
replace with the real ones from the backend repo. No AI provider is called from the browser.

Auth: `Authorization: Bearer <JWT>` (token stored by `tokenStore` in `client.ts`). A `401` clears it.

| Capability | Method & path (proposed) | Request | Response type |
|---|---|---|---|
| Dashboard stats | `GET /api/dashboard/stats` | — | `DashboardStats` (nullable fields = omitted in UI) |
| List analyses | `GET /api/analyses` | — | `AnalysisSummary[]` |
| Get analysis | `GET /api/analyses/{id}` | — | `Analysis` |
| Upload resume | `POST /api/resumes` | multipart `file` (PDF/DOCX) | `Resume` |
| Run analysis | `POST /api/analyses` | `{ resume_id, job_description }` | `Analysis` |

Open questions: accepted file types/size limit, whether analysis is sync or job-based (polling),
whether `partial_skills`, `keywords`, `resume_text` are returned.

Not yet built (later phases): tailoring, cover letters, resume library, history, auth screens, settings.
