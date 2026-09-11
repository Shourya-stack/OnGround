# OnGround — Tasks

Flat task list for Phase 1-6 (see `PHASE.md`). Organized by phase, not by person — this is a solo-developer project, so work is sequential.

## Phase 1 — Scaffolding
- [ ] Initialize Git repository
- [ ] Create GitHub repository
- [ ] Create Supabase project, run schema from `DATABASE.md`
- [ ] Set up RLS policies per `DATABASE.md`
- [ ] Create Storage bucket for uploaded reports
- [ ] FastAPI skeleton: `main.py`, route files (empty handlers), `services/` folder structure per `ARCHITECTURE.md`
- [ ] LLM provider abstraction: `llm/provider.py` interface, initial free-tier implementation per `ARCHITECTURE.md`
- [ ] React skeleton: Vite setup, Supabase client, route structure
- [ ] Env vars wired: LLM provider/model/key, Supabase URL/anon key/service key, API base URL
- [ ] Add `.env.example` (no secrets committed)
- [ ] Add `.gitignore` (exclude `.env`, `node_modules`, `__pycache__`, etc.)
- [ ] Verify local frontend/backend connectivity

## Phase 2 — Core backend
- [ ] `POST /upload` — file → Storage, `EXTRACTIONS` row
- [ ] `extraction_service.py` — LLM provider call using structured prompt, Pydantic validation, deterministic confidence calculation, writes `EXTRACTED_ACTIVITIES`
- [ ] `POST /extract/{id}` — wires extraction service
- [ ] `matching_service.py` — embed, filter by discipline/date, cosine similarity, confidence banding per `AI_WORKFLOW.md`
- [ ] `POST /match/{id}` — wires matching service, writes `SCHEDULE_MATCHES` / `UNMATCHED_ACTIVITIES`
- [ ] `POST /match/{id}/confirm` and `/reject` — status update + `audit_service.py` call

## Phase 3 — Core frontend
- [ ] Upload widget (`COMPONENTS.md` spec)
- [ ] Reconciliation table with confidence badges
- [ ] Discipline sidebar filter
- [ ] Row expand → audit trail view
- [ ] Disambiguation review UI (side-by-side candidates)
- [ ] Empty/loading/error states per `UI_STATES.md`

## Phase 4 — Integration
- [ ] Supabase Realtime subscription on `EXTRACTED_ACTIVITIES` / `SCHEDULE_MATCHES`
- [ ] Full upload → extract → match → review flow working end-to-end
- [ ] Role-based views (planner vs. supervisor) per `AUTH.md`
- [ ] Demo-day role switcher

## Phase 5 — Test data & evaluation
- [ ] Write 20-30 synthetic daily reports/spreadsheet rows across 6 disciplines
- [ ] Write synthetic 20-30 item baseline schedule (`SCHEDULE_PLAN`)
- [ ] Run extraction recall + field accuracy per `EVALUATION.md`
- [ ] Run matching top-1 accuracy + threshold calibration
- [ ] Fix threshold values if calibration shows overlap

## Phase 6 — Polish + demo deployment
- [ ] Visual QA pass against `DESIGN_SYSTEM.md`
- [ ] Accessibility spot-check per `ACCESSIBILITY.md`
- [ ] Write demo script (which test cases, in what order)
- [ ] Record a full working-demo video as live-demo fallback
- [ ] Run `QUALITY_CHECKLIST.md` before submission
- [ ] GitHub production-ready branch
- [ ] Vercel frontend deployment
- [ ] FastAPI backend deployment (cloud host)
- [ ] Wire production environment variables (Supabase, LLM provider, API base URL)
- [ ] End-to-end public URL test
- [ ] Verify local fallback still works

## Notes

This list is intentionally flat, not a Gantt chart — for a 36-hour build, sequencing within a phase matters more than exact scheduling. Check items off as you go; if a task turns out to need splitting, split it here rather than tracking sub-tasks elsewhere.
