# OnGround — Architecture

## Style: monolith with clean internal separation

One FastAPI app, not microservices. At hackathon scale, splitting extraction/matching/validation into separate deployed services would add network overhead, deployment complexity, and debugging surface without adding any real capability — the modularity that matters (being able to reason about and change one part without breaking another) comes from clean internal module boundaries, not from separate processes.

## High-level structure

```
┌─────────────────────────────────────────────────────────┐
│  React Frontend                                           │
│  - Dashboard, upload widget, reconciliation table          │
│  - Talks directly to Supabase for reads/simple writes       │
│  - Talks to FastAPI only for AI-pipeline actions             │
└───────────────┬─────────────────────────┬─────────────────┘
                │ (Supabase client)        │ (REST calls)
                ▼                          ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  Supabase                  │   │  FastAPI backend            │
│  - Postgres (6 tables)     │◄──┤  - upload.py                │
│  - Storage (raw files)     │   │  - extraction.py            │
│  - Auth (roles)            │   │    └── LLM Provider         │
│  - Realtime (live updates) │   │        └── Free-tier LLM    │
│                             │   │  - matching.py (embeddings) │
│                             │   │  - confirm_reject.py        │
└───────────────────────────┘   └───────────────────────────┘
```

## Backend module breakdown

```
app/
├── main.py                 # FastAPI app, route registration
├── routes/
│   ├── upload.py           # POST /upload
│   ├── extract.py          # POST /extract/{file_id}
│   ├── match.py            # POST /match/{activity_id}
│   └── review.py           # POST /match/{id}/confirm, /reject
├── services/
│   ├── extraction_service.py   # LLM call + prompt handling
│   ├── matching_service.py     # embedding + similarity + banding
│   └── audit_service.py        # writes AUDIT_TRAIL entries
├── llm/
│   ├── provider.py             # LLMProvider interface
│   └── openrouter.py           # free-tier provider implementation
├── models/
│   └── schemas.py          # Pydantic request/response models
└── db/
    └── supabase_client.py  # single Supabase client instance
```

Each route handler stays thin — it validates input, calls a service function, returns a response. All actual logic (prompting the LLM, running similarity, deciding a confidence band) lives in `services/`, so it's testable independent of the HTTP layer, per the testing approach in the LLD.

## Data flow (matches AI_WORKFLOW.md)

1. Frontend uploads file → `upload.py` → Supabase Storage, creates `EXTRACTIONS` row.
2. Frontend triggers `/extract/{file_id}` → `extraction_service.py` calls LLM provider → Pydantic validation → deterministic confidence calculation → writes `EXTRACTED_ACTIVITIES` rows.
3. Frontend (or extraction step, chained) triggers `/match/{activity_id}` → `matching_service.py` → writes `SCHEDULE_MATCHES` or `UNMATCHED_ACTIVITIES`.
4. Every write in steps 2-3 also calls `audit_service.py` to log the action.
5. Frontend reads results directly from Supabase (Realtime pushes updates as they land) — no polling needed.

## LLM provider abstraction

The extraction service depends on a provider interface (`llm/provider.py`), not on a specific vendor SDK. Provider and model are selected via environment variables (`LLM_PROVIDER`, `LLM_MODEL`). The hackathon MVP uses a free-tier provider (preferred: OpenRouter free-model routing, subject to availability). Claude or other paid providers can be added as additional implementations without changing extraction business logic. See `DECISION_LOG.md` D11.

## Deployment architecture

The same codebase supports both local development and public hackathon deployment (see `DECISION_LOG.md` D12, D13):

```
Local:  localhost React → localhost FastAPI → Supabase Cloud → Free LLM API
Public: Vercel React → cloud-hosted FastAPI → Supabase Cloud → Free LLM API
```

All URLs and secrets are environment-variable-driven — no hardcoded environment-specific values.

## Why validation and matching are separate services

A malformed or incomplete extraction (missing discipline, garbled text) is a different problem from a well-formed activity that just doesn't match anything in the plan. Keeping these as separate service functions means a validation failure and a "genuinely unmatched" result never get confused with each other in the data or the UI — they're different states with different resolutions.
