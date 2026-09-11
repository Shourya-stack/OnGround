# OnGround — Tech Stack

## Frontend

- **React** — UI framework for the reconciliation dashboard.
- **Supabase JS client** — used directly from React for all plain CRUD (reading activities, matches, audit trail, baseline schedule) — no backend hop needed for reads/simple writes.
- **Supabase Realtime** — subscribed on `EXTRACTED_ACTIVITIES` and `SCHEDULE_MATCHES` so the dashboard updates live as extraction/matching runs, without polling.

## Backend

- **FastAPI** (Python) — handles only the logic Supabase can't do on its own: file upload orchestration, calling the LLM for extraction, running the matching algorithm, and confirm/reject actions that need to also write an audit trail entry atomically.
- Deliberately thin — most of the app's data access happens directly from the frontend via Supabase, keeping the custom backend surface small (see `API.md`).

## Database & Storage

- **Supabase (Postgres)** — 6 tables: `EXTRACTED_ACTIVITIES`, `SCHEDULE_MATCHES`, `UNMATCHED_ACTIVITIES`, `AUDIT_TRAIL`, `EXTRACTIONS`, `SCHEDULE_PLAN` (see `DATABASE.md`).
- **Supabase Storage** — holds uploaded daily reports/spreadsheets (raw files), referenced by ID from the `EXTRACTIONS` table.
- **Supabase Auth** — planner vs. supervisor role, via a `role` column on the user profile (see `AUTH.md`).

## AI / ML

- **LLM (free-tier API via provider abstraction)** — extraction: unstructured report text → structured activity JSON. The extraction service depends on a provider interface, not a specific vendor SDK. Provider and model are selected via environment variables (`LLM_PROVIDER`, `LLM_MODEL`). Hackathon MVP preferred provider: OpenRouter free-tier/free-model routing, subject to availability at implementation time. FUTURE: Claude, Gemini, or other paid providers can be added without rewriting extraction business logic. See `DECISION_LOG.md` D11.
- **sentence-transformers (`all-MiniLM-L6-v2`)** — local, free, CPU-only embedding model for fuzzy matching extracted activities against baseline schedule nodes.
- No custom-trained models, no vector database — in-memory cosine similarity is sufficient at this project's scale (see AI docs for full rationale).

## Source Control & Deployment

- **GitHub** — source control and deployment pipeline. See `DECISION_LOG.md` D12, D13.
- **Vercel** — frontend deployment for public hackathon demo.
- **Cloud-hosted FastAPI** — backend deployment (exact provider selected during implementation based on free-tier availability).
- The same codebase supports local development and public cloud deployment via environment variables — no hardcoded URLs.

## Why this combination

The whole stack is chosen to minimize boilerplate for a fast, iterative build: Supabase's auto-generated REST API + client SDK removes the need to hand-write CRUD endpoints, so the only backend code that has to be written by hand is the part that's genuinely custom — the AI pipeline itself. The LLM provider abstraction ensures zero lock-in to any paid API during the hackathon build.

## Explicitly not used

- No message queue / background job system (Celery, Redis) — all operations are synchronous request/response; the project's scale doesn't need async job orchestration.
- No microservices — one FastAPI app, internally organized into modules (see `ARCHITECTURE.md`).
- No custom auth system — Supabase Auth covers it.
- No vector database — in-memory similarity at this scale.
- No AWS/GCP production infrastructure — hackathon deployment uses Vercel + a cloud-hosted backend, not enterprise infrastructure.
