# ONGROUND — FINAL TECHNICAL TRUTH

**Audit Date:** September 18, 2026  
**Auditor:** Antigravity AI Engine (Pre-Phase-2 Technical Truth Verification)  
**Repository:** OnGround (`Shourya-stack/OnGround` / `SIH26122`)  
**Operating System:** Windows  

---

## SOURCE-OF-TRUTH RULES

1. **Actual Source Code** > **Actual Tests** > **Configuration Files** > **Database Schema Files** > **Existing Documentation** > **Assumptions**.
2. If code contradicts documentation, the code is the undeniable technical truth.
3. Explicit verification status labels used throughout:
   - `IMPLEMENTED`
   - `PARTIALLY IMPLEMENTED`
   - `NOT IMPLEMENTED`
   - `PLANNED`
   - `UNKNOWN / NEEDS VERIFICATION`

---

## 1. CURRENT PROJECT PHASE

**Current Phase:**  
**STEP 2 — Complete Frontend V1 / Phase 2 Main App UI**

**Status:** `PARTIALLY IMPLEMENTED` (Active Development Phase)

**Description:**  
The complete core frontend experience is operational using comprehensive relational mock data. Application layouts, navigation, and 32+ routes are functional. Zero live backend wiring has been performed (frontend-first discipline preserved). Edge-case filter empty states and mobile collapse refinement remain before entering Step 3 QA.

---

## 2. PHASE STATUS SUMMARY

| Roadmap Step | Phase Name | Status | Verified Evidence |
|---|---|---|---|
| **Step 1** | Frontend Blueprint Finalization | `IMPLEMENTED` | App shell, Tailwind design tokens, router, component architecture in `frontend/src/`. |
| **Checkpoint** | Teammate FE Feature Integration | `IMPLEMENTED` | Candidate List, Activity Linking drawer, TraceabilityModal, Progress bars, Processing UX, Feed, Ctrl+K Search, Notifications. Verified with `npm run build` passing. |
| **Step 2** | Complete Frontend V1 / Main App UI | `PARTIALLY IMPLEMENTED` | 14 workspace pages + 3 portfolio pages render interactive mock workflows. 15/18 checklist items complete. Active phase. |
| **Step 3** | Team QA / UX / Responsive / Polish | `NOT IMPLEMENTED` | Multi-device QA pass across tablet/mobile and accessibility audit not yet started. |
| **Step 4** | Frontend Freeze | `NOT IMPLEMENTED` | Formal freeze sign-off awaiting completion of Step 3. |
| **Step 5** | API Contract Finalization | `PARTIALLY IMPLEMENTED` | Pydantic schemas in `backend/models/schemas.py` and TS types in `frontend/src/lib/types.ts` aligned; OpenAPI export/freeze pending. |
| **Step 6** | Backend Productionization | `PARTIALLY IMPLEMENTED` | FastAPI endpoints, services, and tests implemented; lacks live Bearer JWT middleware and production logging. |
| **Step 7** | Frontend + Backend Integration | `NOT IMPLEMENTED` | Frontend still exclusively utilizes in-memory/localStorage mock state via `apiService.ts`. |
| **Step 8** | AI / Extraction / Matching Hardening | `NOT IMPLEMENTED` | Core hybrid formula works; construction benchmark suite, OCR parsing, and threshold tuning pending. |
| **Step 9** | Security / RLS / Full System Testing | `PARTIALLY IMPLEMENTED` | SQL RLS policies declared in `schema.sql`; automated live multi-tenant tests and penetration checks not implemented. |
| **Step 10** | Deployment + Production Validation | `PARTIALLY IMPLEMENTED` | `vercel.json`, `Dockerfile`, and `render.yaml` exist; production staging validation pending live integration. |

---

## 3. FRONTEND TECHNICAL TRUTH

