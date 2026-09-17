# ONGROUND — MASTER PROJECT EXECUTION PLAN

> **PERSISTENT AGENT CONTEXT**  
> **Source of Truth:** Existing OnGround codebase (`frontend/` and `backend/`).  
> **Last Audited:** September 18, 2026  
> **Rule for Future Tasks:** Read this document BEFORE planning or executing any changes. Do NOT skip ahead or violate phase boundaries.

---

## 1. PROJECT IDENTITY

### What is OnGround?
**OnGround** is an enterprise AI-assisted construction progress intelligence and schedule reconciliation platform. It bridges the gap between static master schedules (Primavera P6, MS Project, Excel/WBS) and unstructured field reality (Daily Progress Reports, site memos, contractor logs, inspection sheets).

### The Core Problem
Construction projects experience schedule slippages because daily field progress reports (PDFs, scans, text updates) are disconnected from master project schedules (Primavera/MS Project). Manual reconciliation takes days or weeks, resulting in unmonitored delays and contractor disputes.

### The OnGround Solution
1. **Schedule Ingestion**: Ingests master WBS activities with planned dates, quantities, disciplines, and baseline milestones.
2. **Report Extraction**: Uses multimodal LLM pipelines (`anthropic/claude-3.5-sonnet` with `google/gemini-pro-1.5` fallback via OpenRouter) to extract work descriptions, quantities, locations, and disciplines from daily reports.
3. **Hybrid Semantic Matching**: Matches extracted site progress to schedule activities using a weighted multi-factor scoring formula:
   $$\text{Score} = (0.70 \times \text{Embedding Similarity}) + (0.20 \times \text{Extraction Confidence}) + (0.10 \times \text{Date Proximity}) - \text{Discipline Penalty}$$
4. **Three-Band Confidence Routing**:
   - **Auto-Linked ($\ge 0.85$)**: High confidence, automatically reconciled.
   - **Pending Review ($0.70 - 0.84$)**: Ambiguous matches routed to human supervisor with confidence reason, similarity score, and candidate picker.
   - **Unmatched ($< 0.70$)**: Flagged as rogue/unplanned work or unmapped site items requiring manual supervisor assignment.
5. **Human-in-the-Loop Reconciliation**: Field supervisors accept, change, or reject match candidates with full traceability.
6. **Immutable Audit Trail**: Captures every decision with user identity, role, timestamp, old/new match, and justification for contractor dispute prevention.

---

## 2. CORE DEVELOPMENT PRINCIPLES & BOUNDARIES

1. **Source of Truth**: The existing OnGround codebase is authoritative. Never rebuild or rewrite working components based on external or teammate code.
2. **Teammate Code Reference Rule**: Teammate frontend code is strictly a reference source for UI patterns (e.g. Activity Linking drawer, Traceability chain, Planned vs Actual bars, Progress feed). It is never used to replace or overwrite OnGround structure.
3. **Development Sequence Discipline**:
   $$\text{FE V1 Blueprint} \rightarrow \text{FE V1 Stabilization} \rightarrow \text{QA / Polish} \rightarrow \text{Frontend Freeze} \rightarrow \text{API Contract Freeze} \rightarrow \text{Backend Productionization} \rightarrow \text{Integration} \rightarrow \text{AI Hardening} \rightarrow \text{Security/RLS} \rightarrow \text{Production Deployment}$$
4. **Strict Scope Isolation**: Do NOT implement future phase capabilities prematurely. Specifically forbidden prior to designated phases:
   - Real backend API wiring before Frontend Freeze and API Contract Finalization.
   - Production auth rewrites before Backend Productionization.
   - Database schema modifications without an approved migration plan.
   - Premature enterprise features: pgvector migrations, direct Primavera P6 XER parsers, MS Project live sync, mobile on-device OCR, Whisper audio transcription, BIM 4D digital twin linking, predictive ML delay forecasts.
5. **Data Model Integrity**: Maintain strict relational discipline:
   $$\text{Project} \rightarrow \text{Schedule Plan} \rightarrow \text{Schedule Activities} \rightarrow \text{Daily Reports} \rightarrow \text{Extracted Activities} \rightarrow \text{Schedule Matches} \rightarrow \text{Review Decisions} \rightarrow \text{Audit Trail}$$
6. **Semantic Independence**: Never conflate **Progress %** (physical completion on site) with **Match Confidence** (AI certainty of activity association) or **Semantic Similarity** (vector cosine distance). They are distinct metrics.

