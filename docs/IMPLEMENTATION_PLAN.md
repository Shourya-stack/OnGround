# OnGround — Complete Implementation Plan

**Document type:** Implementation Blueprint  
**Status:** DRAFT — awaiting approval before execution begins  
**Authority:** This plan is derived from and subordinate to `FINAL_MASTER_PLAN.md`. Where they conflict, `FINAL_MASTER_PLAN.md` wins.  
**Phase:** 0 complete → ready for Phase 1  
**Prepared:** 2026-09-10

---

## Table of Contents

1. [Source of Truth Summary](#1-source-of-truth-summary)
2. [Repository / Project Structure](#2-repository--project-structure)
3. [Frontend — Screen Architecture](#3-frontend--screen-architecture)
4. [Frontend — Component System](#4-frontend--component-system)
5. [UX / Design System Plan](#5-ux--design-system-plan)
6. [Backend — Complete API Plan](#6-backend--complete-api-plan)
7. [Service Architecture](#7-service-architecture)
8. [AI Pipeline — Extraction](#8-ai-pipeline--extraction)
9. [AI Pipeline — Matching](#9-ai-pipeline--matching)
10. [Database Implementation Plan](#10-database-implementation-plan)
11. [Supabase Setup Plan](#11-supabase-setup-plan)
12. [Authorization Plan](#12-authorization-plan)
13. [API ↔ Supabase Responsibility Split](#13-api--supabase-responsibility-split)
14. [Realtime Plan](#14-realtime-plan)
15. [Error Handling Plan](#15-error-handling-plan)
16. [Security Plan](#16-security-plan)
17. [Testing Plan](#17-testing-plan)
18. [Demo / Synthetic Data Plan](#18-demo--synthetic-data-plan)
19. [Deployment Plan](#19-deployment-plan)
20. [Environment Variables](#20-environment-variables)
21. [Implementation Phases](#21-implementation-phases)
22. [Task Dependency Graph](#22-task-dependency-graph)
23. [36-Hour Hackathon Execution Plan](#23-36-hour-hackathon-execution-plan)
24. [Risk Register](#24-risk-register)
25. [Unresolved Decisions](#25-unresolved-decisions)
26. [File-by-File Implementation Map](#26-file-by-file-implementation-map)
27. [Final Implementation Order](#27-final-implementation-order)
28. [Appendix: Contradictions Found in Existing Documentation](#appendix-contradictions-found-in-existing-documentation)

---

## 1. Source of Truth Summary

All decisions below derive from the following documents. In case of any conflict, the priority order is:

1. `FINAL_MASTER_PLAN.md` (highest authority)
2. `DECISION_LOG.md` (locked decisions D1–D13)
3. `ARCHITECTURE.md`, `DATABASE.md`, `API.md` (engineering LLD)
4. `AUTH.md`, `SECURITY.md`, `TECH_STACK.md` (cross-cutting concerns)
5. `PRODUCT_FEATURES.md`, `PRODUCT_REQUIREMENTS.md`, `PRODUCT_PRD.md` (product requirements)
6. `PRODUCT_PERSONAS_FLOWS_USECASES.md` (UX source)
7. `PHASE.md`, `TASKS.md` (execution plan)

**Locked decisions that must not be overridden** (sourced from `DECISION_LOG.md` D1–D13):

| Decision | What is locked |
|---|---|
| D2 | Supabase, not SQLite |
| D3 | FastAPI monolith, not microservices |
| D4 | Minimal FastAPI surface (5 endpoints); reads go direct via Supabase client |
| D5 | Sync request/response, no Celery/Redis |
| D6 | sentence-transformers `all-MiniLM-L6-v2` for matching, not LLM |
| D7 | No custom-trained models |
| D9 | Supabase Auth, planner/supervisor roles |
| D10 | No live Primavera API — file-based CSV/Excel import only |
| D11 | LLM provider abstraction; OpenRouter free-tier preferred; switchable via env vars |
| D12 | Public deployment: GitHub + Vercel + cloud-hosted FastAPI |
| D13 | Same codebase, dual local + cloud via env vars |

**Unresolved decisions** (D1–D13 are locked decisions recorded in `DECISION_LOG.md`; new decisions made during the build will receive the next available decision number and be added to `DECISION_LOG.md` at the time they are made):

Three decisions currently remain unresolved (UD1, UD2, UD3). Decision numbers are NOT assigned merely to fill gaps. They are represented strictly as unresolved decisions until actually made. See Section 25 for full context. They are listed here for visibility:

| Identifier | What is open | Must be decided by |
|---|---|---|
| UD1 — Exact free OpenRouter model | Which free model to use on OpenRouter | Start of Phase 2 |
| UD2 — Cloud FastAPI hosting provider | Which provider hosts the FastAPI backend for public demo | Start of Phase 6 |
| UD3 — CSS / styling approach | Tailwind v3, Vanilla CSS, or CSS Modules | Before Phase 3 |

---

## 2. Repository / Project Structure

### 2.1 Root structure (final expected state)

```
SIH26122/                            <- Git root
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── upload.py
│   │   ├── extract.py
│   │   ├── match.py
│   │   └── review.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── extraction_service.py
│   │   ├── matching_service.py
│   │   └── audit_service.py
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── provider.py
│   │   └── openrouter.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── supabase_client.py
│   │   └── schema.sql
│   └── tests/
│       ├── __init__.py
│       ├── test_matching_service.py
│       ├── test_extraction_service.py
│       ├── test_schemas.py
│       └── test_llm_provider.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   ├── .gitignore
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── lib/
│       │   ├── supabaseClient.ts
│       │   ├── apiClient.ts
│       │   └── types.ts
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useExtractions.ts
│       │   ├── useMatches.ts
│       │   ├── useSchedulePlan.ts
│       │   └── useAuditTrail.ts
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── UploadPage.tsx
│       │   ├── ReconciliationPage.tsx
│       │   ├── ReviewPage.tsx
│       │   ├── UnmatchedPage.tsx
│       │   ├── AuditPage.tsx
│       │   └── SchedulePage.tsx
│       └── components/
│           ├── layout/
│           │   ├── AppShell.tsx
│           │   ├── Sidebar.tsx
│           │   └── TopBar.tsx
│           ├── ui/
│           │   ├── ConfidenceBadge.tsx
│           │   ├── StatusBadge.tsx
│           │   ├── KPICard.tsx
│           │   ├── DataTable.tsx
│           │   ├── EmptyState.tsx
│           │   ├── ErrorState.tsx
│           │   ├── LoadingSkeleton.tsx
│           │   └── Toast.tsx
│           ├── upload/
│           │   ├── UploadDropzone.tsx
│           │   └── UploadStatusCard.tsx
│           ├── reconciliation/
│           │   ├── ReconciliationTable.tsx
│           │   ├── MatchRow.tsx
│           │   ├── CandidateList.tsx
│           │   └── DisambiguationPanel.tsx
│           ├── review/
│           │   ├── ReviewPanel.tsx
│           │   ├── ConfirmRejectBar.tsx
│           │   └── ActivityDetailCard.tsx
│           ├── audit/
│           │   └── AuditTimeline.tsx
│           └── dashboard/
│               ├── ProgressSummary.tsx
│               ├── DisciplineBreakdown.tsx
│               └── RecentUploads.tsx
├── data/
│   ├── baseline_schedule.csv
│   ├── sample_report_piping.txt
│   ├── sample_report_electrical.txt
│   ├── sample_report_mixed.csv
│   └── README.md
├── docs/
│   └── [all existing docs — untouched]
├── README.md
├── .gitignore
└── .env.example
```

### 2.2 Key responsibility mapping

| File/Folder | Responsibility |
|---|---|
| `backend/main.py` | FastAPI app instantiation, router registration, CORS config, model load at startup |
| `backend/routes/` | Thin HTTP handlers — validate input, call service, return response |
| `backend/services/` | All business logic (LLM calls, embedding, matching, audit writes) |
| `backend/llm/` | LLM provider abstraction — interface + concrete implementations |
| `backend/models/schemas.py` | All Pydantic models for request validation and response serialization |
| `backend/db/supabase_client.py` | One Supabase client instance, imported everywhere in backend |
| `backend/db/schema.sql` | All CREATE TABLE statements, RLS policies, indexes — executed once in Supabase |
| `backend/tests/` | pytest test suite (unit + integration, mock provider) |
| `frontend/src/lib/` | Shared infrastructure: Supabase client, API client, TypeScript types |
| `frontend/src/hooks/` | Data-fetching hooks — each returns `{data, error, loading}` |
| `frontend/src/pages/` | Route-level components — assemble hooks + components into screens |
| `frontend/src/components/` | Reusable UI components |
| `data/` | Synthetic demo data for Phase 5 evaluation and demo seeding |

---

## 3. Frontend — Screen Architecture

### Design principle

Routing lives in `App.tsx`. Protected routes check auth state from `useAuth`. Role-specific visibility is controlled in the component layer. The navigation sidebar is always present post-login.

### Router structure

```
/                   -> redirect to /dashboard if authenticated, else /login
/login              -> LoginPage (public)
/dashboard          -> DashboardPage (any authenticated role)
/upload             -> UploadPage (supervisor + planner)
/reconciliation     -> ReconciliationPage (planner-primary, supervisor-read)
/review/:matchId    -> ReviewPage (planner only)
/unmatched          -> UnmatchedPage (planner primary)
/audit              -> AuditPage (any authenticated role)
/schedule           -> SchedulePage (planner primary)
```

---

### Screen 3.1 — Login Page (`/login`)

| Attribute | Detail |
|---|---|
| **Route** | `/login` |
| **Purpose** | Authenticate users; surface role-aware demo shortcuts |
| **User roles** | Public (unauthenticated) |
| **Major components** | `<LoginForm>`, `<DemoRoleSwitcher>` |
| **Data displayed** | None (stateless form) |
| **API/Supabase source** | `supabase.auth.signInWithPassword()` |
| **User actions** | Enter email + password → login; OR click "Demo: View as Planner" / "Demo: View as Supervisor" to auto-login pre-seeded demo accounts |
| **Loading state** | Submit button shows spinner, form fields disabled |
| **Empty state** | N/A |
| **Error state** | Inline error below form: "Incorrect email or password. Try again." |
| **Success state** | Redirect to `/dashboard` |
| **Permission** | Public |
| **Realtime** | No |
| **Notes** | Demo role-switcher is the primary hackathon demo path (per AUTH.md). Real login works but is secondary. |

---

### Screen 3.2 — Dashboard (`/dashboard`)

| Attribute | Detail |
|---|---|
| **Route** | `/dashboard` |
| **Purpose** | At-a-glance project intelligence: progress vs plan, KPIs, recent activity |
| **User roles** | Planner + Supervisor |
| **Major components** | `<ProgressSummary>`, `<DisciplineBreakdown>`, `<RecentUploads>`, `<KPICard>` x4 |
| **Data displayed** | KPIs: total extractions today, auto-linked count, pending review count, unmatched count. Discipline breakdown: per-discipline matched %, variance status. Recent uploads: last 5 EXTRACTIONS rows with status. |
| **API/Supabase source** | Direct Supabase: `EXTRACTIONS`, `EXTRACTED_ACTIVITIES`, `SCHEDULE_MATCHES`, `UNMATCHED_ACTIVITIES` |
| **User actions** | Click discipline card → filter ReconciliationPage. Click "View Pending Review" → navigate to ReconciliationPage. Click upload card → navigate to UploadPage. |
| **Loading state** | KPI cards show number skeletons |
| **Empty state** | "No uploads yet — upload a daily report to see project progress." with CTA to `/upload` |
| **Error state** | Inline error per card: "Could not load [section]. Refresh to retry." |
| **Success state** | Populated dashboard with live counts and discipline breakdown |
| **Permission** | Any authenticated user |
| **Realtime** | Subscribe to `SCHEDULE_MATCHES` and `EXTRACTIONS` — live-updates KPI counts |
| **Notes** | No Gantt chart (complex, deferred). Dashboard shows tabular/card data only. |

---

### Screen 3.3 — Upload Page (`/upload`)

| Attribute | Detail |
|---|---|
| **Route** | `/upload` |
| **Purpose** | Upload a daily progress report or spreadsheet; trigger extraction and matching |
| **User roles** | Supervisor + Planner |
| **Major components** | `<UploadDropzone>`, `<UploadStatusCard>` |
| **Data displayed** | After upload: EXTRACTIONS row status (pending → processing → complete/failed). After extraction: count of activities extracted, auto-linked, pending review, unmatched. |
| **API/Supabase source** | POST `${API_BASE}/upload`. POST `${API_BASE}/extract/{extraction_id}`. POST `${API_BASE}/match/{activity_id}` (looped). Then direct Supabase for result counts. |
| **User actions** | Drag-drop or click to select file. Choose file_type from dropdown. Click "Upload & Extract". Watch progress. Click "Review Results" → navigate to ReconciliationPage. |
| **Loading state** | Upload progress bar → "Extracting activities..." spinner → "Matching to schedule..." spinner → Done |
| **Empty state** | UploadDropzone idle with supported formats listed: PDF · CSV · XLSX · TXT, max 10MB |
| **Error state** | "Upload failed — check your file format and size (max 10MB)." Extraction failed: "AI extraction failed. Retry or enter activities manually." |
| **Success state** | "Extraction complete — 14 activities extracted. 11 auto-linked, 2 pending review, 1 unmatched. [Review Results →]" |
| **Permission** | Any authenticated user |
| **Realtime** | EXTRACTIONS status column subscribed — status badge updates live |
| **Notes** | Pipeline: upload → extract → match (per activity in loop). User sees progress for each stage. Baseline schedule upload is a separate action on the Schedule page. |

---

### Screen 3.4 — Reconciliation Page (`/reconciliation`)

This is the **core screen** — the primary daily workflow for the planner.

| Attribute | Detail |
|---|---|
| **Route** | `/reconciliation` |
| **Purpose** | Show the full set of SCHEDULE_MATCHES in a reviewable table with status, confidence, and actions |
| **User roles** | Planner (full actions). Supervisor (read-only — confirm/reject buttons hidden). |
| **Major components** | `<ReconciliationTable>`, `<MatchRow>`, `<DisciplineFilterSidebar>`, `<StatusFilterBar>`, `<ConfidenceBadge>`, `<StatusBadge>` |
| **Data displayed** | Per row: extracted activity description, matched baseline activity (code + description), discipline, extraction confidence, match confidence, confidence band, planned dates, reported date, variance, current status |
| **API/Supabase source** | Direct Supabase: `SCHEDULE_MATCHES` joined with `EXTRACTED_ACTIVITIES` and `SCHEDULE_PLAN` |
| **User actions** | Filter by discipline (sidebar). Filter by status (tabs: All / Auto-Linked / Pending Review / Confirmed / Rejected). Sort by confidence, date, variance. Click row → expand inline to show candidates + audit history. Confirm/Reject (planner only). Click "View Unmatched" → UnmatchedPage. |
| **Loading state** | Table skeleton (5–8 ghost rows) |
| **Empty state** | "No matches yet — upload a daily report to begin." with CTA. OR "No pending review items." |
| **Error state** | "Could not load reconciliation data. Refresh to try again." |
| **Success state** | Populated table with all matches |
| **Permission** | Confirm/Reject actions: planner only |
| **Realtime** | Subscribe to `SCHEDULE_MATCHES` — rows update live |

**Reconciliation table columns:**

| Column | Source | Notes |
|---|---|---|
| Extracted Activity | `EXTRACTED_ACTIVITIES.activity_description` | The supervisor's exact wording |
| Matched Baseline | `SCHEDULE_PLAN.activity_code` + `activity_description` | What the system linked it to |
| Discipline | `EXTRACTED_ACTIVITIES.discipline` | Color-coded by discipline |
| Match Confidence | `SCHEDULE_MATCHES.confidence_score` | Shown as badge with band label |
| Planned Start | `SCHEDULE_PLAN.planned_start` | |
| Reported Date | `EXTRACTED_ACTIVITIES.start_time` | Date part only |
| Variance | Computed: reported - planned | Days difference; colored |
| Status | `SCHEDULE_MATCHES.status` | auto_linked / pending_review / confirmed / rejected |
| Actions | — | Confirm / Reject (planner only) |

---

### Screen 3.5 — Review Page (`/review/:matchId`)

| Attribute | Detail |
|---|---|
| **Route** | `/review/:matchId` |
| **Purpose** | Deep-dive review for a single match — full context, disambiguation, planner decision |
| **User roles** | Planner only |
| **Major components** | `<ReviewPanel>`, `<ActivityDetailCard>`, `<CandidateList>`, `<DisambiguationPanel>`, `<ConfirmRejectBar>`, `<AuditTimeline>` |
| **Data displayed** | Left panel: extracted activity full text, all extracted fields, extraction confidence breakdown, source file name. Right panel: top 3 candidate baseline activities with individual scores broken down by semantic similarity, discipline match, date proximity. Bottom: audit timeline. |
| **API/Supabase source** | Direct Supabase: `SCHEDULE_MATCHES` + joined tables. Confirm/Reject: POST to FastAPI. |
| **User actions** | Review candidate list. Select preferred candidate if wrong. Confirm → `POST /match/{matchId}/confirm`. Reject → `POST /match/{matchId}/reject` (with optional reason). Mark as New Activity. Navigate to next pending. |
| **Loading state** | Panel skeleton |
| **Empty state** | N/A — always accessed with a specific matchId |
| **Error state** | Confirm/Reject failure: inline error below action bar — does not clear the screen |
| **Success state** | Status badge updates, audit timeline shows new entry, "Next Pending →" button appears |
| **Permission** | Planner only — supervisor sees "You don't have permission to review matches" |
| **Realtime** | SCHEDULE_MATCHES subscription — audit timeline updates live |
| **Disambiguation trigger** | If top two candidates score within 0.05, `<DisambiguationPanel>` renders side-by-side comparison with "Choose this match" buttons |

**Candidate scoring breakdown displayed per candidate:**

```
Candidate: "Erect Line 247-XX Piping Spool" (L5-247-ERC)
  Semantic similarity:    0.84
  Discipline match:       + piping  → +0.05
  Date proximity:         reported Jan 18, planned Jan 19 → +0.04
  ──────────────────────────────────────────────────────
  Final match score:      0.87 — HIGH (auto-link band)
```

---

### Screen 3.6 — Unmatched Activities (`/unmatched`)

| Attribute | Detail |
|---|---|
| **Route** | `/unmatched` |
| **Purpose** | Show all extracted activities that did not reach the matching threshold |
| **User roles** | Planner primary; supervisor read |
| **Major components** | `<DataTable>`, `<ManualLinkPanel>`, `<ConfidenceBadge>`, `<StatusBadge>` |
| **Data displayed** | Per row: extracted activity description, discipline (or "unknown"), best score seen (below threshold), resolution status (unresolved / marked_new_activity / manually_linked), source file/date |
| **API/Supabase source** | Direct Supabase: `UNMATCHED_ACTIVITIES` joined with `EXTRACTED_ACTIVITIES` |
| **User actions** | Click row → expand to show best candidate(s) even though below threshold. "Search baseline" → filter SCHEDULE_PLAN, select, manual link → direct Supabase write. "Mark as New Activity" → sets resolution. |
| **Loading state** | Table skeleton |
| **Empty state** | "No unmatched activities — all extractions have been linked." (positive state) |
| **Error state** | Standard inline error |
| **Success state** | Row updates resolution status after action |
| **Permission** | Manual link / mark actions: planner only |
| **Realtime** | Subscribe to UNMATCHED_ACTIVITIES — live count update on dashboard badge |

---

### Screen 3.7 — Audit Trail (`/audit`)

| Attribute | Detail |
|---|---|
| **Route** | `/audit` |
| **Purpose** | Full chronological history of all system and human actions |
| **User roles** | Any authenticated user |
| **Major components** | `<AuditTimeline>`, `<DataTable>`, filter controls |
| **Data displayed** | Per entry: timestamp (UTC, displayed in local timezone), action type, actor (user or "System"), confidence score at time of action, linked match or unmatched activity reference |
| **API/Supabase source** | Direct Supabase: `AUDIT_TRAIL` joined with `SCHEDULE_MATCHES`, `UNMATCHED_ACTIVITIES` |
| **User actions** | Filter by date range. Filter by action type. Filter by actor. Sort by timestamp. Export to CSV. Click entry → jump to related match if applicable. |
| **Loading state** | Timeline skeleton rows |
| **Empty state** | "No audit entries yet — actions appear here as soon as the first report is processed." |
| **Error state** | Standard inline error |
| **Success state** | Chronological timeline with filters |
| **Permission** | All authenticated users (append-only; no modifications exposed) |
| **Realtime** | Subscribe to AUDIT_TRAIL — new entries appear at top |

---

### Screen 3.8 — Schedule / Baseline Page (`/schedule`)

| Attribute | Detail |
|---|---|
| **Route** | `/schedule` |
| **Purpose** | View and manage the baseline schedule. Planner uploads CSV/Excel; both roles can view. |
| **User roles** | Planner (upload + view). Supervisor (view only). |
| **Major components** | `<DataTable>` (schedule rows), `<UploadDropzone>` (CSV/XLSX only, planner only), `<DisciplineFilterSidebar>` |
| **Data displayed** | Per row: activity_code, activity_description, discipline, planned_start, planned_end. |
| **API/Supabase source** | View: direct Supabase `SCHEDULE_PLAN`. Upload: parse CSV/Excel in-browser, then `supabase.from('SCHEDULE_PLAN').insert([...])` directly from frontend (per API.md). |
| **User actions** | Upload baseline CSV (planner). Filter by discipline. Search by activity code or description. |
| **Loading state** | Table skeleton |
| **Empty state** | Planner view: "No baseline schedule loaded — upload a Primavera CSV/Excel export to begin." Supervisor: "Baseline schedule not yet loaded. Contact your planner." |
| **Error state** | CSV parse failure: "Could not parse the uploaded file. Check column format: activity_code, activity_description, discipline, planned_start, planned_end." |
| **Success state** | Populated schedule table |
| **Permission** | Upload: planner only. View: any authenticated user. |
| **Realtime** | No — baseline schedule is static after upload |

---

## 4. Frontend — Component System

### 4.1 App Shell

**`<AppShell>`** — wraps all authenticated pages. Renders `<Sidebar>` + `<TopBar>` + `{children}`. Handles auth redirect on session expiry.

**`<Sidebar>`** — vertical nav with links to all pages. Active route highlighted. Collapses on smaller screens. Role-aware labels (supervisor sees Reconciliation as read-only labeled).

**`<TopBar>`** — project name/logo, current user display name + role badge, demo role switcher, sign out.

### 4.2 UI Primitives

| Component | Props / Variants | Used in |
|---|---|---|
| `<ConfidenceBadge>` | `score: number`, `band: 'auto' | 'review' | 'unmatched'` | ReconciliationTable, ReviewPage, AuditTrail |
| `<StatusBadge>` | `status: MatchStatus | ExtractionStatus` | ReconciliationTable, UploadPage, DashboardPage |
| `<KPICard>` | `label`, `value`, `delta`, `loading` | DashboardPage |
| `<DataTable>` | `columns[]`, `rows[]`, `loading`, `emptyState` | Reconciliation, Audit, Schedule, Unmatched |
| `<EmptyState>` | `icon`, `title`, `description`, `action?` | All pages |
| `<ErrorState>` | `message`, `retry?: () => void` | All data-fetching components |
| `<LoadingSkeleton>` | `rows?`, `columns?` | All data tables |
| `<Toast>` | `type: success|error|info`, `message` | Global — feedback on actions |

**`<ConfidenceBadge>` mandatory multi-signal design (QUALITY_CHECKLIST.md requirement):**

Must NEVER rely on color alone. Every confidence indicator must show:
1. Text label (HIGH / REVIEW / LOW)
2. Numeric percentage
3. Icon (checkmark / warning triangle / X)
4. Color (secondary signal only)
5. Tooltip explaining band thresholds on hover/focus

Band thresholds (starting values — calibrated in Phase 5):
- HIGH / auto-linked: score >= 0.85
- REVIEW / pending_review: 0.70 <= score < 0.85
- LOW / unmatched: score < 0.70

### 4.3 Upload Components

**`<UploadDropzone>`** — drag-and-drop area with click-to-browse fallback. Accepts: `.pdf`, `.csv`, `.xlsx`, `.txt`. Shows file type restrictions and 10MB max. Drag-over visual state. File selected state (shows filename, size, type).

**`<UploadStatusCard>`** — shows the current EXTRACTIONS row status: pending → processing → complete | failed. Updates via Realtime subscription. Shows extracted activity counts after completion.

### 4.4 Reconciliation Components

**`<ReconciliationTable>`** — the main table. Columns as defined in Screen 3.4. Supports inline row expansion (not separate page). Shows discipline filter sidebar, status filter tabs.

**`<MatchRow>`** — single reconciliation table row. Handles expand/collapse. Shows action buttons (Confirm/Reject) only for planner role.

**`<CandidateList>`** — displayed in expanded row or ReviewPage. Shows top-3 candidates with individual score breakdowns (semantic, discipline, date). Selectable radio list.

**`<DisambiguationPanel>`** — triggered when top-2 candidates score within 0.05. Side-by-side card layout. Each card shows full candidate detail. "Choose this match" button per card.

### 4.5 Review Components

**`<ReviewPanel>`** — full-page layout for `/review/:matchId`. Left: extracted activity detail. Right: matched baseline + candidate alternatives + scoring breakdown. Bottom: audit timeline.

**`<ConfirmRejectBar>`** — sticky bottom bar with Confirm (primary action), Reject (destructive), and optional reason text for rejection. Disabled until candidate selected when disambiguation is active.

**`<ActivityDetailCard>`** — shows all extracted fields: activity_description, discipline, start_time, end_time, location_reference, confidence score breakdown.

### 4.6 Audit Component

**`<AuditTimeline>`** — vertical timeline. Each entry: timestamp, actor badge, action label (colored by action type), confidence score (if applicable), linked entity. Newest at top.

### 4.7 Dashboard Components

**`<ProgressSummary>`** — 4 KPI cards: Extracted Today, Auto-Linked, Pending Review, Unmatched.

**`<DisciplineBreakdown>`** — per-discipline: total extracted, matched %, variance trend.

**`<RecentUploads>`** — last 5 EXTRACTIONS rows with status badge and timestamp.

---

## 5. UX / Design System Plan

### 5.1 Unresolved Decision (CSS Approach) — MUST BE DECIDED BEFORE PHASE 3

> **OPEN DECISION — UD3 (Unresolved Decision)**
>
> `PRODUCT_FEATURES.md` Feature 5 MVP mentions "React + Tailwind CSS" but `TECH_STACK.md` and `FINAL_MASTER_PLAN.md` say "React" only — no CSS framework specified. This is an existing documentation inconsistency (see Appendix C1).
>
> **Options:** Tailwind CSS v3 / Vanilla CSS with CSS custom properties / CSS Modules
>
> **Planning recommendation:** Tailwind CSS v3 — fastest for a 36-hour build, extensive component patterns, good React integration.
>
> **This decision must be made and written to `DECISION_LOG.md` under the next available decision number before Phase 3 begins. It cannot be changed mid-build. Until then, it remains an unresolved decision (UD3).**

### 5.2 Design Language

OnGround is a **serious professional infrastructure operations product**, not a consumer app. Visual language must reflect this.

- **Tone:** Data-dense but readable. Functional, not decorative.
- **Typography:** Professional sans-serif. Inter recommended. NOT decorative display fonts.
- **Color palette:** Dark professional palette. Deep navy/slate backgrounds, cool grey surfaces, controlled accent (electric blue or amber). NOT generic Bootstrap blue/red/green.
- **Layout:** Information-dense tables with clear column hierarchy. Sidebar navigation.

### 5.3 Color Tokens (to be fully defined before Phase 3)

```
--color-bg-primary      (dark navy — main canvas)
--color-bg-surface      (slightly lighter — cards, panels)
--color-bg-elevated     (hover states, dropdowns)
--color-text-primary    (white / near-white)
--color-text-secondary  (muted — labels, metadata)
--color-text-disabled   (very muted)
--color-accent          (primary action — confirm, CTA)
--color-destructive     (reject, error)
--color-warning         (review band, medium confidence)
--color-success         (auto-linked, high confidence)
--color-border          (table dividers, card borders)
```

### 5.4 Confidence Visualization (mandatory multi-signal)

See Section 4.2 `<ConfidenceBadge>` — never color alone.

### 5.5 Status Visualization (multi-signal)

Status badges: `auto_linked` / `pending_review` / `confirmed` / `rejected` / `unmatched`

Each uses a distinct icon + text label in addition to color.

### 5.6 Accessibility

- Color-blind friendly: discipline colors distinguishable in grayscale
- Keyboard navigation on reconciliation table (tab to row, Enter to expand, keyboard shortcuts for confirm/reject)
- Focus states visible on all interactive elements
- ARIA labels on badge components
- Tooltips for all scores/metrics (on hover and focus)

### 5.7 Responsive Behavior

Desktop-first (construction PMs use laptops). Minimum breakpoint: 1024px. Tablet (768px) degrades gracefully. Mobile not a demo target (MVP is web only per PRD).

### 5.8 Loading / Empty / Error State Patterns

All three states mandatory per QUALITY_CHECKLIST.md.

- **Loading:** Skeleton rows (same layout as data, grey placeholders). No spinners for tables.
- **Empty:** Icon + clear message + contextual action CTA.
- **Error:** Inline error near the affected component. Retry button where applicable. Does not clear the rest of the page.

---

## 6. Backend — Complete API Plan

### 6.1 Base configuration

```
FastAPI app with CORS for:
  - http://localhost:5173 (Vite dev)
  - https://*.vercel.app (production frontend)
  - FRONTEND_URL env var (override)

All responses: JSON
Error shape: { "error": "<code>", "message": "<plain language>", "<id_field>": "..." }
Auth: Bearer token from Supabase Auth — validated on all non-health endpoints
```

### 6.2 `GET /health`

| Field | Detail |
|---|---|
| **Method** | GET |
| **Path** | `/health` |
| **Purpose** | Liveness check — deployment platform health check, local verification |
| **Request** | None |
| **Response** | `{ "status": "ok", "version": "1.0.0" }` |
| **Auth** | None (public) |

### 6.3 `POST /upload`

| Field | Detail |
|---|---|
| **Method** | POST |
| **Path** | `/upload` |
| **Purpose** | Accept a file upload, store in Supabase Storage, create EXTRACTIONS row |
| **Request** | `multipart/form-data`: file (binary), project_id (str, uuid), file_type (str: daily_report / spreadsheet / voice_transcript) |
| **Response** | `{ "extraction_id": "uuid", "file_url": "storage_url", "status": "pending" }` |
| **Validation** | File extension: `.pdf`, `.csv`, `.xlsx`, `.txt` only. File size <= 10MB. project_id is valid UUID. file_type is recognized enum. |
| **Auth** | Any authenticated user. JWT validated via Supabase. |
| **DB** | INSERT into `EXTRACTIONS`. File stored in Supabase Storage bucket `reports/`. |
| **Service** | No service call — upload and row creation only. |
| **Errors** | 400: invalid file type / file too large / missing project_id. 401: not authenticated. 500: storage upload failed. |

### 6.4 `POST /extract/{extraction_id}`

| Field | Detail |
|---|---|
| **Method** | POST |
| **Path** | `/extract/{extraction_id}` |
| **Purpose** | Run LLM extraction on an uploaded file. Writes EXTRACTED_ACTIVITIES rows and updates EXTRACTIONS status. |
| **Request** | Path param: `extraction_id` (uuid). No body. |
| **Response** | `{ "extraction_id": "uuid", "activities": [...], "status": "complete" }` |
| **Validation** | extraction_id must exist in EXTRACTIONS. Status must be `pending`. |
| **Auth** | Any authenticated user. |
| **DB** | UPDATE `EXTRACTIONS.status` = 'processing'. Download file. Run extraction. INSERT `EXTRACTED_ACTIVITIES`. UPDATE status = 'complete' or 'failed'. INSERT `AUDIT_TRAIL` per activity. |
| **Service** | `extraction_service.py` |
| **Errors** | 404: not found. 409: already processed. 422: file unreadable. 500: LLM failure. |

### 6.5 `POST /match/{extracted_activity_id}`

| Field | Detail |
|---|---|
| **Method** | POST |
| **Path** | `/match/{extracted_activity_id}` |
| **Purpose** | Run matching for one extracted activity against the project baseline schedule. |
| **Request** | Path param: `extracted_activity_id` (uuid). |
| **Response** | `{ "status": "auto_linked" | "pending_review" | "unmatched", "match": { match object } }` |
| **Validation** | extracted_activity_id must exist. Must not already have a match row. |
| **Auth** | Any authenticated user. |
| **DB** | Read `SCHEDULE_PLAN`. Compute match. INSERT `SCHEDULE_MATCHES` or `UNMATCHED_ACTIVITIES`. INSERT `AUDIT_TRAIL`. |
| **Service** | `matching_service.py`, `audit_service.py` |
| **Errors** | 404: activity not found. 409: already matched. 500: embedding failure. |

### 6.6 `POST /match/{match_id}/confirm`

| Field | Detail |
|---|---|
| **Method** | POST |
| **Path** | `/match/{match_id}/confirm` |
| **Purpose** | Planner confirms a pending_review match. |
| **Request** | Path param: `match_id` (uuid). No body. |
| **Response** | `{ "match_id": "uuid", "status": "confirmed" }` |
| **Validation** | match_id must exist. Status must be `pending_review` or `auto_linked`. |
| **Auth** | **Planner role only.** RLS also enforces this. |
| **DB** | UPDATE `SCHEDULE_MATCHES.status` = 'confirmed', set `resolved_by`. INSERT `AUDIT_TRAIL`. |
| **Errors** | 403: supervisor attempting to confirm. 404: not found. 409: already resolved. |

### 6.7 `POST /match/{match_id}/reject`

| Field | Detail |
|---|---|
| **Method** | POST |
| **Path** | `/match/{match_id}/reject` |
| **Purpose** | Planner rejects a proposed match. Activity becomes available for manual re-linking. |
| **Request** | Path param: `match_id` (uuid). Optional body: `{ "reason": "string" }`. |
| **Response** | `{ "match_id": "uuid", "status": "rejected" }` |
| **Validation** | match_id must exist. Status must not already be confirmed/rejected. |
| **Auth** | **Planner role only.** RLS also enforces this. |
| **DB** | UPDATE `SCHEDULE_MATCHES.status` = 'rejected'. INSERT `AUDIT_TRAIL`. |
| **Errors** | 403: supervisor attempting to reject. 404: not found. 409: already resolved. |

### 6.8 Auth middleware

All routes except `/health` require a valid Supabase JWT Bearer token. FastAPI dependency `get_current_user(token)` decodes the JWT, fetches the user profile, returns a `CurrentUser` object with `id` and `role`.

---

## 7. Service Architecture

### 7.1 `extraction_service.py`

**Responsibility:** Text extraction from file → LLM call → response parsing → Pydantic validation → deterministic confidence → DB writes.

**Internal steps:**

1. Fetch file URL from `EXTRACTIONS`
2. Download file bytes from Supabase Storage
3. Dispatch to text extractor by file type:
   - PDF: pdfplumber → extract text from all pages
   - CSV: pandas → read, convert rows to descriptive text
   - XLSX: pandas (openpyxl) → read, convert rows to descriptive text
   - TXT: direct read with encoding detection
4. Clean and normalize text: strip whitespace, normalize Unicode, truncate to ~8000 chars
5. Call `llm.extract_activities(raw_text)` → raw JSON string
6. Parse JSON (try/except around `json.loads`) — on malformed JSON: log error, return extraction_failed
7. Validate against `ExtractedActivityRaw` Pydantic model
8. For each valid activity: calculate deterministic confidence (see Section 8.3)
9. Batch INSERT into `EXTRACTED_ACTIVITIES`
10. INSERT `AUDIT_TRAIL` entries (action='extracted') per activity
11. UPDATE `EXTRACTIONS.status` = 'complete'
12. Return `ExtractionResult`

**On failure at any step:** UPDATE `EXTRACTIONS.status` = 'failed'. Return error.

### 7.2 `matching_service.py`

**Responsibility:** Embedding computation → filtered candidate selection → cosine similarity → contextual scoring → confidence banding → DB writes.

**Internal steps:**

1. Fetch `EXTRACTED_ACTIVITIES` row by id
2. Fetch all `SCHEDULE_PLAN` rows for the project
3. Filter by discipline (only matching discipline; if "unknown", use all)
4. Filter by date window (+-30 days from extracted start; skip if no start_time)
5. Compute embedding for extracted activity_description
6. Batch-compute embeddings for all candidate descriptions
7. Compute cosine similarity
8. Apply contextual scoring per candidate (Section 9.5)
9. Sort candidates by final score descending
10. Apply confidence banding (Section 9.6)
11. Disambiguation check (Section 9.7)
12. INSERT `SCHEDULE_MATCHES` or `UNMATCHED_ACTIVITIES`
13. INSERT `AUDIT_TRAIL`
14. Return `MatchResult`

### 7.3 `audit_service.py`

**Responsibility:** Write `AUDIT_TRAIL` entries. Called by all other services.

```python
def log_action(
    action: str,
    supabase: Client,
    related_match_id: UUID | None = None,
    related_unmatched_id: UUID | None = None,
    confidence_score: float | None = None,
    actor: UUID | None = None  # None = system-actioned
) -> None
```

**Actions:** `extracted`, `auto_linked`, `flagged`, `confirmed`, `rejected`, `manually_linked`

### 7.4 `llm/provider.py` — Abstract interface

```python
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    def extract_activities(self, raw_text: str) -> str:
        """Returns raw JSON string of extracted activities."""
        ...
```

### 7.5 `llm/openrouter.py` — Concrete implementation

Posts to `https://openrouter.ai/api/v1/chat/completions` with the structured extraction prompt. Uses `api_key` and `model` from environment variables. 30-second timeout. Raises on HTTP error or timeout.

**Provider factory** (in `main.py`):

```python
def get_llm_provider() -> LLMProvider:
    provider_name = os.getenv("LLM_PROVIDER", "openrouter")
    if provider_name == "openrouter":
        return OpenRouterProvider(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            model=os.getenv("LLM_MODEL")
        )
    raise ValueError(f"Unknown LLM_PROVIDER: {provider_name}")
```

---

## 8. AI Pipeline — Extraction

### 8.1 Text extraction by file type

| Format | Library | Approach |
|---|---|---|
| `.pdf` | `pdfplumber` | Iterate pages, extract text per page, join with newlines |
| `.csv` | `pandas` | Read all rows, convert each row to natural-language sentence |
| `.xlsx` | `pandas` + `openpyxl` | Same as CSV after reading sheet |
| `.txt` | built-in `open()` | UTF-8 with `errors='replace'` fallback |

Text normalization: strip whitespace, collapse blank lines, NFKC Unicode normalization, truncate to ~8000 chars at last sentence boundary.

### 8.2 LLM prompt strategy

**System prompt:**

```
You are a construction activity extractor. Extract structured activity data from the
provided construction site progress report.
Return ONLY valid JSON — no explanation, no markdown, no preamble.
Output format:
{
  "activities": [
    {
      "activity_description": "string - what was done",
      "discipline": "civil | piping | electrical | instrumentation | static_rotating_equipment | hse | unknown",
      "start_date": "YYYY-MM-DD or null",
      "start_time": "HH:MM or null",
      "end_date": "YYYY-MM-DD or null",
      "location_reference": "string or null"
    }
  ]
}
Do not invent information not present in the report. Use null for missing fields.
Do not add a confidence field.
```

**User message:** The raw extracted text from the file.

**Retry:** Up to 3 retries on timeout or HTTP 5xx. No retry on malformed JSON (different error path). 30-second timeout per attempt.

### 8.3 Deterministic confidence calculation (post-LLM — server-side only)

```
confidence = 0.50  (base)
+ 0.30  if start_date is present and parses as a valid date
+ 0.25  if discipline is recognized (not 'unknown')
+ 0.20  if activity_description length > 20 characters
+ 0.10  if start_time is present
= total, clamped to [0.0, 1.0]
```

Computed in `extraction_service.py` AFTER LLM response parsing. LLM output is NOT trusted for confidence. Any `confidence` field in LLM response is stripped during validation.

### 8.4 Pydantic validation (post-LLM)

**`ExtractedActivityRaw`** schema:

```python
class ExtractedActivityRaw(BaseModel):
    activity_description: str             # required, min length 1
    discipline: str = "unknown"           # default unknown if missing
    start_date: Optional[date] = None
    start_time: Optional[str] = None      # HH:MM format
    end_date: Optional[date] = None
    location_reference: Optional[str] = None
    # Extra fields from LLM are stripped (model_config extra='ignore')
```

Validation rules:
- `activity_description` must be non-empty
- `discipline` coerced to lowercase, validated against known enum — if not recognized, set to "unknown"
- `start_date` parsed with `dateparser` — if unparseable, set to None
- `start_time` validated as HH:MM — if malformed, set to None
- Extra fields stripped (including any `confidence` the LLM adds)

### 8.5 Failure handling

| Failure | Behavior |
|---|---|
| LLM timeout (30s) | Retry up to 3x. After 3 failures: status = 'failed', return error |
| LLM HTTP 5xx | Same as timeout |
| LLM returns non-JSON | No retry. status = 'failed', return error |
| LLM returns wrong schema | Log invalid activities, continue with valid ones. If zero valid: status = 'failed' |
| LLM hallucinates confidence | Stripped during validation |
| PDF has no extractable text | Error: "Could not read text from this PDF. Ensure it is not a scanned image." |
| File not found in Storage | Return error |

---

## 9. AI Pipeline — Matching

### 9.1 Model loading

`sentence-transformers` model `all-MiniLM-L6-v2` loaded ONCE at FastAPI app startup (not per request). Downloads automatically on first run (~80MB). Inference: CPU-only.

### 9.2 Discipline filtering

- If extracted discipline is recognized (not "unknown"): only consider SCHEDULE_PLAN rows where `discipline` = extracted discipline
- If extracted discipline is "unknown": consider all SCHEDULE_PLAN rows

Hard filter applied BEFORE embedding computation.

### 9.3 Date proximity filtering

Date window: +-30 calendar days from extracted start_date (configurable constant).

- If extracted start_date is None: skip date filter
- If SCHEDULE_PLAN row planned_start within [extracted_start - 30, extracted_start + 30]: include as candidate

Applied as a pre-filter BEFORE embedding computation.

### 9.4 Embedding and cosine similarity

```python
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")

extracted_embedding = model.encode([activity_description])          # shape (1, 384)
candidate_embeddings = model.encode([c.activity_description for c in candidates])  # (N, 384)
scores = cosine_similarity(extracted_embedding, candidate_embeddings)[0]  # shape (N,)
```

### 9.5 Contextual scoring formula

Per candidate:

```
final_score = (cosine_similarity * 0.70)
            + (extraction_confidence * 0.20)
            + (date_proximity_boost * 0.10)
            - discipline_mismatch_penalty

date_proximity_boost:
  |reported_date - planned_start| <= 3 days  -> 0.05
  |reported_date - planned_start| <= 7 days  -> 0.02
  otherwise                                   -> 0.00

discipline_mismatch_penalty:
  discipline recognized AND != plan discipline -> -0.10
  discipline is "unknown" OR matches           -> 0.00
```

### 9.6 Confidence banding

After sorting candidates by `final_score` descending:

| Band | Threshold | Status | Action |
|---|---|---|---|
| HIGH | top score >= 0.85 | `auto_linked` | INSERT SCHEDULE_MATCHES with status='auto_linked' |
| REVIEW | 0.70 <= top < 0.85 | `pending_review` | INSERT SCHEDULE_MATCHES with status='pending_review' |
| LOW | top < 0.70 | `unmatched` | INSERT UNMATCHED_ACTIVITIES with best_score |

**Threshold calibration:** 0.85/0.70 are starting values. Must be calibrated in Phase 5 against synthetic test set. Target: zero false-positive auto-links in demo dataset.

### 9.7 Disambiguation

**Condition:** status is `pending_review` AND `|score[0] - score[1]| < 0.05` (top two within 0.05)

**Action:** Store top-3 candidates in `SCHEDULE_MATCHES.candidates` (jsonb column). Frontend `<DisambiguationPanel>` detects this condition and renders side-by-side UI.

**Schema note:** Requires `candidates jsonb` column on `SCHEDULE_MATCHES`. This is a REQUIRED schema addition — see Section 10.4 and Appendix C5 for full detail.

**Candidates JSONB structure — canonical definition:**

Each element in the array represents one candidate baseline activity. The array is ordered by `score` descending (index 0 = best match). Up to 3 candidates are stored.

```json
[
  {
    "plan_activity_id": "uuid-of-schedule-plan-row",
    "activity_code": "L5-247-ERC",
    "activity_description": "Erect Line 247-XX Piping Spool",
    "score": 0.87
  },
  {
    "plan_activity_id": "uuid-of-schedule-plan-row",
    "activity_code": "L5-247-FAB",
    "activity_description": "Fabricate Line 247-XX Piping Spool",
    "score": 0.84
  }
]
```

**Field definitions:**

| Field | Type | Required | Source | Notes |
|---|---|---|---|---|
| `plan_activity_id` | string (uuid) | Yes | `SCHEDULE_PLAN.id` | FK reference — used for navigation and confirm/select actions |
| `activity_code` | string | Yes | `SCHEDULE_PLAN.activity_code` | Displayed in `<CandidateList>` and `<DisambiguationPanel>` |
| `activity_description` | string | Yes | `SCHEDULE_PLAN.activity_description` | Displayed alongside the score for human comparison |
| `score` | float (0.0–1.0+) | Yes | `matching_service.py` final_score | The raw contextual score as computed (Section 9.5); not clamped |

**Notes for backend implementation:** All four fields must be populated when writing the `candidates` column. The backend must join `SCHEDULE_PLAN` at match time to retrieve `activity_code` and `activity_description` — do not store only the UUID.

**Notes for frontend implementation:** `<CandidateList>` and `<DisambiguationPanel>` should read directly from the `candidates` field on the `SCHEDULE_MATCHES` row. No additional API call is needed to render candidates. The disambiguation panel is activated when `candidates` array length >= 2 AND `|candidates[0].score - candidates[1].score| < 0.05`.

### 9.8 Manual fallback

For UNMATCHED_ACTIVITIES, planner can:
1. Search SCHEDULE_PLAN via client-side text filter
2. Select a plan activity
3. Direct Supabase write: INSERT SCHEDULE_MATCHES with status='confirmed' + INSERT AUDIT_TRAIL (action='manually_linked')

Handled entirely from the frontend — no FastAPI endpoint needed.

---

## 10. Database Implementation Plan

> **REQUIRED PRE-IMPLEMENTATION ACTION — DATABASE.md MUST BE RECONCILED**
>
> This plan introduces two schema additions that are not present in the current `docs/DATABASE.md`:
> 1. `EXTRACTED_ACTIVITIES.extraction_confidence` — `float NOT NULL`
> 2. `SCHEDULE_MATCHES.candidates` — `jsonb nullable`
>
> Both additions are architecturally required (see Appendix C4 and C5 for the full rationale). Before any implementation begins, `docs/DATABASE.md` must be updated to include these two columns. Implementation must not proceed against a schema that diverges from `DATABASE.md` — the SQL migration file (`backend/db/schema.sql`) must match the updated `DATABASE.md` exactly.
>
> **Action required: update `docs/DATABASE.md` as the first step of Phase 1, immediately after this plan is approved.**

All remaining tables from DATABASE.md are locked. No other schema changes are introduced by this plan.

### 10.1 `SCHEDULE_PLAN`

**Purpose:** Immutable baseline schedule. Uploaded once per project by planner.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default uuid_generate_v4() |
| `project_id` | uuid NOT NULL | |
| `activity_code` | text NOT NULL | e.g. "L5-247-ERC" |
| `activity_description` | text NOT NULL | |
| `discipline` | text NOT NULL | CHECK in ('civil','piping','electrical','instrumentation','static_rotating_equipment','hse') |
| `planned_start` | date NOT NULL | |
| `planned_end` | date NOT NULL | |
| `created_at` | timestamptz NOT NULL | default now() |

**Indexes:** `(discipline)`, `(project_id)`, `(planned_start, planned_end)`

**RLS:** SELECT: any authenticated user. INSERT/UPDATE/DELETE: `role = 'planner'` only.

### 10.2 `EXTRACTIONS`

**Purpose:** One row per uploaded file. Tracks job status.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `project_id` | uuid NOT NULL | |
| `file_url` | text NOT NULL | Supabase Storage path |
| `file_type` | text | CHECK in ('daily_report','spreadsheet','voice_transcript') |
| `status` | text | CHECK in ('pending','processing','complete','failed') |
| `uploaded_by` | uuid | FK -> auth.users |
| `created_at` | timestamptz NOT NULL | default now() |

**RLS:** SELECT: any authenticated user. INSERT: any authenticated user. UPDATE: backend service role only (status transitions).

### 10.3 `EXTRACTED_ACTIVITIES`

**Purpose:** Structured LLM output. One row per extracted activity per file.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `extraction_id` | uuid FK -> EXTRACTIONS.id | |
| `activity_description` | text NOT NULL | |
| `discipline` | text nullable | "unknown" if not recognized |
| `start_time` | timestamptz nullable | |
| `end_time` | timestamptz nullable | |
| `location_reference` | text nullable | |
| `extraction_confidence` | float NOT NULL | **REQUIRED ADDITION** — deterministic confidence score calculated server-side by `extraction_service.py` (Section 8.3). Not from LLM output. |
| `created_at` | timestamptz NOT NULL | default now() |

**RLS:** SELECT: any authenticated user. INSERT: backend service role.

### 10.4 `SCHEDULE_MATCHES`

**Purpose:** Links an extracted activity to a plan node.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `extracted_activity_id` | uuid FK -> EXTRACTED_ACTIVITIES.id UNIQUE | |
| `plan_activity_id` | uuid FK -> SCHEDULE_PLAN.id | |
| `confidence_score` | float NOT NULL | Final match score |
| `status` | text | CHECK in ('auto_linked','pending_review','confirmed','rejected') |
| `resolved_by` | uuid nullable FK -> auth.users | Set on confirm/reject |
| `candidates` | jsonb nullable | **REQUIRED ADDITION** — ordered array of up to 3 candidate matches. Fields per element: `plan_activity_id` (uuid), `activity_code` (text), `activity_description` (text), `score` (float). Full spec in Section 9.7. |
| `created_at` | timestamptz NOT NULL | default now() |

**RLS:** SELECT: any authenticated user. INSERT: backend service role. UPDATE (status): `role = 'planner'` only.

### 10.5 `UNMATCHED_ACTIVITIES`

**Purpose:** Activities with no plan match above threshold.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `extracted_activity_id` | uuid FK -> EXTRACTED_ACTIVITIES.id | |
| `best_score` | float nullable | Highest score seen, even if below threshold |
| `resolution` | text | CHECK in ('unresolved','marked_new_activity','manually_linked'), default 'unresolved' |
| `created_at` | timestamptz NOT NULL | default now() |

**RLS:** SELECT: any authenticated user. INSERT: backend service role. UPDATE (resolution): `role = 'planner'` only.

### 10.6 `AUDIT_TRAIL`

**Purpose:** Append-only log of every action.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `related_match_id` | uuid nullable FK -> SCHEDULE_MATCHES.id | |
| `related_unmatched_id` | uuid nullable FK -> UNMATCHED_ACTIVITIES.id | |
| `action` | text NOT NULL | CHECK in ('extracted','auto_linked','flagged','confirmed','rejected','manually_linked') |
| `confidence_score` | float nullable | Score at time of action |
| `actor` | uuid nullable FK -> auth.users | null = system |
| `created_at` | timestamptz NOT NULL | default now() |

**RLS:** SELECT: any authenticated user. INSERT: backend service role AND any authenticated user (manual link). UPDATE: nobody. DELETE: nobody. (Append-only enforced at DB level.)

---

## 11. Supabase Setup Plan

### 11.1 What is configured manually (Supabase dashboard)

1. Create Supabase project. Record URL and keys.
2. Storage bucket `reports` — private. Backend service role can upload; frontend does not upload directly.
3. Auth settings — enable Email provider. Disable email confirmation for demo (instant login).
4. Create two demo user accounts: one planner, one supervisor.
5. Create `profiles` table (id FK → auth.users, role text). Add trigger to auto-create profile on auth.users INSERT.

### 11.2 What is handled via project files

1. `backend/db/schema.sql` — all CREATE TABLE, RLS policies, indexes. Executed once in Supabase SQL editor.
2. `data/seed.sql` or Python seed script — inserts synthetic baseline schedule into SCHEDULE_PLAN, inserts demo user profiles.

### 11.3 Supabase Realtime

Enable Realtime on:
- `EXTRACTIONS` — extraction status updates
- `EXTRACTED_ACTIVITIES` — live count updates
- `SCHEDULE_MATCHES` — live reconciliation table
- `UNMATCHED_ACTIVITIES` — live unmatched count badge
- `AUDIT_TRAIL` — live audit timeline

### 11.4 Setup sequence

```
1. Create Supabase project
2. Run schema.sql (creates all tables, RLS, indexes, two schema additions)
3. Enable Realtime on 5 tables
4. Create Storage bucket 'reports'
5. Create demo user accounts (planner, supervisor)
6. Create profile rows for demo users (set role column)
7. Run seed script (load baseline schedule)
8. Verify backend connectivity (SUPABASE_URL + SERVICE_KEY)
9. Verify frontend connectivity (SUPABASE_URL + ANON_KEY)
```

---

## 12. Authorization Plan

### 12.1 Two roles (locked per D9, AUTH.md)

| Role | Can do |
|---|---|
| `planner` | Upload baseline schedule. Confirm/reject matches. View all disciplines and all tables. Manual link unmatched activities. |
| `supervisor` | Upload daily reports. View reconciliation table (read-only). View audit trail. Cannot confirm/reject. |

### 12.2 Three enforcement layers (all three required)

**Layer 1 — Supabase RLS (actual security boundary):**
- SCHEDULE_PLAN INSERT/UPDATE/DELETE: `auth.jwt() ->> 'role' = 'planner'`
- SCHEDULE_MATCHES UPDATE: `auth.jwt() ->> 'role' = 'planner'`
- UNMATCHED_ACTIVITIES UPDATE: `auth.jwt() ->> 'role' = 'planner'`
- AUDIT_TRAIL UPDATE/DELETE: nobody

**Layer 2 — FastAPI auth middleware (role check on confirm/reject):**
- `/match/{id}/confirm` and `/match/{id}/reject` return 403 if user.role != 'planner'

**Layer 3 — Frontend UI guard (UX, not security):**
- `<ConfirmRejectBar>` not rendered for supervisor role
- Schedule upload dropzone hidden for supervisor
- Actions that would fail are never shown to supervisor

### 12.3 Role detection

Role stored in user's profile row. Read from Supabase after login. Stored in React context via `useAuth` hook. Available to all components.

### 12.4 Demo role switcher

`<DemoRoleSwitcher>` in TopBar. Uses `supabase.auth.signInWithPassword()` with pre-seeded demo accounts (real sign-out + sign-in). Available in all environments.

---

## 13. API ↔ Supabase Responsibility Split

### Handled by FastAPI

| Action | Why FastAPI |
|---|---|
| `POST /upload` | File handling, Storage upload, EXTRACTIONS insert |
| `POST /extract/{id}` | LLM call, text processing, batch EXTRACTED_ACTIVITIES insert |
| `POST /match/{id}` | Embedding computation, cosine similarity, banding, DB writes |
| `POST /match/{id}/confirm` | Atomic: SCHEDULE_MATCHES update + AUDIT_TRAIL insert. Role enforcement. |
| `POST /match/{id}/reject` | Same — atomic update + audit + role enforcement |

### Handled by frontend Supabase client directly

| Action | Supabase call |
|---|---|
| List extracted activities | `supabase.from('EXTRACTED_ACTIVITIES').select('*, EXTRACTIONS(file_url, created_at)')` |
| Reconciliation table data | `supabase.from('SCHEDULE_MATCHES').select('*, EXTRACTED_ACTIVITIES(*), SCHEDULE_PLAN(*)')` |
| Unmatched activities | `supabase.from('UNMATCHED_ACTIVITIES').select('*, EXTRACTED_ACTIVITIES(*)')` |
| Audit trail | `supabase.from('AUDIT_TRAIL').select(*)` |
| Dashboard KPI counts | Supabase count queries per table |
| Upload baseline schedule | Parse CSV in-browser, `supabase.from('SCHEDULE_PLAN').insert([...])` |
| View baseline schedule | `supabase.from('SCHEDULE_PLAN').select(*)` |
| Manual link (unmatched → plan) | `supabase.from('SCHEDULE_MATCHES').insert({...confirmed match...})` + AUDIT_TRAIL insert |
| Update UNMATCHED resolution | `supabase.from('UNMATCHED_ACTIVITIES').update({resolution: 'marked_new_activity'})` |

---

## 14. Realtime Plan

| Table | Events | Hook | Screen | Value |
|---|---|---|---|---|
| `EXTRACTIONS` | UPDATE | `useExtractions` | UploadPage | Live status: pending → processing → complete |
| `EXTRACTED_ACTIVITIES` | INSERT | Dashboard count hook | DashboardPage | Live count of extracted activities |
| `SCHEDULE_MATCHES` | INSERT, UPDATE | `useMatches` | ReconciliationPage, Dashboard | Live row updates as matching completes + confirm/reject |
| `UNMATCHED_ACTIVITIES` | INSERT, UPDATE | `useMatches` | UnmatchedPage, Dashboard badge | Live unmatched count |
| `AUDIT_TRAIL` | INSERT | `useAuditTrail` | AuditPage, ReviewPage | Live audit timeline |

**Not subscribed:** `SCHEDULE_PLAN` (static after upload).

**Stale data recovery:** On Realtime reconnect, re-fetch the full dataset once to ensure consistency.

**Implementation pattern:**

```typescript
useEffect(() => {
  const channel = supabase
    .channel('schedule_matches_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'SCHEDULE_MATCHES' },
      (payload) => { /* update local state */ })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, []);
```

---

## 15. Error Handling Plan

### 15.1 Frontend strategy

All data-fetching hooks return `{ data, error, loading }`. Every component handles all three states. No component may assume `data` is always present.

Plain language only — never raw Supabase error strings. Never "Error" alone. Never stack traces.

### 15.2 Backend error catalog

| Error category | HTTP | Code | User message |
|---|---|---|---|
| Invalid file type | 400 | `invalid_file_type` | "Only PDF, CSV, XLSX, and TXT files are supported." |
| File too large | 400 | `file_too_large` | "File exceeds 10MB limit." |
| Extraction not found | 404 | `not_found` | "Extraction not found." |
| Already processed | 409 | `already_processed` | "This file has already been processed." |
| LLM extraction failed | 500 | `extraction_failed` | "AI extraction failed. Retry or enter activities manually." |
| LLM timeout | 500 | `extraction_timeout` | "AI extraction timed out. Retry the extraction." |
| Supabase write failure | 500 | `database_error` | "Failed to save results. Try again." |
| Unauthorized (role) | 403 | `forbidden` | "You don't have permission to perform this action." |
| Unauthenticated | 401 | `unauthorized` | "Please log in to continue." |

### 15.3 What must never happen (per ERROR_HANDLING.md)

- A user-facing error showing "Error" or a raw exception/stack trace
- A failed background action that silently fails with no visible indication
- An error that loses unsaved user input

### 15.4 Frontend action failure behavior

Confirm/reject failure: keeps the row in its previous state. Shows inline error next to the button. Does NOT clear the page or the user's place.

---

## 16. Security Plan

### 16.1 Environment variable classification

| Variable | Where | Classification |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend `.env` | Public — RLS is the security boundary |
| `VITE_SUPABASE_ANON_KEY` | Frontend `.env` | Public — safe to expose |
| `VITE_API_BASE_URL` | Frontend `.env` | Public |
| `SUPABASE_URL` | Backend `.env` | Public |
| `SUPABASE_SERVICE_KEY` | Backend `.env` | **SECRET — bypasses RLS. Never in frontend.** |
| `LLM_PROVIDER` | Backend `.env` | Non-secret config |
| `LLM_MODEL` | Backend `.env` | Non-secret config |
| `OPENROUTER_API_KEY` | Backend `.env` | **SECRET — backend only** |

### 16.2 `.env.example` files

`backend/.env.example`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
LLM_PROVIDER=openrouter
LLM_MODEL=your_chosen_model
OPENROUTER_API_KEY=your_openrouter_api_key
```

`frontend/.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=http://localhost:8000
```

### 16.3 `.gitignore` must exclude

`.env` (all locations), `__pycache__/`, `*.pyc`, `node_modules/`, `.venv/`, `dist/`, `.vite/`

### 16.4 File upload security

- Extension whitelist: `.pdf`, `.csv`, `.xlsx`, `.txt` (check extension AND MIME type)
- Size limit: 10MB enforced in FastAPI before reading content
- Storage path: `reports/{extraction_id}/{filename}` — not publicly accessible
- File content never executed or used in raw SQL

### 16.5 Prompt injection mitigation (per SECURITY.md)

Extraction prompt instructs the model only to extract, never to follow embedded instructions. LLM output validated against strict schema. Confidence from deterministic calculation only — even a successful prompt injection cannot produce an auto-link.

### 16.6 RLS verification (mandatory before demo)

- Supervisor JWT → SCHEDULE_MATCHES UPDATE → must fail (403/RLS error)
- Planner JWT → SCHEDULE_PLAN INSERT → must succeed
- Any user → AUDIT_TRAIL UPDATE/DELETE → must fail

---

## 17. Testing Plan

### 17.1 Philosophy (per TESTING.md)

Catch failures that would embarrass the team on demo day. Not 100% coverage. One clean run before final polish pass (Phase 6).

### 17.2 Unit tests (`backend/tests/`)

**`test_matching_service.py`** (HIGH priority):
- Exact-text match produces score >= 0.85 (auto-link band)
- Partial/fuzzy text produces score in review band (0.70-0.85)
- Unrelated text produces score < 0.70 (unmatched)
- Discipline filter: piping activity vs electrical plan → penalty applied
- Date proximity boost: activity 2 days from plan start → +0.05 applied
- Disambiguation trigger: top-2 within 0.05 → flag correctly
- Banding: given a score, returns correct status enum

**`test_schemas.py`** (HIGH priority):
- Valid extraction JSON passes `ExtractedActivityRaw` validation
- Missing `activity_description` raises validation error
- Unknown discipline defaults to "unknown"
- Extra fields (e.g. `confidence` from LLM) are stripped

**`test_llm_provider.py`** (HIGH priority):
- Mock provider returning valid JSON → pipeline produces correct objects + correct deterministic confidence
- Mock provider returning malformed JSON → extraction_service returns error, no crash
- Mock provider raising timeout → extraction_service catches, returns `extraction_failed`

**`test_extraction_service.py`** (MEDIUM priority):
- Deterministic confidence: all fields present → score = min(1.0, 0.50+0.30+0.25+0.20+0.10)
- Missing start_date only → score reduced by 0.30
- Short activity_description (<20 chars) → score reduced by 0.20

### 17.3 Frontend tests (LOW priority — smoke tests only)

- `<ConfidenceBadge>` renders correct text label and icon for each band
- `<ReconciliationTable>` renders empty state when no data
- Auth redirect: unauthenticated access to `/dashboard` redirects to `/login`

### 17.4 RLS verification tests

Using live Supabase test project:
- Supervisor JWT → SCHEDULE_MATCHES UPDATE returns 403
- Planner JWT → SCHEDULE_PLAN INSERT succeeds
- Supervisor JWT → SCHEDULE_PLAN INSERT returns 403
- Any user → AUDIT_TRAIL UPDATE returns 403
- Any user → AUDIT_TRAIL DELETE returns 403

### 17.5 Evaluation metrics (Phase 5 — accuracy, not correctness)

Per QUALITY_CHECKLIST.md:
- Extraction recall: >= 85% of activities in synthetic reports correctly extracted
- Matching top-1 accuracy: >= 80% of extracted activities match the correct baseline node
- **Zero false-positive auto-links in the demo dataset**
- No hallucinated timestamps/fields in 5-activity spot check
- Deterministic confidence calculation produces expected scores

### 17.6 End-to-end manual test (before Phase 6)

1. Log in as supervisor → upload daily_report_piping.txt → extraction runs → activities in reconciliation table
2. Log in as planner → see pending_review items → confirm one → audit trail shows entry
3. Attempt to confirm as supervisor → blocked (UI hides button, direct API call returns 403)
4. Unmatched activities appear → manually link one → resolution updates

---

## 18. Demo / Synthetic Data Plan

### 18.1 Baseline schedule (`data/baseline_schedule.csv`)

20–30 activities covering 6 disciplines.

**Format:** `activity_code, activity_description, discipline, planned_start, planned_end`

**Coverage must include:**
- Activities with obvious text matches (for high-confidence auto-links)
- Activities with terminology differences (for review-band matches)
- Activities with no corresponding report (for unmatched schedule items)
- At least 4 different disciplines
- One ambiguous pair (two schedule items similar enough to trigger disambiguation)

### 18.2 Daily progress reports (`data/`)

**`sample_report_piping.txt`** — text daily report:
- 4-5 activities with clear descriptions → auto-link band
- 1-2 activities with fuzzy descriptions → review band
- 1 activity not in schedule → unmatched path

**`sample_report_electrical.txt`** — similar structure for electrical discipline.

**`sample_report_mixed.csv`** — spreadsheet with entries from multiple disciplines. Tests multi-discipline handling.

### 18.3 Demo flow the data must prove

```
1. Upload sample_report_piping.txt
   -> 6 activities extracted (confidence scores visible)
   -> 4 auto-linked (HIGH band)
   -> 1 pending review (REVIEW band)
   -> 1 unmatched (LOW)

2. Planner opens ReconciliationPage
   -> sees 4 auto-linked rows (HIGH badges)
   -> sees 1 pending review row (REVIEW badge)
   -> opens review panel -> sees top candidates + scores
   -> confirms the match -> status -> confirmed -> audit entry logged

3. Planner opens UnmatchedPage
   -> sees the 1 unmatched activity
   -> searches baseline -> manually links -> resolution = manually_linked

4. AuditPage shows the complete sequence:
   extracted -> auto_linked (x4) -> flagged -> confirmed -> manually_linked

5. Dashboard shows live updates as each step happens
```

### 18.4 Data design constraints

- All dates in synthetic data must be in the past
- Use realistic EPC construction terminology
- Include one entry with unknown discipline (tests fallback path)
- Include one report with informal/garbled language (tests LLM quality)
- Include one ambiguous case to trigger DisambiguationPanel

---

## 19. Deployment Plan

### 19.1 Local development

```
frontend/   -> npm run dev         -> http://localhost:5173
backend/    -> uvicorn main:app    -> http://localhost:8000
Supabase    -> cloud project       -> https://[project].supabase.co
LLM API     -> OpenRouter API      -> https://openrouter.ai/api
```

Frontend `.env`: `VITE_API_BASE_URL=http://localhost:8000`

### 19.2 Public hackathon deployment

```
GitHub
  |-- frontend/ -> Vercel -> https://on-ground.vercel.app
  |-- backend/  -> Cloud-hosted FastAPI (provider TBD — UD2)
                      |
                  Supabase Cloud
                      |
                  OpenRouter API
```

**Frontend on Vercel:**
- Root directory: `frontend/`
- Build command: `npm run build`
- Output: `dist/`
- Env vars in Vercel dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL` (pointing to cloud FastAPI)

**Backend on cloud host:**
- Python runtime
- Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Env vars in hosting provider dashboard
- CORS configured to allow Vercel frontend URL

### 19.3 Deployment sequence (Phase 6)

1. Verify local everything works end-to-end
2. Decide cloud hosting provider (UD2) — evaluate the options assessed in Phase 1 and select one. Document as the next available decision number in DECISION_LOG.md before proceeding.
3. Create GitHub repository, push all code
4. Create Vercel project, connect to GitHub, set root to `frontend/`, set env vars
5. Deploy backend to the selected cloud host (UD2, now decided) with production env vars
6. Update `VITE_API_BASE_URL` in Vercel to cloud backend URL
7. Update CORS in backend to allow Vercel URL
8. End-to-end test through public URLs
9. Seed production Supabase with demo data
10. Verify local fallback still works

---

## 20. Environment Variables

### 20.1 Frontend (Vite — `frontend/.env`)

| Variable | Local value | Classification | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `https://[project].supabase.co` | Public | Same value in local and production |
| `VITE_SUPABASE_ANON_KEY` | `[anon key]` | Public | RLS is the security boundary |
| `VITE_API_BASE_URL` | `http://localhost:8000` (local) / `https://[cloud].app` (prod) | Public | Changes between environments |

### 20.2 Backend (`backend/.env`)

| Variable | Classification | Notes |
|---|---|---|
| `SUPABASE_URL` | Public | Same as frontend |
| `SUPABASE_SERVICE_KEY` | **SECRET** | Bypasses RLS — backend only. Never in frontend. |
| `LLM_PROVIDER` | Non-secret | `openrouter` for MVP |
| `LLM_MODEL` | Non-secret | Exact model TBD at Phase 2 (UD1) |
| `OPENROUTER_API_KEY` | **SECRET** | Backend only. Never in frontend bundle. |

---

## 21. Implementation Phases

### Phase 1 — Foundation / Scaffolding

**Objective:** Working skeleton. Both ends start. Supabase connected. LLM provider abstraction/interface exists. No AI pipeline yet.

**Prerequisites:** None. All planning docs complete.

**Exact tasks:**

1. Initialize Git repository. Create `.gitignore`.
2. Create GitHub repository. Push initial commit.
3. Create Supabase project. Record credentials.
4. Run `schema.sql` in Supabase SQL editor (all 6 tables + 2 additions + RLS + indexes).
5. Enable Realtime on 5 tables.
6. Create Storage bucket `reports` (private).
7. Create demo user accounts. Create profile rows.
8. `backend/main.py` — FastAPI app, CORS, health endpoint, router stubs.
9. `backend/requirements.txt` — all Python deps.
10. `backend/db/supabase_client.py` — Supabase client instance.
11. `backend/llm/provider.py` — abstract `LLMProvider` class (interface only).
12. `backend/models/schemas.py` — all Pydantic models.
13. Empty route files with stub handlers.
14. `backend/.env.example`.
15. Frontend React foundation: convert Vite scaffold to React: add React, React Router, Supabase JS.
16. `frontend/src/lib/supabaseClient.ts` — Supabase JS client.
17. `frontend/src/lib/apiClient.ts` — fetch wrapper for FastAPI.
18. `frontend/src/lib/types.ts` — TypeScript types matching DB schema.
19. Basic React Router setup with all routes defined (pages as stubs).
20. `<AppShell>`, `<Sidebar>`, `<TopBar>` layout components.
21. `useAuth` hook — Supabase auth state, role detection.
22. LoginPage with `signInWithPassword` + demo switcher (basic auth verification).
23. Wire frontend `.env` — verify frontend can query Supabase directly.
24. Wire backend `.env` — verify backend can reach Supabase with service key.
25. Root-level `.gitignore`, `.env.example`, `README.md`.
26. Connectivity checks: verify `GET /health` and Supabase connectivity from both frontend and backend.

**Definition of done:**
- `GET /health` → `{"status": "ok"}`
- Login page authenticates real Supabase user
- Authenticated user can query Supabase tables from frontend
- Git has initial commit pushed to GitHub

---

### Phase 2 — Core Backend / AI Pipeline

**Objective:** Full upload → extract → match pipeline working. Data lands in Supabase.

**Prerequisites:** Phase 1 complete. Supabase tables exist. **UD1 (LLM model) resolved before this phase starts.**

**Exact tasks:**

1. `backend/llm/openrouter.py`: `OpenRouterProvider` full implementation — resolve UD1 (select exact OpenRouter free-tier model, document in `DECISION_LOG.md` under next available decision number), structured prompt, response parsing, timeout, retry.
2. `services/extraction_service.py`: full extraction pipeline and file parsing (PDF/TXT/CSV/XLSX).
3. `routes/upload.py`: `POST /upload` — file validation, Storage upload, EXTRACTIONS insert.
4. `routes/extract.py`: `POST /extract/{extraction_id}`.
5. `services/matching_service.py`: full matching pipeline — load sentence-transformers at startup, discipline filter, date filter, embeddings, cosine similarity, contextual scoring, banding, DB writes.
6. `routes/match.py`: `POST /match/{extracted_activity_id}`.
7. `services/audit_service.py`: `log_action()`.
8. `routes/review.py`: `POST /match/{id}/confirm` and `/reject` — role check, DB update, audit.
9. Auth middleware: `get_current_user` dependency (authorization enforcement).
10. Write all backend unit tests.
11. Manual end-to-end test: upload .txt → extract → activities in DB → match → SCHEDULE_MATCHES row.
12. Verify: confirm as planner → confirmed. Confirm as supervisor → 403.

**Definition of done:**
- Full API pipeline works end-to-end via manual testing
- All unit tests pass
- Correct confidence scores in EXTRACTED_ACTIVITIES
- Correct banding in SCHEDULE_MATCHES
- Planner role enforcement works

---

### Phase 3 — Core Frontend

**Objective:** All screens built. Upload triggers API. Reconciliation table shows real data.

**Prerequisites:** Phase 2 complete. **UD3 (CSS/styling approach) resolved before this phase starts.**

**Exact tasks:**

1. Resolve UD3 (CSS/styling approach) and configure design tokens / base styles.
2. All UI primitives: `<ConfidenceBadge>`, `<StatusBadge>`, `<KPICard>`, `<DataTable>`, `<EmptyState>`, `<ErrorState>`, `<LoadingSkeleton>`, `<Toast>`.
3. `DashboardPage` — ProgressSummary, DisciplineBreakdown, RecentUploads.
4. `UploadPage` — UploadDropzone, UploadStatusCard. Wire to FastAPI endpoints.
5. `ReconciliationPage` — ReconciliationTable with all columns, discipline filter, status filter, row expansion, CandidateList, DisambiguationPanel.
6. `ReviewPage` — ReviewPanel, ActivityDetailCard, CandidateList, ConfirmRejectBar, AuditTimeline.
7. `UnmatchedPage` — DataTable, manual link search panel.
8. `AuditPage` — AuditTimeline + filters.
9. `SchedulePage` — DataTable, upload dropzone (planner only).
10. All data hooks with `{data, error, loading}` pattern.
11. All empty states, loading skeletons, error states for every screen.
12. Role-aware UI (planner vs supervisor button visibility).
13. Demo role switcher functional.

**Definition of done:**
- All screens render without errors
- All three states (loading, empty, error) implemented everywhere
- Upload flow completes end-to-end in the browser
- Confirm/reject works, audit trail updates

---

### Phase 4 — Integration / Realtime / Roles

**Objective:** Realtime live. Role enforcement verified. No polling anywhere.

**Prerequisites:** Phases 2 + 3 complete.

**Exact tasks:**

1. Add Realtime subscriptions to all 5 hooks.
2. Stale data recovery on Realtime reconnect.
3. Verify: extraction status badge updates live without refresh.
4. Verify: matching completes → ReconciliationPage updates live.
5. Verify: confirm → row status updates live.
6. RLS verification tests — supervisor cannot confirm/reject.
7. Demo role switcher end-to-end test.
8. CORS verification.

**Definition of done:**
- Realtime works on all 5 subscribed tables
- RLS tests pass
- Role switcher works end-to-end
- No polling in codebase

---

### Phase 5 — Test Data / Evaluation / Calibration

**Objective:** Synthetic data created, AI pipeline evaluated, zero false-positive auto-links in demo set.

**Prerequisites:** Phase 4 complete.

**Exact tasks:**

1. Create `data/baseline_schedule.csv` — 20-30 activities, 6 disciplines.
2. Create synthetic report files.
3. Create `data/README.md`.
4. Run seed script → SCHEDULE_PLAN populated.
5. Run extraction evaluation → target: >= 85% recall.
6. Run matching evaluation → target: >= 80% top-1 accuracy.
7. Verify zero false-positive auto-links in demo dataset.
8. Calibrate thresholds if needed. Re-run evaluation.
9. Run all unit tests (clean run).
10. Manual end-to-end demo flow walkthrough.

**Definition of done:**
- Extraction recall >= 85%
- Matching top-1 accuracy >= 80%
- Zero false-positive auto-links in demo dataset
- All unit tests pass

---

### Phase 6 — Polish / Deployment / Demo Prep

**Objective:** Public URL live, quality checklist passed, demo ready.

**Prerequisites:** Phase 5 complete. **UD2 (hosting provider) resolved before this phase starts.**

**Exact tasks:**

1. Visual QA pass + accessibility spot-check.
2. Performance check: ReconciliationTable with 50+ rows < 2 seconds.
3. Deploy FastAPI backend to cloud host (UD2 provider). Set production env vars.
4. Create Vercel project. Connect GitHub. Set env vars. Deploy frontend.
5. Update CORS to include Vercel URL.
6. End-to-end test through public URLs.
7. Seed production Supabase with demo data.
8. Verify local development still works.
9. Write demo script (timed).
10. Record backup demo video.
11. Run `QUALITY_CHECKLIST.md` — all items.
12. Update `PHASE.md` to Phase 6 complete.
13. Final git commit + tag.

**Definition of done:**
- `QUALITY_CHECKLIST.md` all items checked
- Public URL is live and demo works end-to-end
- Local development still works
- Backup recording exists
- Demo script written and timed

---

## 22. Task Dependency Graph

```
[Git + GitHub repo]
      |
      v
[Supabase project + schema + RLS + Storage + Auth]
      |
      +----------------------------+
      v                            v
[Backend skeleton]          [Frontend skeleton]
(main.py, schemas,          (React, Supabase client,
 LLM interface, stubs)       routes, layout, auth)
      |
      v
[LLM provider implementation]  <-- requires UD1 resolved
      |
      v
[Upload endpoint]
      |
      v
[Extraction service]
      |
      v
[Matching service]  -----> [Audit service]
      |
      +-----------------------------+
      v                             v
[Confirm/Reject endpoints]   [All match data in DB]

[Frontend skeleton] ---------> [UI Components]
                                      |
                         +------------+------------+
                         v                         v
                   [Dashboard]             [Upload Page]
                         |                         |
                         +------------+-----------+
                                      v
                           [Reconciliation Page]
                                      |
                         +------------+------------+
                         v                         v
                   [Review Page]           [Unmatched Page]
                                      |
                                [Audit Page]
                                [Schedule Page]

[Matching + UI] ---------> [Realtime integration]
                                      |
                                      v
                            [RLS verification]
                                      |
                                      v
                              [Synthetic data]
                                      |
                                      v
                      [Evaluation + calibration]
                                      |
                                      v
                                [Deployment]  <-- requires UD2 resolved
                                      |
                                      v
                                [Demo prep]
```

### Parallelizable work

Once Supabase schema and both skeletons exist:

| Frontend work | Backend work | Parallel? |
|---|---|---|
| UI component development | Extraction service | Yes |
| All Supabase-direct reads | Matching service | Yes |
| Design system implementation | LLM provider implementation | Yes |

---

## 23. 36-Hour Hackathon Execution Plan

### Must-have (demo fails without these)

The core upload → extract → match → review (confirm/reject) → audit flow must work end-to-end.

### Should-have (demo is weaker without these)

- Dashboard with KPI counts
- Role switcher (planner vs supervisor)
- Disambiguation UI (side-by-side candidates)
- Unmatched activities page
- Realtime live updates

### Nice-to-have (cut if time is short)

- Schedule page (can seed via script instead of UI upload)
- CSV export from audit trail
- Audit page (show it exists, don't demo it explicitly)
- Gantt chart (deferred — not planned for MVP core)

### Cut-first if time is critically short

- Gantt chart (eliminated)
- CSV export
- Mobile responsiveness polish

### Demo-critical 36-hour timeline

```
Hours 0-6:   Phase 1 — Supabase schema, backend skeleton, frontend skeleton, auth works
Hours 6-14:  Phase 2 — Upload, extraction, matching, confirm/reject
Hours 14-20: Phase 3 — Upload page, reconciliation table, review panel, basic design
Hours 20-24: Phase 4 — Realtime, role switcher, end-to-end integration
Hours 24-28: Phase 5 — Synthetic data, seed, AI evaluation, calibrate thresholds
Hours 28-32: Phase 6A — Visual polish, accessibility
Hours 32-35: Phase 6B — Deployment (Vercel + cloud backend), public URL test
Hours 35-36: Demo script final run, backup recording
```

### Recovery protocol if LLM fails during demo

Pre-seed the database with already-extracted and already-matched activities from Phase 5. Demo the review and audit flow with pre-existing data. Explain honestly: "We've pre-loaded some data so we can focus demo time on the review workflow — the AI extraction ran during our preparation phase."

---

## 24. Risk Register

| # | Risk | Probability | Impact | Mitigation | Fallback |
|---|---|---|---|---|---|
| R1 | Free OpenRouter model unavailable / rate-limited | Medium | Critical | Test multiple free models before demo. Cache LLM results. | Pre-seed DB with extracted activities from Phase 5 run. |
| R2 | LLM extraction quality below target | Medium | High | Test against synthetic data early in Phase 5. Tune prompt. Try different models. | Demonstrate pipeline; lower accuracy expectation in demo. |
| R3 | Matching accuracy below 80% | Medium | High | Calibrate thresholds in Phase 5. | Adjust demo dataset to easy/clear matches. |
| R4 | False-positive auto-links in demo dataset | Low | Very High | Phase 5 calibration targets zero false positives. Raise threshold if needed. | Move all demo to pending_review band (eliminate auto-link for demo). |
| R5 | Supabase setup takes longer than expected | Low | Medium | Document setup step-by-step. Create project early in Phase 1. | Use Supabase local CLI as fallback. |
| R6 | sentence-transformers download slow/fails | Low | Medium | Download in Phase 1. Cache locally. | Pre-download model; include in repo as fallback. |
| R7 | Cloud hosting provider for FastAPI unavailable | Medium | High | Evaluate providers in Phase 1. Prepare config early. | Demo from localhost during Phases 4-5. Deploy in Phase 6. |
| R8 | Vercel frontend deployment fails | Low | Medium | Test build locally first (`npm run build`). | Serve Vite build locally during demo. |
| R9 | RLS misconfiguration | Low | Very High | Explicit RLS test in Phase 4. Supervisor JWT must fail on direct Supabase call. | Manually verify policies before demo. |
| R10 | Realtime unreliable on demo network | Medium | Medium | Demo works without Realtime — page refresh still shows current data. | Add "Refresh" button as fallback. |
| R11 | PDF extraction fails on complex PDFs | Medium | Medium | Test on sample PDFs in Phase 5. | Provide TXT versions of all demo reports as backup. |
| R12 | sentence-transformers CPU too slow | Low | Medium | Measure in Phase 5. Pre-compute SCHEDULE_PLAN embeddings at startup. | |
| R13 | React build issues (TypeScript errors) | Low | Medium | TypeScript configured strictly. Type errors surface during development. | Relax strict mode temporarily if blocking demo. |

---

## 25. Unresolved Decisions

**Decision numbering convention:** D1–D13 are locked decisions already recorded in `DECISION_LOG.md`. The three items below are currently unresolved decisions: UD1 (Exact OpenRouter free-tier model), UD2 (Backend cloud hosting provider), and UD3 (CSS/styling approach). Decision numbers are NOT assigned merely to fill gaps or pre-reserved. For now, they are represented solely as unresolved decisions (UD1, UD2, UD3). When each decision is actually made during implementation, it will receive the next available decision number and be added to `DECISION_LOG.md`.

---

### UD1 — Exact free OpenRouter model

**Why it matters:** Model determines extraction quality — context window, JSON instruction-following, availability, response time.

**When it must be decided:** Start of Phase 2 (before `openrouter.py` implements the actual model string).

**What blocks it:** Need to check current free model availability on OpenRouter at implementation time. Free models change frequently.

**How to decide:** At Phase 2 start, test 2–3 available free models on OpenRouter with a sample construction report. Pick the best-performing one (reliable JSON output, < 30s response, sufficient context window for ~8000 chars). Write the decision to `DECISION_LOG.md` under the next available decision number before any code references the model name.

---

### UD2 — Cloud FastAPI hosting provider

**Why it matters:** Backend must be publicly accessible for the hackathon demo (D12 is locked). The hosting provider must support Python, FastAPI, and be able to load the sentence-transformers model (~80MB).

**When it must be decided:** Start of Phase 6 (deployment phase). This decision must remain open until Phase 6 unless a provider is explicitly selected and documented earlier.

**What to evaluate before deciding (without committing):** Verify that viable providers exist — check Render, Railway, Fly.io for: free tier availability, Python runtime support, ability to load ~80MB model, deployment complexity. Do not commit prematurely.

**How to decide:** At the start of Phase 6, select the best-fit provider. Write the decision to `DECISION_LOG.md` under the next available decision number before deployment begins.

---

### UD3 — CSS / styling approach

**Why it matters:** The entire frontend design system (Section 5) depends on this. All components in Phase 3 are built against it. Cannot be changed mid-build without significant rework.

**When it must be decided:** Before Phase 3 begins.

**Options:** Tailwind CSS v3 / Vanilla CSS with CSS custom properties / CSS Modules.

**Planning recommendation:** Tailwind CSS v3 — fastest for a 36-hour build for a data-dense professional dashboard.

**How to decide:** Developer makes the call based on team familiarity and time constraints. Write the decision to `DECISION_LOG.md` under the next available decision number before starting Phase 3 work (i.e., before writing `index.css` or any component styling).

---

## 26. File-by-File Implementation Map

| File / Folder | Phase | Purpose | Dependencies |
|---|---|---|---|
| `.gitignore` (root) | 1 | Exclude .env, node_modules, __pycache__, .venv | None |
| `README.md` | 1 | Project overview and setup | None |
| `.env.example` (root) | 1 | Summary pointer to sub-env-examples | None |
| `docs/IMPLEMENTATION_PLAN.md` | 0 | This file — implementation blueprint | All docs |
| **Backend** | | | |
| `backend/requirements.txt` | 1 | fastapi, uvicorn, supabase-py, pydantic, pdfplumber, pandas, openpyxl, sentence-transformers, scikit-learn, httpx, python-dotenv, python-multipart, pytest, dateparser | None |
| `backend/.env.example` | 1 | Backend env template | None |
| `backend/main.py` | 1 | FastAPI app, CORS, router registration, sentence-transformers model load at startup | All routes |
| `backend/db/supabase_client.py` | 1 | Single Supabase client using service key | requirements.txt |
| `backend/db/schema.sql` | 1 | All CREATE TABLE, RLS, indexes (including 2 schema additions) | None |
| `backend/llm/provider.py` | 1 | Abstract `LLMProvider` base class | None |
| `backend/llm/openrouter.py` | 2 | OpenRouter concrete implementation | provider.py, UD1 resolved |
| `backend/models/schemas.py` | 1 | All Pydantic models: UploadRequest, ExtractionResult, ExtractedActivityRaw, ExtractedActivityCreate, MatchResult, ConfirmResponse, RejectRequest, ErrorResponse, CurrentUser | None |
| `backend/routes/upload.py` | 2 | `POST /upload` handler | schemas.py, supabase_client.py |
| `backend/routes/extract.py` | 2 | `POST /extract/{id}` handler | extraction_service.py |
| `backend/routes/match.py` | 2 | `POST /match/{id}` handler | matching_service.py |
| `backend/routes/review.py` | 2 | `POST /match/{id}/confirm`, `/reject` | audit_service.py, auth middleware |
| `backend/services/extraction_service.py` | 2 | Full extraction pipeline | llm/openrouter.py, schemas.py, supabase_client.py, pdfplumber, pandas |
| `backend/services/matching_service.py` | 2 | Full matching pipeline | schemas.py, supabase_client.py, sentence-transformers |
| `backend/services/audit_service.py` | 2 | `log_action()` | supabase_client.py |
| `backend/tests/test_schemas.py` | 2 | Pydantic schema validation tests | schemas.py, pytest |
| `backend/tests/test_llm_provider.py` | 2 | LLM provider abstraction + mock | llm/provider.py, pytest |
| `backend/tests/test_extraction_service.py` | 2 | Extraction pipeline with mock | extraction_service.py, pytest |
| `backend/tests/test_matching_service.py` | 2 | Matching logic, banding, scoring | matching_service.py, pytest |
| **Frontend** | | | |
| `frontend/package.json` | 1 | Add React, React Router, Supabase JS, (Tailwind if chosen) | None |
| `frontend/vite.config.ts` | 1 | Vite config with React plugin | None |
| `frontend/.env.example` | 1 | Frontend env template | None |
| `frontend/index.html` | 1 | Updated title "OnGround — IPIS" | None |
| `frontend/src/main.tsx` | 1 | React app entry point | App.tsx |
| `frontend/src/App.tsx` | 1 | React Router routes, auth guard, AppShell | All pages |
| `frontend/src/index.css` | 3 | Design system (tokens, base styles) | UD3 resolved |
| `frontend/src/lib/supabaseClient.ts` | 1 | Supabase JS singleton | .env vars |
| `frontend/src/lib/apiClient.ts` | 1 | Typed fetch wrapper for FastAPI | VITE_API_BASE_URL |
| `frontend/src/lib/types.ts` | 1 | TypeScript types for all 6 DB tables + API responses | None |
| `frontend/src/hooks/useAuth.ts` | 1 | Auth state, role, signIn, signOut | supabaseClient.ts |
| `frontend/src/hooks/useExtractions.ts` | 3+4 | EXTRACTIONS data + Realtime | supabaseClient.ts |
| `frontend/src/hooks/useMatches.ts` | 3+4 | SCHEDULE_MATCHES + UNMATCHED + Realtime | supabaseClient.ts |
| `frontend/src/hooks/useSchedulePlan.ts` | 3 | SCHEDULE_PLAN data | supabaseClient.ts |
| `frontend/src/hooks/useAuditTrail.ts` | 3+4 | AUDIT_TRAIL data + Realtime | supabaseClient.ts |
| `frontend/src/components/layout/AppShell.tsx` | 1 | Page layout wrapper | Sidebar, TopBar |
| `frontend/src/components/layout/Sidebar.tsx` | 1 | Navigation | useAuth |
| `frontend/src/components/layout/TopBar.tsx` | 1 | Header, role switcher, sign out | useAuth |
| `frontend/src/components/ui/ConfidenceBadge.tsx` | 3 | Multi-signal confidence visualization | types.ts |
| `frontend/src/components/ui/StatusBadge.tsx` | 3 | Multi-signal status visualization | types.ts |
| `frontend/src/components/ui/KPICard.tsx` | 3 | KPI metric card | None |
| `frontend/src/components/ui/DataTable.tsx` | 3 | Reusable table | None |
| `frontend/src/components/ui/EmptyState.tsx` | 3 | Empty state pattern | None |
| `frontend/src/components/ui/ErrorState.tsx` | 3 | Error state pattern | None |
| `frontend/src/components/ui/LoadingSkeleton.tsx` | 3 | Loading skeleton | None |
| `frontend/src/components/ui/Toast.tsx` | 3 | Toast notifications | None |
| `frontend/src/components/upload/UploadDropzone.tsx` | 3 | File drag-drop | apiClient.ts |
| `frontend/src/components/upload/UploadStatusCard.tsx` | 3 | Extraction status | useExtractions |
| `frontend/src/components/reconciliation/ReconciliationTable.tsx` | 3 | Main reconciliation table | useMatches, ConfidenceBadge, StatusBadge |
| `frontend/src/components/reconciliation/MatchRow.tsx` | 3 | Single reconciliation row | ReconciliationTable |
| `frontend/src/components/reconciliation/CandidateList.tsx` | 3 | Top-N candidates with scores | ReviewPage, ReconciliationTable |
| `frontend/src/components/reconciliation/DisambiguationPanel.tsx` | 3 | Side-by-side disambiguation | CandidateList |
| `frontend/src/components/review/ReviewPanel.tsx` | 3 | Full match review | CandidateList, ConfirmRejectBar |
| `frontend/src/components/review/ConfirmRejectBar.tsx` | 3 | Action bar | apiClient.ts |
| `frontend/src/components/review/ActivityDetailCard.tsx` | 3 | Extracted activity detail | None |
| `frontend/src/components/audit/AuditTimeline.tsx` | 3 | Audit timeline | useAuditTrail |
| `frontend/src/components/dashboard/ProgressSummary.tsx` | 3 | KPI cards | useMatches, useExtractions |
| `frontend/src/components/dashboard/DisciplineBreakdown.tsx` | 3 | Per-discipline stats | useMatches |
| `frontend/src/components/dashboard/RecentUploads.tsx` | 3 | Recent uploads list | useExtractions |
| `frontend/src/pages/LoginPage.tsx` | 1 | Login + demo switcher | useAuth |
| `frontend/src/pages/DashboardPage.tsx` | 3 | Dashboard | Dashboard components |
| `frontend/src/pages/UploadPage.tsx` | 3 | Upload + extraction trigger | Upload components |
| `frontend/src/pages/ReconciliationPage.tsx` | 3 | Reconciliation table + filters | ReconciliationTable |
| `frontend/src/pages/ReviewPage.tsx` | 3 | Single match deep review | ReviewPanel |
| `frontend/src/pages/UnmatchedPage.tsx` | 3 | Unmatched activities | DataTable, useMatches |
| `frontend/src/pages/AuditPage.tsx` | 3 | Full audit trail | AuditTimeline |
| `frontend/src/pages/SchedulePage.tsx` | 3 | Baseline schedule view/upload | DataTable, useSchedulePlan |
| **Data** | | | |
| `data/baseline_schedule.csv` | 5 | 20-30 synthetic baseline activities | None |
| `data/sample_report_piping.txt` | 5 | Synthetic piping daily report | None |
| `data/sample_report_electrical.txt` | 5 | Synthetic electrical daily report | None |
| `data/sample_report_mixed.csv` | 5 | Synthetic multi-discipline spreadsheet | None |
| `data/README.md` | 5 | Data format and demo sequence | None |

---

## 27. Final Implementation Order

```
1.  Git repository init + .gitignore + README.md + root .env.example
2.  GitHub repository creation + initial push
3.  Supabase project creation + record credentials
4.  schema.sql — all 6 tables + 2 additions (extraction_confidence, candidates) + RLS + indexes
5.  Enable Realtime on 5 tables in Supabase dashboard
6.  Create Storage bucket 'reports' (private)
7.  Create demo user accounts (planner + supervisor) + profile rows
8.  Backend skeleton: main.py, requirements.txt, supabase_client.py, LLMProvider abstraction/interface, all Pydantic schemas, empty route stubs
9.  Backend .env.example + local .env (no secrets committed)
10. Frontend React foundation: convert Vite scaffold to React + React Router + Supabase JS
11. Frontend structure: lib/types.ts, lib/apiClient.ts, all hooks (stubs), AppShell + Sidebar + TopBar
12. LoginPage + useAuth — verify basic Supabase auth works
13. Connectivity checks: Verify GET /health and Supabase connectivity from both frontend and backend (Phase 1 complete)
14. OpenRouter provider implementation: resolve UD1 (select exact OpenRouter free-tier model, document in DECISION_LOG.md under next available decision number) and implement backend/llm/openrouter.py (concrete LLMProvider)
15. services/extraction_service.py — full extraction pipeline and file parsing (PDF/TXT/CSV/XLSX)
16. routes/upload.py — POST /upload endpoint (file validation, Storage upload, EXTRACTIONS insert)
17. routes/extract.py — POST /extract/{id} endpoint (wires extraction service)
18. services/matching_service.py — sentence-transformers loaded at startup, full matching pipeline
19. routes/match.py — POST /match/{id} endpoint
20. services/audit_service.py — log_action()
21. routes/review.py — POST /match/{id}/confirm and /reject endpoints + authorization enforcement (planner vs supervisor) + auth middleware
22. Write and run all backend unit tests (Phase 2 complete)
23. Resolve UD3 (CSS/styling approach: Tailwind CSS v3 / Vanilla CSS / CSS Modules, document in DECISION_LOG.md under next available decision number) and configure design tokens / base styles
24. All UI primitive components: ConfidenceBadge, StatusBadge, KPICard, DataTable, EmptyState, ErrorState, LoadingSkeleton, Toast
25. DashboardPage + all dashboard components + useExtractions + useMatches hooks
26. UploadPage + UploadDropzone + UploadStatusCard (wire to FastAPI endpoints)
27. ReconciliationPage + ReconciliationTable + MatchRow + CandidateList + DisambiguationPanel
28. ReviewPage + ReviewPanel + ActivityDetailCard + ConfirmRejectBar + AuditTimeline
29. UnmatchedPage + manual link panel
30. AuditPage + AuditTimeline full
31. SchedulePage + baseline upload (planner only)
32. All Supabase-direct read hooks finalized (Phase 3 complete)
33. Add Realtime subscriptions to all 5 data hooks
34. Stale data re-fetch on Realtime reconnect
35. RLS verification tests — supervisor cannot confirm/reject via direct API or Supabase
36. Demo role switcher end-to-end test
37. Full integration test: upload → live status update → ReconciliationPage live update → confirm → audit live (Phase 4 complete)
38. Create data/baseline_schedule.csv (20-30 activities, 6 disciplines)
39. Create data/sample_report_piping.txt, sample_report_electrical.txt, sample_report_mixed.csv
40. Create data/README.md
41. Run seed script — populate SCHEDULE_PLAN in Supabase
42. Run extraction evaluation — measure recall, fix prompt if needed, target >= 85%
43. Run matching evaluation — measure top-1 accuracy, target >= 80%
44. Calibrate confidence thresholds — zero false-positive auto-links in demo set
45. Re-run evaluation after calibration
46. Manual end-to-end demo flow walkthrough (Phase 5 complete)
47. Visual QA pass + accessibility spot-check
48. Performance check: ReconciliationTable with 50+ rows < 2 seconds
49. Decide cloud hosting provider (UD2) — evaluate options, select provider, and document as the next available decision number in DECISION_LOG.md
50. Deploy FastAPI backend to the selected cloud host with production env vars set
51. Deploy frontend to Vercel with production env vars
52. Update CORS in backend to include Vercel URL
53. End-to-end test through public URLs
54. Seed production Supabase with demo baseline schedule + demo user accounts
55. Verify local development still works after all production env changes
56. Write demo script (timed, specific sequence)
57. Record backup demo video (full clean run)
58. Run QUALITY_CHECKLIST.md — all items checked
59. Update PHASE.md to reflect Phase 6 complete
60. Final git commit + tag (OnGround ready for demo)
```

---

## Appendix: Contradictions Found in Existing Documentation

The following inconsistencies were found during documentation review. All have been resolved in this plan per the documented conflict resolution priority (`FINAL_MASTER_PLAN.md` > `DECISION_LOG.md` > engineering docs > product docs).

| # | Contradiction | Documents in conflict | Resolution in this plan |
|---|---|---|---|
| C1 | `PRODUCT_FEATURES.md` Feature 5 MVP says "React + Tailwind CSS". `TECH_STACK.md` and `FINAL_MASTER_PLAN.md` say "React" only — no Tailwind. | PRODUCT_FEATURES.md vs TECH_STACK.md / FINAL_MASTER_PLAN.md | Treated as Unresolved Decision 3 (UD3). Developer must decide before Phase 3 begins. Planning recommendation: Tailwind CSS v3. When decided, document as the next available decision number in DECISION_LOG.md. |
| C2 | `PRODUCT_FEATURES.md` Feature 5 references Recharts for Gantt chart as an MVP component. No Gantt chart task appears in `TASKS.md` or `PHASE.md`. | PRODUCT_FEATURES.md vs TASKS.md / PHASE.md | Gantt chart deferred. Dashboard uses tabular/card data. `TASKS.md` and `PHASE.md` take precedence as execution documents. |
| C3 | `PRODUCT_FEATURES.md` Feature 1 lists "deduplication (same file uploaded twice rejected)" as an acceptance criterion. No deduplication logic described in `DATABASE.md`, `ARCHITECTURE.md`, or `API.md`. | PRODUCT_FEATURES.md vs engineering docs | Not planned for MVP. File hash deduplication is a nice-to-have not in any engineering doc. The upload endpoint validates that the extraction_id is fresh, but file-level deduplication is not in Phase 1-6 scope. |
| C4 | `DATABASE.md` `EXTRACTED_ACTIVITIES` table schema does not include an `extraction_confidence` column. The AI pipeline (`FINAL_MASTER_PLAN.md`, `PRODUCT_FEATURES.md`) calculates and requires storing a deterministic confidence score per activity. | DATABASE.md (schema) vs FINAL_MASTER_PLAN.md (pipeline) | **REQUIRED SCHEMA ADDITION.** `extraction_confidence float NOT NULL` column must be added to `EXTRACTED_ACTIVITIES`. `docs/DATABASE.md` must be updated to include this column before implementation begins. `backend/db/schema.sql` must match the updated DATABASE.md. |
| C5 | `DATABASE.md` `SCHEDULE_MATCHES` stores a single `plan_activity_id` (one matched plan node). The disambiguation and review UI requires storing top-N candidates with their individual scores, descriptions, and activity codes. | DATABASE.md (schema) vs QUALITY_CHECKLIST.md / this plan's disambiguation requirement | **REQUIRED SCHEMA ADDITION.** `candidates jsonb nullable` column must be added to `SCHEDULE_MATCHES`. Full field spec: array of up to 3 objects each containing `plan_activity_id` (uuid), `activity_code` (text), `activity_description` (text), `score` (float). `docs/DATABASE.md` must be updated to include this column before implementation begins. `backend/db/schema.sql` must match the updated DATABASE.md. |
| C6 | `PRODUCT_FEATURES.md` Feature 2 shows an output JSON with a `confidence` field in the LLM output. `FINAL_MASTER_PLAN.md` and `PRODUCT_FEATURES.md` also state the confidence is calculated deterministically server-side. The two are in direct contradiction — the LLM should not generate the confidence field. | PRODUCT_FEATURES.md (output example) vs FINAL_MASTER_PLAN.md | `FINAL_MASTER_PLAN.md` is the authority. LLM does NOT generate the confidence field. Extraction prompt explicitly instructs "Do not add a confidence field." Any confidence field in LLM response is stripped during Pydantic validation. Deterministic calculation is the only source. |

---

*End of OnGround Implementation Plan — Version 1.0*
*Awaiting approval to begin Phase 1 execution.*
*No code was created, modified, installed, or deployed in producing this document.*