- **Data Architecture:** `IMPLEMENTED` (Mock-Only Mode)
  - The active frontend consumes mock data through `frontend/src/api/apiService.ts`.
  - State mutations (Accept match, Reject match, Change match, Upload report, Create project) update in-memory objects and are persisted across browser reloads via `localStorage` (keys: `onground_projects`, `onground_schedule`, `onground_reports`, `onground_activities`, `onground_matches`, `onground_unmatched`, `onground_team`, `onground_audit`, `onground_notifications`, `onground_field_updates`).
  - Network latency is realistically simulated with `delay(150)` ms.
  - An earlier client `frontend/src/lib/apiClient.ts` was written to call FastAPI (`http://localhost:8000`), but it is only imported in legacy unrouted single-project prototype files (`UploadPage.tsx`, `ReconciliationPage.tsx`, `ReviewPage.tsx`).
  - Active workspace pages do **NOT** make direct Supabase queries or live FastAPI calls.
- **Framework & Libraries:**
  - React `18.3.1`, TypeScript `5.5.4`, Vite `5.4.3`.
  - TailwindCSS `3.4.10`, Lucide React `0.441.0`, Framer Motion `11.5.4`.
- **Build Status:** Passing (`npm run build` exits code 0 in 5.94s, zero TypeScript errors).

---

## 4. BACKEND TECHNICAL TRUTH

- **Framework:** FastAPI `0.115.0` on Python `3.14.7` with Uvicorn and Pydantic v2.
- **Active Endpoints:**
  - `GET /health` (`backend/main.py`)
  - `POST /upload` (`backend/routes/upload.py`)
  - `POST /extract` & `POST /extract/{extraction_id}` (`backend/routes/extract.py`)
  - `POST /match` & `POST /match/{extracted_activity_id}` (`backend/routes/match.py`)
  - `POST /match/{match_id}/confirm` (`backend/routes/review.py`)
  - `POST /match/{match_id}/reject` (`backend/routes/review.py`)
- **Backend Supabase Client:**
  - Configured in `backend/db/supabase_client.py`.
  - Uses `SUPABASE_SERVICE_KEY`, which **bypasses PostgreSQL Row Level Security (RLS)** for all database writes and reads.

---

## 5. DATABASE / SUPABASE TRUTH

- **Database Engine:** Supabase PostgreSQL 15.
- **Actual Tables in `backend/db/schema.sql`:** **EXACTLY 7 TABLES**
  1. `public.profiles` — Links to `auth.users(id)`; stores `full_name` and `role` with `CHECK (role IN ('planner', 'supervisor'))`.
  2. `public.schedule_plan` — Ingested WBS activities with `activity_code`, `activity_description`, `discipline`, `planned_start`, `planned_end`.
  3. `public.extractions` — Uploaded report job tracking with `file_url`, `file_type`, `status` (`pending`, `processing`, `complete`, `failed`).
  4. `public.extracted_activities` — Work items extracted by NLP with `activity_description`, `discipline`, `start_time`, `end_time`, `location_reference`, and server-computed `extraction_confidence`.
  5. `public.schedule_matches` — AI matches with `confidence_score`, `status` (`auto_linked`, `pending_review`, `confirmed`, `rejected`), `resolved_by`, and `candidates` (JSONB).
  6. `public.unmatched_activities` — Activities with scores $< 0.70$ requiring manual supervisor intervention.
  7. `public.audit_trail` — Immutable append-only log with `related_match_id`, `related_unmatched_id`, `action`, `confidence_score`, `actor`, `created_at`.
- **Critical Schema Gaps vs Old Documentation:**
  - There is **NO `projects` table** in `backend/db/schema.sql`. (Tables carry a placeholder `project_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'`).
  - There is **NO `daily_reports` table**; the table is named `extractions`.
  - There is **NO `team_members` table**.
  *(These entities currently exist only in frontend mock models).*

---

## 6. AI / LLM TRUTH

- **Provider:** OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`) implemented in `backend/llm/openrouter.py`.
- **Actual Active Models in Source Code (`backend/llm/openrouter.py` lines 17-18):**
  - `DEFAULT_MODEL = "liquid/lfm-2.5-2.6b:free"`
  - `FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning:free"`