---

## 3. FULL MASTER ROADMAP & CURRENT STATUS

| Step | Phase Name | Status | Summary |
|---|---|---|---|
| **Step 1** | Frontend Blueprint Finalization | **DONE** | Complete React 18 + TS + Tailwind design system, layouts, mock architecture, and 32 routes established. |
| **Checkpoint** | Teammate FE Feature Integration | **DONE** | Integrated Activity Linking drawer, Traceability chain, Planned vs Actual, Processing UX, Progress feed, Ctrl+K search, Notifications. Verified with zero TS errors and successful build. |
| **Step 2** | Complete Frontend V1 / Phase 2 Main App UI | **DONE** | Full mock app functional across all workspace routes. Granular empty/error states, client-side validation, and mobile ergonomics (<768px down to 320px) verified. |
| **Step 3** | Team QA / UX / Responsive / Polish | **NOT STARTED** | Cross-device QA (mobile/tablet/desktop), accessibility audits, visual polish, empty/error state review. |
| **Step 4** | Frontend Freeze | **NOT STARTED** | Lock down all routes, UI components, and mock contracts before backend cutover. |
| **Step 5** | API Contract Finalization | **PARTIALLY COMPLETE** | Pydantic schemas exist in `backend/models/schemas.py`; OpenAPI spec alignment with `frontend/src/lib/types.ts` required. |
| **Step 6** | Backend Productionization | **PARTIALLY COMPLETE** | FastAPI endpoints (`upload`, `extract`, `match`, `review`), services, and Supabase client exist; requires full auth middleware and production logging. |
| **Step 7** | Frontend + Backend Integration | **NOT STARTED** | Switch `apiService.ts` from mock mode to live FastAPI/Supabase endpoints. |
| **Step 8** | AI / Extraction / Matching Hardening | **NOT STARTED** | Prompt engineering for construction edge cases, threshold tuning, benchmark evaluation, and regression test suites. |
| **Step 9** | Security / RLS / Full System Testing | **NOT STARTED** | Supabase Row Level Security policy testing, penetration tests, role authorization verification, E2E test suites. |
| **Step 10** | Deployment + Production Validation | **PARTIALLY COMPLETE** | Vercel config for FE and Docker/Render config for BE exist; full staging validation pending live integration. |

---

## 4. DETAILED STATUS OF EVERY ROADMAP PHASE

### STEP 1 — Frontend Blueprint Finalization
- **Status:** **DONE**
- **Evidence:** 
  - `frontend/src/App.tsx`: Full router with 32 routes covering Marketing, Auth, Portfolio, and Project Workspace.
  - `frontend/src/components/layout/`: `MarketingLayout`, `AppLayout`, `ProjectWorkspaceLayout`.
  - Design system tokens in `frontend/tailwind.config.js` and `frontend/src/index.css`.
  - Rich mock relational dataset in `frontend/src/mocks/`.
- **Completed:** App shell, design tokens, component architecture, mock state services, navigation bar, sidebars.
- **Remaining:** None.
- **Dependencies:** None.

### CHECKPOINT — Teammate FE Feature Integration
- **Status:** **DONE**
- **Evidence:**
  - `frontend/src/components/reconciliation/CandidateList.tsx`: Candidate schedule activities with match reasons, confidence scores, and action buttons.
  - `frontend/src/components/reconciliation/DisambiguationPanel.tsx`: Full Activity Linking drawer with candidate search and re-assignment.
  - `frontend/src/components/traceability/TraceabilityChain.tsx`: Report → Extracted Activity → Schedule Activity → Match → Decision → Audit breadcrumb.
  - `frontend/src/pages/project/ProjectSchedulePage.tsx`: Planned vs Actual progress bars, variance badges, and status chips.
  - `frontend/src/pages/project/ProjectProcessingPage.tsx`: Step-by-step extraction/matching pipeline animation with live log streaming.
  - `frontend/src/components/feed/FieldUpdateFeed.tsx`: Live field activity feed with filtering.
  - `frontend/src/components/common/GlobalSearchModal.tsx` & `NotificationsDrawer.tsx`: Global search (Ctrl+K) and notification center.
  - Verified with `npm run build` (exit code 0).
- **Completed:** All targeted interaction patterns cleanly integrated into OnGround without architectural regressions.
- **Remaining:** None.
- **Dependencies:** Step 1.

