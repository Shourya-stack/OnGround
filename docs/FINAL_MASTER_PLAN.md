# TrueLine — Final Master Plan

**Status:** Authoritative — this document supersedes all prior documents where they conflict.

---

## Executive Summary

TrueLine is a B2B web application that converts messy construction progress data into structured, confidence-scored, schedule-linked project intelligence.

The core loop is:

Upload site data → LLM extracts structured activities → validation cleans and verifies them → embedding-based engine matches them to baseline schedule nodes → planner reviews ambiguous matches → actuals update → dashboard shows progress vs plan → every action is auditable.

The hackathon stack is:

React + Supabase + FastAPI + free-tier LLM API through a provider abstraction + sentence-transformers `all-MiniLM-L6-v2`.

The system supports local development and public hackathon deployment through GitHub, Vercel, and a cloud-hosted FastAPI backend.

---

## Product Architecture (locked)

```
React frontend
→ Supabase (Postgres, Storage, Auth, Realtime)
→ FastAPI monolith
→ LLM extraction (free-tier provider via abstraction layer)
→ Pydantic validation
→ deterministic confidence calculation
→ sentence-transformers all-MiniLM-L6-v2 embeddings
→ cosine/semantic matching + discipline/date contextual scoring
→ confidence banding
→ human review (planner confirm/reject)
→ schedule update
→ dashboard
→ audit trail (append-only)
```

## Core Workflow (locked)

```
Upload → Extract → Validate → Match → Review → Update → Visualize → Audit
```

---

## AI Architecture

### Extraction (LLM)

```
Raw text
→ LLM Provider Abstraction
→ Free-tier LLM API
→ Structured JSON
→ Pydantic validation
→ Deterministic confidence calculation
→ EXTRACTED_ACTIVITIES
```

The LLM is ONLY an extraction engine. It does NOT determine schedule-match confidence.

#### LLM Provider Abstraction

```
                    LLM SERVICE
                        │
              ┌─────────┴─────────┐
              │                   │
       Free-tier Provider     Future Provider
       (Hackathon MVP)       (Claude/Gemini/etc.)
```

The extraction service depends on a provider interface:

```
LLMProvider
    └── extract_activities(raw_text) → structured JSON
```

Provider/model selection is configurable through environment variables:

```env
LLM_PROVIDER=openrouter
LLM_MODEL=<selected-free-model>
OPENROUTER_API_KEY=<secret>
```

The system can switch models without changing extraction_service.py business logic.

**Current preferred provider:** OpenRouter free-tier/free-model routing, subject to availability verification at implementation time.

**Future:** Claude, Gemini, or other providers can be added without rewriting extraction business logic.

### Extraction Confidence (deterministic, post-LLM)

The LLM is NOT trusted to generate the final confidence score. Server-side calculation:

```
Base: 0.50
+ 0.30 if start_date is valid
+ 0.25 if discipline is recognized
+ 0.20 if activity_name is detailed (>20 chars)
+ 0.10 if start_time is provided
clamped to 0.0–1.0
```

### Matching (local embeddings — no LLM involvement)

```
sentence-transformers all-MiniLM-L6-v2
+ cosine similarity
+ discipline/date contextual scoring
+ confidence banding
```

No vector database. No RAG. No custom-trained model. In-memory cosine similarity at this project's scale.

---

## Deployment Architecture

### Local Development

```
localhost React
      ↓
localhost FastAPI
      ↓
Supabase Cloud
      ↓
Free LLM API
```

### Public Hackathon Deployment (IN SCOPE)

```
GitHub
   │
   ├── Frontend
   │      ↓
   │    Vercel
   │
   └── Backend
          ↓
     Cloud-hosted FastAPI
          │
          ├── Supabase
          └── Free-tier LLM API
```

The exact backend hosting provider will be selected during implementation based on current free-tier availability.

### NOT in scope

- AWS/GCP production infrastructure
- Kubernetes / Docker orchestration
- Terraform / infrastructure-as-code
- CI/CD pipeline
- Background workers / Celery / Redis

---

## Repository Structure

```
TrueLine/
├── frontend/
├── backend/
├── data/
├── docs/
├── README.md
├── .gitignore
└── .env.example
```

### Environment Variables

**Frontend (.env):**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```

**Backend (.env):**
```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
LLM_PROVIDER=
LLM_MODEL=
OPENROUTER_API_KEY=
```

No environment-specific hardcoded URLs. No secrets committed.

---

## Database (locked)

6 Supabase/Postgres tables — unchanged:

- `SCHEDULE_PLAN`
- `EXTRACTIONS`
- `EXTRACTED_ACTIVITIES`
- `SCHEDULE_MATCHES`
- `UNMATCHED_ACTIVITIES`
- `AUDIT_TRAIL`

---

## Auth (locked)

Supabase Auth. Two roles: `planner`, `supervisor`. RLS enforced at database level. Demo role-switcher for hackathon.

---

## What is NOT changing

- Supabase instead of SQLite
- FastAPI monolith instead of microservices
- Direct Supabase reads where appropriate
- Synchronous processing for v1
- No Celery/Redis
- Embeddings instead of FuzzyWuzzy
- all-MiniLM-L6-v2
- No custom-trained model
- No vector database
- No RAG for MVP
- Human-in-the-loop matching
- Confidence bands
- Disambiguation margin
- Baseline schedule immutability
- Audit trail (append-only)
- Supabase Auth
- Planner/supervisor roles
- RLS
- Synthetic demo data
- CSV/Excel baseline schedule import
- No live Primavera API
- No handwritten OCR
- No native mobile app

---

## Phase Plan

| Phase | Contents |
|---|---|
| 0. Planning | ✅ Complete |
| 1. Scaffolding | Git/GitHub, Supabase project, schema, RLS, Storage bucket, FastAPI skeleton, React skeleton, env vars, LLM provider abstraction |
| 2. Core backend | Upload endpoint, extraction service (LLM provider), matching service, confirm/reject |
| 3. Core frontend | Upload widget, reconciliation table, confidence badges, discipline sidebar |
| 4. Integration | Wire frontend ↔ backend ↔ Supabase Realtime, end-to-end flow |
| 5. Test data & evaluation | Synthetic reports + baseline schedule, run evaluation metrics |
| 6. Polish + demo deployment | UI polish, demo script, backup recording, GitHub production branch, Vercel frontend deployment, FastAPI backend deployment, end-to-end public URL test |