- **Offline Mock Fallback:** If `OPENROUTER_API_KEY` is missing or placeholder, `_local_mock_fallback()` deterministically parses construction keywords without external API calls.
- **Documentation Conflict:** Previous documentation files claimed the system used `anthropic/claude-3.5-sonnet` with `google/gemini-pro-1.5` fallback. In actual source code, the hardcoded defaults are free-tier OpenRouter models (`liquid/lfm-2.5-2.6b:free` and `nvidia/nemotron-3.5-lightning:free`).

---

## 7. EXTRACTION CONFIDENCE TRUTH

- **Calculation Nature:** **100% DETERMINISTIC PYTHON CODE** (`backend/services/extraction_service.py` lines 71–100).
- **LLM Independence:** The LLM does **NOT** generate or supply confidence. The system prompt in `openrouter.py` explicitly commands:
  > *"Do NOT invent confidence scores or include confidence keys; confidence is calculated deterministically by OnGround backend."*
- **Exact Formula & Weights:**
  $$\text{Base Score} = 0.50 \quad (\text{for non-empty description})$$
  $$+ 0.15 \quad \text{if } \text{discipline} \neq \text{'unknown'}$$
  $$+ 0.15 \quad \text{if } \text{start\_time is present and parsed}$$
  $$+ 0.10 \quad \text{if } \text{end\_time is present and parsed}$$
  $$+ 0.10 \quad \text{if } \text{location\_reference is present (len} \ge 3)$$
  $$\text{Confidence} = \min(1.00, \text{round}(\text{score}, 2))$$
- **Output Range:** `0.50` to `1.00`.
- **Storage:** Persisted in `public.extracted_activities.extraction_confidence` (FLOAT NOT NULL).

---

## 8. MATCHING ALGORITHM TRUTH

- **Embedding Model:** `sentence-transformers` loading `"all-MiniLM-L6-v2"` (384-dimensional dense vectors).
- **Vector Search Execution:** **100% IN-MEMORY**.
  - Does **NOT** use pgvector or database-level vector indexing.
  - Baseline schedule items are retrieved from `schedule_plan` and embedded/scored sequentially in memory.
- **Fallback Similarity Mechanism:** Word-overlap Dice/Jaccard token similarity:
  $$\text{Sim}_{\text{fallback}} = \frac{2 \times |S_1 \cap S_2|}{|S_1| + |S_2|}$$
- **Exact Hybrid Scoring Formula (`backend/services/matching_service.py` lines 75–98):**
  $$\text{Score} = (0.70 \times \text{EmbeddingSim}) + (0.20 \times \text{ExtractionConfidence}) + (0.10 \times \text{DateProximity}) - \text{DisciplinePenalty}$$
  - Clamped to $[0.0, 1.0]$: `max(0.0, min(1.0, round(composite, 4)))`.
  - `DisciplinePenalty`: `0.15` if both disciplines are known and do not match; `0.0` otherwise.
  - `DateProximity`: Currently hardcoded as `1.0` multiplier ($0.10 \times 1.0 = 0.10$).
- **Decision Bands:**
  - $\ge 0.85$ and **not ambiguous** $\rightarrow$ `"auto_linked"`
  - $\ge 0.70$ (or $\ge 0.85$ if ambiguous) $\rightarrow$ `"pending_review"`
  - $< 0.70$ $\rightarrow$ `"unmatched"` (routed to `unmatched_activities`)
- **Disambiguation Behavior:** If top candidate has score $\ge 0.70$ and a runner-up candidate is within $\le 0.05$ score difference:
  - `is_ambiguous = True`.
  - Item is forced to `"pending_review"` regardless of high score.
  - Top 3 candidates are serialized into `schedule_matches.candidates` JSONB column.

---

## 9. AUTHENTICATION TRUTH