### STEP 2 — Complete Frontend V1 / Phase 2 Main App UI
- **Status:** **DONE**
- **Evidence:**
  - Workspace routes exist and render: `/projects/:id/overview`, `/schedule`, `/activities`, `/reports`, `/reports/upload`, `/processing`, `/reconciliation`, `/review`, `/unmatched`, `/analytics`, `/audit`, `/team`, `/settings`.
  - Interactive mock actions functional: Accept, Reject, Change Match, Upload File, Re-run Processing, Export CSV.
  - Granular zero/error states across tables & filters with contextual reset actions (`activities`, `reconciliation`, `schedule`, `reports`, `audit`, `unmatched`, `review`).
  - Mobile ergonomics (<768px down to 320px): collapsible sidebar with backdrop overlay, mobile hamburger toggle, single-column stacking for reconciliation cards and disambiguation panel, contained horizontal table scrolling (`.data-table min-width: 640px`).
  - Client-side form validation with inline errors on `/projects/new` (multi-step validation, date chronology) and `/projects/:id/settings` (general parameters, matching thresholds buffer).
- **Completed:** All 18/18 checklist items complete.
- **Remaining:** None.
- **Dependencies:** Step 1 & Checkpoint.

### STEP 3 — Team QA / UX / Responsive / Polish
- **Status:** **NOT STARTED**
- **Evidence:** Comprehensive responsive testing across tablet/mobile and visual polish pass have not yet taken place.
- **Completed:** Basic desktop layouts verified.
- **Remaining:** Multi-device audit, keyboard accessibility (a11y), contrast checks, toast notification polish, state reset tests.
- **Dependencies:** Completion of Step 2.

### STEP 4 — Frontend Freeze
- **Status:** **NOT STARTED**
- **Evidence:** Codebase is still accepting UI adjustments; freeze has not been declared.
- **Completed:** None.
- **Remaining:** Formal code freeze on frontend components and data structures before API integration begins.
- **Dependencies:** Completion of Step 3.

### STEP 5 — API Contract Finalization
- **Status:** **PARTIALLY COMPLETE**
- **Evidence:**
  - Backend schemas defined in `backend/models/schemas.py` (`UploadResponse`, `ExtractionResponse`, `CandidateMatch`, `MatchResponse`, `ReviewActionRequest`, `HealthResponse`).
  - Frontend types defined in `frontend/src/lib/types.ts`.
- **Completed:** Core data shapes are synchronized conceptually.
- **Remaining:** Export OpenAPI schema (`openapi.json`), generate automated TypeScript client types or validate contract parity via CI tests.
- **Dependencies:** Step 4.

### STEP 6 — Backend Productionization
- **Status:** **PARTIALLY COMPLETE**
- **Evidence:**
  - FastAPI app in `backend/main.py` with routers: `upload.py`, `extract.py`, `match.py`, `review.py`.
  - Services in `backend/services/`: `extraction_service.py`, `matching_service.py`, `audit_service.py`.
  - Database schema in `backend/db/schema.sql` (9 tables, RLS triggers, indices).
  - 17 pytest unit/integration tests passing in `backend/tests/`.
- **Completed:** Upload handling, LLM extraction pipeline, hybrid matching engine, role-checking review actions, audit logging service.
- **Remaining:**
  - Real Supabase Auth JWT verification middleware on all endpoints (currently uses placeholder `current_user` dict).
  - Robust exception handling and structured JSON logging.
  - Production secrets management and CORS tightening.
- **Dependencies:** Step 5.

### STEP 7 — Frontend + Backend Integration
- **Status:** **NOT STARTED**
- **Evidence:** Frontend currently runs entirely against in-memory mock data in `frontend/src/api/apiService.ts`.
- **Completed:** None.
- **Remaining:** Connect `apiService.ts` to live FastAPI backend; test real file upload to Supabase Storage, real LLM extraction, real matching, and real Supabase database persistence.
- **Dependencies:** Steps 4, 5, and 6.

### STEP 8 — AI / Extraction / Matching Hardening
- **Status:** **NOT STARTED**
- **Evidence:** Current matching uses baseline prompt and single model config without formal construction benchmark dataset.
- **Completed:** Core hybrid scoring formula and fallback overlap similarity implemented.
- **Remaining:** Ground-truth construction test suite, prompt optimization, handling scanned OCR noise, fine-tuning discipline penalties.
- **Dependencies:** Step 7.

