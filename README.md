# OnGround — Infrastructure Progress Intelligence System (IPIS)

> **SIH 2026 Problem Statement 26122:** Infrastructure Data Capture & Schedule-Linking

OnGround is an automated progress tracking and schedule-linking platform designed for EPC and infrastructure megaprojects. It bridges the critical gap between chaotic, unstructured daily site progress reports (PDFs, daily logs, spreadsheets, notes) and rigid project schedules (Primavera P6 / baseline WBS).

---

## Architecture Overview

OnGround uses a dual-engine architecture:
1. **Extraction Engine (LLM abstraction)**: Parses unstructured daily logs into normalized, structured activity entries with deterministic server-side confidence scoring.
2. **Matching Engine (`sentence-transformers`)**: Deterministic embedding-based cosine similarity with discipline & date filtering, contextual scoring, and 3-tier confidence banding (`auto_linked`, `pending_review`, `unmatched`).

```
Site Daily Reports (PDF/TXT/CSV/XLSX)
            │
            ▼
┌──────────────────────────────────────┐
│  FastAPI Backend                     │
│  ├── /upload                         │
│  ├── /extract (LLM Provider)         │
│  └── /match (sentence-transformers)  │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Supabase (PostgreSQL + Auth + RLS)  │
│  ├── SCHEDULE_PLAN                   │
│  ├── EXTRACTIONS                     │
│  ├── EXTRACTED_ACTIVITIES            │
│  ├── SCHEDULE_MATCHES                │
│  ├── UNMATCHED_ACTIVITIES            │
│  └── AUDIT_TRAIL (append-only)       │
└──────────────────┬───────────────────┘
                   │ Realtime WebSockets
                   ▼
┌──────────────────────────────────────┐
│  React + Vite Frontend               │
│  ├── Multi-Signal Confidence Badges  │
│  ├── Reconciliation Table            │
│  ├── Side-by-Side Disambiguation UI  │
│  └── Role Switcher (Planner/Superv.) │
└──────────────────────────────────────┘
```

---

## Repository Structure

```
SIH26122/
├── backend/            # FastAPI monolith (Python 3.10+)
│   ├── routes/         # upload, extract, match, review
│   ├── services/       # extraction, matching, audit
│   ├── llm/            # LLMProvider abstraction & OpenRouter integration
│   ├── models/         # Pydantic validation schemas
│   └── db/             # Supabase client and schema.sql
├── frontend/           # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/ # UI primitives, layout, reconciliation, review
│   │   ├── hooks/      # Realtime-enabled Supabase & API hooks
│   │   ├── lib/        # apiClient, supabaseClient, types
│   │   └── pages/      # Dashboard, Upload, Reconciliation, Review, etc.
├── docs/               # Technical architecture and master plans
└── data/               # Baseline schedules, synthetic test reports, demo datasets
```

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Configure SUPABASE_URL, SERVICE_KEY, OPENROUTER_API_KEY
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env       # Configure VITE_SUPABASE_URL, ANON_KEY, VITE_API_BASE_URL
npm run dev
```

---

## Documentation

- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md): Complete end-to-end implementation blueprint
- [`docs/FINAL_MASTER_PLAN.md`](docs/FINAL_MASTER_PLAN.md): Core system specification & locked architecture
- [`docs/DATABASE.md`](docs/DATABASE.md): Schema, relationships, indexes, and RLS policies
- [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md): Architectural decision records (D1–D13 locked)