- **Frontend Auth Status:** `PARTIALLY IMPLEMENTED` (Demo/Mock Ready)
  - `frontend/src/hooks/AuthProvider.tsx` provides Supabase session integration, instant demo login (`signIn`), and a role switcher (`switchRoleForDemo`) storing `'planner'` or `'supervisor'` in `localStorage.getItem('onground_demo_role')`.
  - **No route protection guards:** Routes in `frontend/src/App.tsx` are not wrapped in `<ProtectedRoute />`. All pages are directly accessible.
- **Backend Auth Status:** `PARTIALLY IMPLEMENTED`
  - In `backend/routes/review.py`, `get_current_user` attempts to verify a Supabase Bearer token; if absent, it trusts the `X-User-Role` HTTP header (or defaults to `'planner'`) and assigns a dummy `UUID`.
  - Endpoints in `upload.py`, `extract.py`, `match.py` do not enforce authorization.
- **Role Model:**
  - Defined roles in database `schema.sql` and backend `schemas.py`: `'planner'` and `'supervisor'`.
  - Earlier documentation referring to `'admin'`, `'project_manager'`, `'field_engineer'`, `'auditor'` reflects aspirational enterprise roles not yet present in backend code.

---

## 10. RLS (ROW LEVEL SECURITY) TRUTH

- **Declared Tables:** RLS is enabled on all 7 tables in `backend/db/schema.sql`.
- **Policy Structure:**
  - Read access (`SELECT`) is granted to `authenticated` (`USING true`).
  - Mutation access (`INSERT`, `UPDATE`, `DELETE`) on `schedule_plan`, `schedule_matches`, and `unmatched_activities` is restricted to planners via `public.is_planner()` function.
  - `audit_trail` allows `INSERT` by authenticated users; `UPDATE` and `DELETE` have no policies (immutable append-only).
- **Operational Reality:**
  - **The backend uses `SUPABASE_SERVICE_KEY`, completely bypassing RLS.**
  - RLS policies have **NOT** been validated by automated integration tests.

---

## 11. ROUTE TRUTH

An exact inventory of `frontend/src/App.tsx` reveals **44 total `<Route>` definitions** (37 distinct active page views/variations + 7 redirects):

### Public / Marketing Routes (13)
1. `/` (`HomePage`)
2. `/features` (`FeaturesPage`)
3. `/how-it-works` (`HowItWorksPage`)
4. `/solutions` (`SolutionsPage`)
5. `/pricing` (`PricingPage`)
6. `/about` (`AboutPage`)
7. `/contact` (`ContactPage`)
8. `/docs` (`DocsPage`)
9. `/security` (`SecurityPage`)
10. `/faq` (`FAQPage`)
11. `/privacy` (`PrivacyPage`)
12. `/terms` (`TermsPage`)
13. `/cookies` (`CookiesPage`)

### Authentication Routes (5)
14. `/login` (`LoginPage`)
15. `/signup` (`SignupPage`)
16. `/forgot-password` (`ForgotPasswordPage`)
17. `/reset-password` (`ResetPasswordPage`)
18. `/verify-email` (`VerifyEmailPage`)

### Portfolio App Routes (3)
19. `/dashboard` (`PortfolioDashboardPage`)
20. `/projects` (`ProjectsPage`)
21. `/projects/new` (`CreateProjectPage`)

### Project Workspace Routes (`/projects/:id/...`) (16)
22. `/projects/:id` (Index redirect to `overview`)
23. `/projects/:id/overview` (`ProjectOverviewPage`)
24. `/projects/:id/schedule` (`ProjectSchedulePage`)
25. `/projects/:id/activities` (`ProjectActivitiesPage`)
26. `/projects/:id/reports` (`ProjectReportsPage`)
27. `/projects/:id/reports/upload` (`ProjectUploadPage`)
28. `/projects/:id/upload` (Alias redirect to `reports/upload`)
29. `/projects/:id/processing` (`ProjectProcessingPage`)
30. `/projects/:id/reconciliation` (`ProjectReconciliationPage`)
31. `/projects/:id/review` (`ProjectReviewPage`)
32. `/projects/:id/review/:matchId` (`ProjectReviewPage`)
33. `/projects/:id/unmatched` (`ProjectUnmatchedPage`)
34. `/projects/:id/analytics` (`ProjectAnalyticsPage`)
35. `/projects/:id/audit` (`ProjectAuditPage`)
36. `/projects/:id/team` (`ProjectTeamPage`)
37. `/projects/:id/settings` (`ProjectSettingsPage`)