### STEP 9 — Security / RLS / Full System Testing
- **Status:** **NOT STARTED**
- **Evidence:** Supabase RLS policies written in SQL but not yet validated against multi-tenant user sessions under automated test suites.
- **Completed:** SQL RLS policies declared in `backend/db/schema.sql`.
- **Remaining:** End-to-end multi-user permission tests (Admin, Project Manager, Field Engineer, Auditor).
- **Dependencies:** Steps 7 and 8.

### STEP 10 — Deployment + Production Validation
- **Status:** **PARTIALLY COMPLETE**
- **Evidence:** `frontend/vercel.json`, `backend/Dockerfile`, and `render.yaml` exist.
- **Completed:** Deployment manifests authored.
- **Remaining:** Live multi-service staging environment deployment, custom domain setup, health check monitors, production smoke testing.
- **Dependencies:** Step 9.

---

## 5. CONFIRMED COMPLETED WORK IN REPOSITORY

### Frontend
- **Framework & Tooling**: React 18.3.1, TypeScript 5.5.4, Vite 5.4.3, TailwindCSS, Lucide React, Framer Motion.
- **Routing**: 32 distinct routes covering Landing, Features, Workflow, Tech Stack, Pricing, Auth (Login/Signup/Forgot/Reset), Dashboard, Projects, and 14 Project Workspace sub-routes.
- **Workspace Features**: Overview with metrics, Interactive Schedule Gantt/WBS with Planned vs Actual bars, Activity Explorer with filters, Reports inventory, Drag-and-drop Report Upload, Processing Center with animated pipeline stages, Reconciliation with Disambiguation/Activity Linking drawer, Review queue, Unmatched activity manager, Analytics charts, Audit log viewer, Team access manager, and Project Settings.
- **Integrated Teammate Features**: Candidate Match List, Disambiguation drawer, Traceability Chain, Progress Feed, Global Search (Ctrl+K), Notification Drawer.

### Backend
- **Framework**: FastAPI (Python 3.14 compatible), Uvicorn, Pydantic v2.
- **Endpoints**:
  - `GET /health`
  - `POST /api/upload` (PDF/TXT/XLSX validation, Supabase Storage upload)
  - `POST /api/extract` (LLM extraction pipeline with OpenRouter)
  - `POST /api/match` (Hybrid scoring algorithm)
  - `POST /api/review/confirm` (Role-enforced match confirmation)
  - `POST /api/review/reject` (Match rejection and unmatched routing)
- **Services**: `extraction_service.py`, `matching_service.py` (sentence-transformers embedding + word-overlap fallback), `audit_service.py`.
- **Data Schemas**: Strongly typed request/response models in `backend/models/schemas.py`.

### Database & Storage
- **Platform**: Supabase PostgreSQL + Supabase Storage.
- **Schema**: 9 relational tables (`profiles`, `projects`, `schedule_plan`, `daily_reports`, `extracted_activities`, `schedule_matches`, `unmatched_activities`, `audit_trail`, `team_members`).
- **Indexes & Triggers**: Vector extension prepared, B-tree indexes on foreign keys, automated updated_at triggers, Row Level Security policies configured.

### Testing
- **Backend**: 17 pytest tests in `backend/tests/` covering extraction, matching formulas, API endpoints, role enforcement, and schema validation. (100% pass rate).
- **Frontend**: Full TypeScript compilation and Vite production build verified with 0 errors.

---

## 6. PRIORITIZED BACKLOG

### P0 — Current Phase Blockers (Step 2 Stabilization)
1. Complete empty/error edge-case states across Reconciliation and Review filters.
2. Polish responsive drawer and modal behaviors on mobile viewports (<768px).
3. Validate mock state mutation persistence across tab navigation.

### P1 — Required Before Frontend Freeze (Step 3 & 4)
1. Cross-browser testing (Chrome, Edge, Safari, Firefox).
2. Keyboard navigation accessibility (Tab indexing, escape modal handling).
3. Visual consistency pass on typography, badge colors, and spacing.

### P2 — Required for Backend Integration (Step 5 & 6)
1. Sync OpenAPI contract with frontend TypeScript interfaces.
2. Implement Supabase JWT Bearer authentication dependency in FastAPI.
3. Replace hardcoded test credentials with production environment variable configuration.
4. Add file-type parsing for native `.xlsx` schedule plans.

### P3 — Production Hardening (Step 8 & 9)
1. Real RLS multi-tenant integration tests with Supabase test instances.
2. Benchmark extraction accuracy against realistic messy construction report PDFs.
3. Add rate limiting, telemetry, and structured application error logging.

