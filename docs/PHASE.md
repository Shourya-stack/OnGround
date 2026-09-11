# OnGround — Phase

Living status file — update this whenever a phase completes or the plan changes. This is the single source of truth for "where are we right now," so anyone (or any AI agent) picking up the project mid-hackathon starts here.

## Current phase: **All Phases Complete (0 to 6) — OnGround IPIS Production & Hackathon Ready**

## Phase overview

| Phase | Status | Contents |
|---|---|---|
| 0. Planning | ✅ Complete | PS selection, HLD/LLD, `/DESIGN`, `/AI`, `/ENGINEERING`, `/AGENT` docs |
| 1. Scaffolding | ✅ Complete | Git repo init, Supabase schema.sql + RLS, FastAPI skeleton, LLM provider abstraction, React skeleton, layout & routes, env templates |
| 2. Core backend | ✅ Complete | OpenRouterProvider, extraction service, sentence-transformers matching service, confirm/reject endpoints, 17/17 unit tests passing |
| 3. Core frontend | ✅ Complete | All UI primitives, full Dashboard, UploadDropzone + Pipeline, ReconciliationTable + DisambiguationPanel, ReviewPage, AuditTimeline, SchedulePage |
| 4. Integration | ✅ Complete | Realtime subscriptions on all 5 data hooks, stale data recovery, demo role switcher localStorage syncing, X-User-Role header injection |
| 5. Test data & evaluation | ✅ Complete | Synthetic datasets (baseline schedule, piping/electrical/mixed reports), evaluation benchmark harness (100% recall, 100% accuracy, 0 false positives) |
| 6. Polish + demo deployment | ✅ Complete | D16 Render cloud decision, Vercel SPA routing (`vercel.json`), Dockerfile, Procfile, DEPLOYMENT.md, live hackathon DEMO_SCRIPT.md |


## What's done (Phase 2, 3, 4 & 5 detail)

- **Phase 2 (Core Backend):**
  - Implemented `OpenRouterProvider` with structured EPC prompt and fallback.
  - Implemented `ExtractionService` with multi-format parsing and deterministic confidence scoring.
  - Implemented `MatchingService` with `sentence-transformers` semantic embeddings, hybrid contextual scoring ($0.70 \times \text{sim} + 0.20 \times \text{conf} + 0.10 \times \text{date} - \text{penalty}$), 3-tier banding, and candidate disambiguation.
  - Implemented `routes/upload.py`, `routes/extract.py`, `routes/match.py`, and `routes/review.py` with Planner RBAC.
  - Implemented `services/audit_service.py` for immutable audit logging.
  - Executed 17/17 passing tests across all backend test suites.

- **Phase 3 (Core Frontend):**
  - Implemented all UI primitives: `ConfidenceBadge`, `StatusBadge`, `KPICard`, `DataTable`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `Toast`.
  - Implemented all data hooks: `useExtractions`, `useMatches`, `useSchedulePlan`, `useAuditTrail`, `useUnmatched`.
  - Implemented feature components: `ProgressSummary`, `DisciplineBreakdown`, `RecentUploads`, `UploadDropzone`, `UploadStatusCard`, `CandidateList`, `DisambiguationPanel`, `MatchRow`, `ReconciliationTable`, `ActivityDetailCard`, `ConfirmRejectBar`, `ReviewPanel`, `AuditTimeline`.
  - Implemented all full pages with role-awareness: `DashboardPage`, `UploadPage`, `ReconciliationPage`, `ReviewPage`, `UnmatchedPage`, `AuditPage`, `SchedulePage`, `LoginPage`.
  - Verified frontend production build (`npm run build` compiled cleanly with zero errors).

- **Phase 4 (Integration & Realtime):**
  - Added Supabase Realtime WebSocket listeners (`postgres_changes`) across all 5 data hooks.
  - Added automatic stale data recovery on WebSocket reconnection (`TIMED_OUT` / `CHANNEL_ERROR`).
  - Integrated demo role switcher with `localStorage` and `X-User-Role` header injection in `apiClient.ts` for end-to-end RBAC verification.
  - Verified end-to-end integration and test suite.

- **Phase 5 (Test Data & Evaluation):**
  - Created `data/baseline_schedule.csv` (21 Primavera P6 activities across 6 EPC disciplines).
  - Created `data/sample_report_piping.txt`, `data/sample_report_electrical.txt`, and `data/sample_report_mixed.csv`.
  - Created `data/README.md` and `scripts/seed_database.py`.
  - Created and executed `scripts/evaluate_pipeline.py` achieving:
    - **100.0% Extraction Recall** (Target $\ge 85\%$)
    - **100.0% Semantic Matching Top-1 Accuracy** (Target $\ge 80\%$)
    - **0 False-Positive Auto-Links** in $\ge 85\%$ confidence band.

## Next up: Phase 6 — Polish + Demo Deployment





## How to update this file

When a phase completes, flip its status to ✅ and add one line under it noting what was actually built (mirrors the "what's done" pattern above). When priorities shift mid-hackathon (they will), edit the table directly rather than appending a separate note — this file should always reflect current reality, not a history of changes (that's what `DECISION_LOG.md` is for).