### Backward Compatibility / Alias Redirects (6)
38. `/upload` $\rightarrow$ `/projects/proj-01/reports/upload`
39. `/reconciliation` $\rightarrow$ `/projects/proj-01/reconciliation`
40. `/review/:matchId` $\rightarrow$ `/projects/proj-01/review`
41. `/unmatched` $\rightarrow$ `/projects/proj-01/unmatched`
42. `/schedule` $\rightarrow$ `/projects/proj-01/schedule`
43. `/audit` $\rightarrow$ `/projects/proj-01/audit`

### Catch-All Route (1)
44. `*` $\rightarrow$ `/`

---

## 12. TEAMMATE INTEGRATION TRUTH

| Teammate Feature | Verification Status | Exact Component / File Evidence |
|---|---|---|
| **Activity Linking** | `IMPLEMENTED` | `frontend/src/components/reconciliation/DisambiguationPanel.tsx` |
| **Candidate Schedule Activities** | `IMPLEMENTED` | `frontend/src/components/reconciliation/CandidateList.tsx` |
| **Confidence / Similarity Display** | `IMPLEMENTED` | Displayed in `CandidateList.tsx`, `ProjectReconciliationPage.tsx`, `ProjectReviewPage.tsx` |
| **Match Reasons** | `IMPLEMENTED` | Rendered via `candidate.reasons` in `CandidateList.tsx` & `mockMatches.ts` |
| **Accept / Confirm Match** | `IMPLEMENTED` | `handleConfirmMatch` wired in `ProjectReconciliationPage.tsx` & `ProjectReviewPage.tsx` |
| **Reject Match** | `IMPLEMENTED` | `handleRejectMatch` wired in `ProjectReconciliationPage.tsx` & `ProjectReviewPage.tsx` |
| **Change Match** | `IMPLEMENTED` | `handleSelectCandidate` in `DisambiguationPanel.tsx` calling `apiService.changeMatchCandidate` |
| **Traceability Chain** | `IMPLEMENTED` | **`frontend/src/components/traceability/TraceabilityModal.tsx`** *(Note: modal component, not TraceabilityChain.tsx)* |
| **Planned vs Actual** | `IMPLEMENTED` | Progress bars and variance badges in `frontend/src/pages/project/ProjectSchedulePage.tsx` |
| **Processing UX** | `IMPLEMENTED` | Simulated animated pipeline with log terminal in `frontend/src/pages/project/ProjectProcessingPage.tsx` |
| **Field Update / Progress Feed** | `IMPLEMENTED` | `frontend/src/components/feed/FieldUpdateFeed.tsx` |
| **Global Search (Ctrl+K)** | `IMPLEMENTED` | `frontend/src/components/common/GlobalSearchModal.tsx` |
| **Notifications Drawer** | `IMPLEMENTED` | `frontend/src/components/common/NotificationsDrawer.tsx` |

---

## 13. API CONTRACT TRUTH

- **Pydantic Models (`backend/models/schemas.py`):**
  `HealthResponse`, `CurrentUser`, `ErrorResponse`, `UploadResponse`, `ExtractedActivityRaw`, `ExtractedActivityCreate`, `ExtractionResponse`, `CandidateMatch`, `MatchResult`, `ConfirmResponse`, `RejectRequest`, `RejectResponse`.
- **TypeScript Models (`frontend/src/lib/types.ts`):**
  Fully declared and type-safe for both existing backend payloads and frontend mock structures.