### P4 — Future Roadmap (Post-Production / Do NOT Implement Now)
- Direct Primavera P6 (`.xer`) native binary parser.
- MS Project live bi-directional sync.
- Mobile on-device camera OCR & Whisper voice notes.
- BIM 4D digital twin linking (IFC model progress visualization).
- ML-based predictive delay and cost slippage models.

---

## 7. CURRENT TECHNICAL TRUTH

| Dimension | Specification | Source of Truth |
|---|---|---|
| **Frontend Framework** | React 18.3.1 + TypeScript 5.5.4 + Vite 5.4.3 | `frontend/package.json` |
| **Styling** | TailwindCSS 3.4.10 + PostCSS + Autoprefixer | `frontend/tailwind.config.js` |
| **Icons & Motion** | Lucide React 0.441.0 + Framer Motion 11.5.4 | `frontend/package.json` |
| **Backend Framework** | Python FastAPI 0.115.0 + Pydantic 2.9.1 + Uvicorn | `backend/requirements.txt` |
| **Database** | Supabase PostgreSQL 15 | `backend/db/schema.sql` |
| **Storage Bucket** | `reports` (Supabase Storage) | `backend/routes/upload.py` |
| **Auth Provider** | Supabase Auth (Email + Password, Magic Link) | `backend/db/schema.sql` |
| **LLM Provider** | OpenRouter API (`https://openrouter.ai/api/v1`) | `backend/llm/openrouter.py` |
| **Primary LLM** | `anthropic/claude-3.5-sonnet` (Fallback: `google/gemini-pro-1.5`) | `backend/llm/openrouter.py` |
| **Embedding Engine** | `sentence-transformers/all-MiniLM-L6-v2` (Fallback: Word Overlap) | `backend/services/matching_service.py` |
| **Scoring Formula** | `0.70*emb_sim + 0.20*ext_conf + 0.10*date_prox - disc_pen` | `backend/services/matching_service.py` |
| **Match Bands** | $\ge 0.85$ Auto / $0.70-0.84$ Review / $<0.70$ Unmatched | `backend/services/matching_service.py` |
| **Frontend Build Status** | Passing (`npm run build` exits 0) | Verified in audit |
| **Backend Test Status** | Passing (17 of 17 tests passed in 78.84s) | Verified via `pytest backend/tests` |

---

## 8. KNOWN RISKS & INCONSISTENCIES

1. **Mock vs Real Backend Disconnect**: Frontend currently runs on in-memory mock data. While comprehensive, schema drift could occur if backend models change before Step 5.  
   *Action:* Keep `backend/models/schemas.py` and `frontend/src/lib/types.ts` strictly aligned.
2. **Backend Auth is Currently Mocked**: In `backend/routes/review.py`, user identity and roles (`Project Manager`, `Admin`) are populated with test values rather than validating incoming Supabase Bearer JWT tokens.  
   *Action:* Do not expose backend endpoints publicly until auth middleware is installed in Step 6.
3. **Heavy Sentence-Transformers Cold Start**: In Windows/CPU environments, loading `sentence-transformers` can take 5–10 seconds on first run. Fallback word-overlap similarity works instantly.  
   *Action:* Keep the word-overlap fallback active for lightweight environments.
4. **Stale Docs in Repository**: Some documents in `docs/` reference older or alternative project timelines (e.g. hackathon sprint schedules).  
   *Action:* Treat `docs/PROJECT_EXECUTION_PLAN.md` and `docs/CURRENT_PROJECT_STATE.md` as the authoritative execution standard.

---

## 9. PHASE BOUNDARY RULES: WHAT MUST WAIT

```
+-------------------------------------------------------------------------------+
|                             STRICT BOUNDARIES                                 |
+-------------------------------------------------------------------------------+
|  DO NOT start Phase 6/7 (Backend Production / Live Integration)               |
|  DO NOT start Phase 8 (AI Hardening)                                          |
|  DO NOT start Phase 9 (Security / RLS Live Pentest)                           |
|  DO NOT start Phase 10 (Production Deployment Cutover)                         |
|  DO NOT build Primavera P6 / MS Project / BIM 4D / Whisper integrations        |
|                                                                               |
|  CURRENT FOCUS: Complete Step 2 UI stabilization and prepare for Step 3 QA.   |
+-------------------------------------------------------------------------------+
```