- **Contract Gaps:**
  - Backend schema defines `MatchResult`; frontend interface is named `MatchResponse`.
  - Frontend `CandidateMatch` has extra UI properties (`reasons`, `planned_progress`, `actual_progress`) not present in backend Pydantic schema.
  - Backend does not yet have Pydantic models for `Project`, `ReportItem`, `TeamMember`, or `ProjectAnalytics`.

---

## 14. TESTING & BUILD TRUTH

- **Frontend Production Build:** `IMPLEMENTED` & **PASSED**  
  `npm run build` completed cleanly with **exit code 0** (1678 modules transformed, zero TypeScript errors).
- **Backend Test Suite:** `IMPLEMENTED` & **PASSED**  
  `pytest backend/tests -v` completed with **17 of 17 tests passing** (0 failures).

---

## 15. DEPLOYMENT TRUTH

- **Frontend:** Vercel SPA deployment configured in `frontend/vercel.json` (rewrites all requests to `/index.html`). Status: `IMPLEMENTED`.
- **Backend:** `Dockerfile` and `render.yaml` configured. Status: `IMPLEMENTED`.
- **Live Staging Pipeline:** Status: `PLANNED` (Step 10).

---

## 16. DOCUMENTATION CONFLICTS FOUND

1. **LLM Models:**
   - *Documentation claimed:* `anthropic/claude-3.5-sonnet` with `google/gemini-pro-1.5` fallback.
   - *Actual Code (`openrouter.py`):* `liquid/lfm-2.5-2.6b:free` default with `nvidia/nemotron-3.5-lightning:free` fallback.
2. **Database Table Count & Names:**
   - *Documentation claimed:* 9 tables (`profiles`, `projects`, `schedule_plan`, `daily_reports`, `extracted_activities`, `schedule_matches`, `unmatched_activities`, `audit_trail`, `team_members`).
   - *Actual Code (`schema.sql`):* **7 tables**. There are NO `projects`, `daily_reports`, or `team_members` tables. The report tracking table is named `extractions`.
3. **Traceability Component Filename:**
   - *Documentation claimed:* `frontend/src/components/traceability/TraceabilityChain.tsx`.
   - *Actual Code:* `frontend/src/components/traceability/TraceabilityModal.tsx`.
4. **User Roles:**
   - *Documentation claimed:* `admin`, `project_manager`, `field_engineer`, `auditor`.
   - *Actual Code (`schema.sql` & `schemas.py`):* `planner` and `supervisor`.
5. **Route Count:**
   - *Documentation claimed:* Exactly 32 routes.
   - *Actual Code (`App.tsx`):* 44 route declarations (37 page views/variants + 7 redirects).
6. **Storage Bucket Name:**
   - *Actual Code:* Consistently named `"reports"` across `upload.py` and `schema.sql`.

---

## 17. KNOWN LIMITATIONS

1. **In-Memory Matching:** Scaling beyond ~1,000 baseline schedule activities requires pgvector or approximate nearest neighbor indexing.
2. **Mock Authorization:** `X-User-Role` request header is trusted when Bearer token is omitted.
3. **No Dynamic Date Proximity Scoring:** Date proximity factor is currently fixed at `1.0` in `matching_service.py`.
4. **Frontend Mock Coupling:** Active pages rely on `localStorage` state in `apiService.ts`; live API cutover must wait for Step 7.

---

## 18. FINAL CURRENT STATE

```
+-----------------------------------------------------------------------------------+
|  CURRENT DEVELOPMENT PHASE:   STEP 2 — Complete Frontend V1 / Main App UI         |
|  PHASE STATUS:                PARTIALLY IMPLEMENTED (In Progress)                 |
|  NEXT MILESTONE:              STEP 3 — Team QA / UX / Responsive / Polish         |
|  IMMEDIATE REMAINING WORK:    Filter zero-states, mobile collapse refinement     |
|  DO NOT PROCEED TO:           Backend Production (Step 6) / Live Wire (Step 7)    |
+-----------------------------------------------------------------------------------+
```
