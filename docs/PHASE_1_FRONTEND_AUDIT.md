# ONGROUND — PHASE 1 FRONTEND AUDIT
**Generated:** 2026-09-17  
**Status:** Complete Discovery Audit  
**Author:** Lead Frontend Engineer & Implementation Agent  

---

## Executive Summary
This document provides a thorough audit of the existing OnGround frontend codebase before initiating Phase 1 execution. It assesses existing architecture, routing, components, mock data, styling, and dependencies against the approved **OnGround Phase 1 Frontend Blueprint**.

The existing codebase was developed as an MVP for the Smart India Hackathon (SIH 26122 - Infrastructure Progress Intelligence System). It possesses a solid foundation of domain-specific components (reconciliation table, disambiguation panel, audit timeline, schedule view) and a dark-theme CSS design token system. However, it currently lacks the public marketing website, multi-step authentication flows, multi-project portfolio management, unified project workspace shell with parameterized `/projects/:id/*` routing, activities explorer, processing pipeline visualization, team management, analytics, and project settings.

---

## A. Existing Architecture

```
frontend/
├── package.json               # React 18.3.1, Vite 5.4.3, TypeScript 5.5.4, React Router 6.26.2
├── vite.config.ts             # Standard Vite + React plugin
├── tsconfig.json              # TypeScript strict configuration
├── index.html                 # App root HTML with Inter & JetBrains Mono fonts
├── src/
│   ├── main.tsx               # ReactDOM entry point
│   ├── App.tsx                # BrowserRouter with flat route table & AuthProvider
│   ├── index.css              # Custom CSS tokens (Enterprise Infrastructure Dark Mode)
│   ├── assets/                # hero.png, vite.svg, typescript.svg
│   ├── components/            # Subdivided into audit, common, dashboard, layout,
│   │                          # reconciliation, review, upload
│   ├── hooks/                 # AuthProvider, useAuth, useMatches, useSchedulePlan,
│   │                          # useExtractions, useUnmatched, useAuditTrail
│   ├── lib/
│   │   ├── types.ts           # Core TypeScript data models matching Supabase schema
│   │   ├── apiClient.ts       # Typed fetch wrapper with demo role header injection
│   │   └── supabaseClient.ts  # Supabase client initialized via env vars
│   └── pages/                 # Flat route page components (Dashboard, Upload,
│                              # Reconciliation, Review, Unmatched, Audit, Schedule, Login)
```

### Architectural Characteristics:
1. **Framework & Bundler:** React 18.3.1 with Vite 5.4.3 and TypeScript 5.5.4. Clean and fast compilation (`tsc && vite build` completes in <10s).
2. **State Management & Data Layer:** Custom React hooks (`useMatches`, `useSchedulePlan`, `useExtractions`, etc.) connecting to Supabase via `@supabase/supabase-js` with Supabase Realtime subscriptions, plus fallback in-memory mock datasets in each hook if Supabase is unreachable.
3. **API Layer:** `apiClient.ts` handles REST endpoints (`/upload`, `/extract/{id}`, `/match/{id}`, `/match/{id}/confirm`, `/match/{id}/reject`) talking to FastAPI backend on `http://localhost:8000`.
4. **Authentication:** `AuthProvider.tsx` provides role switching (`planner` vs `supervisor`) with `localStorage` persistence and `X-User-Role` header injection.

---

## B. Existing Routes

| Path | Component | Layout Shell | Status |
|---|---|---|---|
| `/login` | `LoginPage` | Standalone full-page | Working (Demo role picker + email) |
| `/` | `DashboardPage` | `AppShell` (Sidebar + TopBar) | Working (Single-project dashboard) |
| `/upload` | `UploadPage` | `AppShell` | Working (Dropzone + Pipeline card) |
| `/reconciliation` | `ReconciliationPage` | `AppShell` | Working (Table + Disambiguation) |
| `/review/:matchId` | `ReviewPage` | `AppShell` | Working (Detail + Alternative picker) |
| `/unmatched` | `UnmatchedPage` | `AppShell` | Working (Table + manual link placeholder) |
| `/audit` | `AuditPage` | `AppShell` | Working (Chronological timeline) |
| `/schedule` | `SchedulePage` | `AppShell` | Working (Baseline schedule table) |
| `*` | Redirect to `/` | — | Fallback |

---

## C. Existing Pages

1. **`LoginPage.tsx`** (108 lines):
   - Role selector toggle (Planner / Site Supervisor).
   - Email input and submit action.
   - Demo role credentials.
2. **`DashboardPage.tsx`** (88 lines):
   - Welcome banner with active role badge.
   - Action links: "Upload Daily Report" and "Reconciliation Table".
   - `ProgressSummary` KPI cards.
   - Two-column grid: `DisciplineBreakdown` and `RecentUploads`.
3. **`UploadPage.tsx`** (100 lines):
   - Dropzone with drag-and-drop support (`.pdf`, `.csv`, `.xlsx`, `.txt`).
   - `UploadStatusCard` rendering pipeline stages: Uploading → Extracting → Matching → Completed/Failed.
4. **`ReconciliationPage.tsx`** (98 lines):
   - `ReconciliationTable` with search filter, discipline filter, status filter.
   - Expandable rows for candidate disambiguation.
   - Quick actions: Confirm, Reject, Confirm Alternative.
5. **`ReviewPage.tsx`** (114 lines):
   - Deep review of single match candidate (`/review/:matchId`).
   - Shows reported activity vs AI suggestion, candidate alternatives list, and confirmation/rejection action bar.
6. **`UnmatchedPage.tsx`** (110 lines):
   - `DataTable` displaying activities below confidence threshold (0.70).
   - Extraction confidence badges and manual link button trigger.
7. **`SchedulePage.tsx`** (165 lines):
   - Master baseline schedule WBS viewer.
   - Discipline tabs, search, planned start/end dates, activity codes.
8. **`AuditPage.tsx`** (23 lines):
   - Container for `AuditTimeline`, rendering immutable audit actions with actor, timestamp, and confidence tags.

---

## D. Existing Components

### Common / UI Primitives (`src/components/common/`):
- `ConfidenceBadge.tsx`: Badges for high ($\ge 0.85$), review ($0.70-0.84$), and low ($<0.70$) confidence with percentage badges.
- `StatusBadge.tsx`: Status tags (`auto_linked`, `pending_review`, `confirmed`, `rejected`, `uploaded`, `processing`, `failed`).
- `KPICard.tsx`: Metric card with icon, title, value, subtext, and trend indicator.
- `DataTable.tsx`: Generic typed table with headers, custom column renderers, empty state, and zebra hover.
- `EmptyState.tsx`: Icon, title, description, and action button.
- `ErrorState.tsx`: Alert icon, error message, and retry button.
- `LoadingSkeleton.tsx`: Shimmer placeholder for cards, tables, and rows.
- `Toast.tsx`: Auto-dismissing notifications (success, error, info).

### Layout (`src/components/layout/`):
- `AppShell.tsx`: Outer flex layout with `Sidebar` fixed at left and main content area with `TopBar`.
- `Sidebar.tsx`: Fixed navigation sidebar with brand logo, nav links, and realtime sync pill.
- `TopBar.tsx`: Top bar containing project identifier ("Line 247 — EPC Package 3"), demo role switcher toggle, user profile avatar, and sign-out button.

### Dashboard (`src/components/dashboard/`):
- `ProgressSummary.tsx`: 4 KPI cards (Total Activities, Auto-Linked, Pending Review, Unmatched).
- `DisciplineBreakdown.tsx`: Progress bars per discipline (Civil, Piping, Electrical, Instrumentation, Static Equipment).
- `RecentUploads.tsx`: List of recent file ingestion records with status tags.

### Reconciliation & Review (`src/components/reconciliation/` & `src/components/review/`):
- `ReconciliationTable.tsx`: Searchable, filterable list of matches with batch actions.
- `MatchRow.tsx`: Individual row showing extracted description vs P6 baseline activity, similarity score, and action buttons.
- `CandidateList.tsx`: List of alternative schedule activities for ambiguous matches.
- `DisambiguationPanel.tsx`: Detailed side-by-side comparison modal/drawer for manual disambiguation.
- `ActivityDetailCard.tsx`: Card view of extracted activity metadata (dates, times, location reference).
- `ConfirmRejectBar.tsx`: Action bar for planner review with confirmation and rejection reasoning.
- `ReviewPanel.tsx`: Full review layout combining detail card, candidate list, and confirmation bar.

### Upload & Audit (`src/components/upload/` & `src/components/audit/`):
- `UploadDropzone.tsx`: Drag & drop file upload target with file type validations.
- `UploadStatusCard.tsx`: Real-time pipeline progress step card (Idle → Uploading → Extracting → Matching → Completed).
- `AuditTimeline.tsx`: Vertical timeline with actor avatar, action type badge, target activity code, and timestamp.

---

## E. Existing Styling / Design System

Located in `frontend/src/index.css`:
- **Theme:** "Enterprise Infrastructure Dark Mode".
- **Color Tokens:**
  - Backgrounds: `--bg-primary` (`#0a0e17`), `--bg-secondary` (`#0f172a`), `--bg-surface` (`#1e293b`), `--bg-surface-elevated` (`#243248`), `--bg-surface-hover` (`#2d3d56`).
  - Text: `--text-primary` (`#f8fafc`), `--text-secondary` (`#94a3b8`), `--text-muted` (`#64748b`).
  - Borders: `--border-subtle` (`rgba(255,255,255,0.07)`), `--border-medium` (`rgba(255,255,255,0.14)`).
  - Accents: `--accent-blue` (`#38bdf8`), `--accent-indigo` (`#6366f1`).
  - Confidence & Status: High (`#10b981`), Review (`#f59e0b`), Low (`#ef4444`).
  - Disciplines: Civil (`#38bdf8`), Piping (`#a855f7`), Electrical (`#facc15`), Instrumentation (`#14b8a6`), Equipment (`#f97316`), HSE (`#22c55e`).
- **Typography:** `Inter` for body and UI elements, `JetBrains Mono` for activity codes and timestamps.
- **Responsiveness:** Existing CSS has layout classes for sidebar and topbar, but has fixed sidebar width (`260px`) and lacks mobile hamburger menus, collapsible sidebars, and dedicated mobile cards for dense data tables.

---

## F. Existing Dependencies

In `frontend/package.json`:
- `react`: `^18.3.1`
- `react-dom`: `^18.3.1`
- `react-router-dom`: `^6.26.2`
- `lucide-react`: `^0.439.0` (modern feather icons)
- `@supabase/supabase-js`: `^2.45.4`
- Dev dependencies: `typescript` (`^5.5.4`), `vite` (`^5.4.3`), `@vitejs/plugin-react` (`^4.3.1`), `@types/react`, `@types/react-dom`.

No heavy UI libraries (no Material UI, no Ant Design, no Chakra). Pure CSS design system with React and Lucide icons.

---

## G. Existing Mock / API Layer

- **Supabase Fallbacks:** `useMatches.ts`, `useSchedulePlan.ts`, `useExtractions.ts`, `useUnmatched.ts`, and `useAuditTrail.ts` currently embed static mock data directly within their `catch`/fallback blocks when Supabase fails or isn't connected.
- **`data/baseline_schedule.csv`**: Contains 21 verified Primavera P6 baseline activities spanning Civil (CIV-101 to 104), Piping (PIP-201 to 205), Electrical (ELE-301 to 304), Instrumentation (INS-401 to 403), Static/Rotating Equipment (EQP-501 to 503), and HSE (HSE-601 to 602).
- **Existing Limitation:** Mock data is currently scattered inside individual hooks rather than residing in a centralized, coherent mock data store that cross-references projects, activities, reports, and audit logs consistently.

---

## H. Existing Assets

- `frontend/public/favicon.svg`: Brand logo favicon.
- `frontend/public/icons.svg`: SVG icon sprite.
- `frontend/src/assets/hero.png`: Dashboard preview image.
- `frontend/src/assets/vite.svg`, `typescript.svg`: Template assets.

---

## I. Working Functionality

1. **Dashboard Overview:** Displays KPI metrics, discipline progress bars, and recent report activity.
2. **Report Upload Flow:** File drag & drop, file type validation, simulated multi-step extraction & matching pipeline.
3. **Reconciliation Table:** Filtering by discipline, status, and search query; expand candidate list; disambiguation panel; confirm/reject actions.
4. **Deep Review View:** Route `/review/:matchId` displays single candidate review with alternative choice selection.
5. **Unmatched Pool:** Table of low-confidence or unlinked activities with confidence scores.
6. **Audit Trail:** Chronological timeline of system and planner actions.
7. **Schedule WBS:** Schedule plan viewer with discipline filtering.
8. **Role Switcher & Auth:** Planner vs Site Supervisor toggle updating UI permissions and `X-User-Role` headers.
9. **Build & Type Safety:** Clean compilation with zero TypeScript errors.

---

## J. Missing Functionality (According to Phase 1 Blueprint)

### 1. Public Marketing Website (13 missing routes):
- `/` (Public Landing Page with Hero, Problem, Solution, How It Works, Features, AI Matching, Preview, Use Cases, Trust, CTA, Footer). *Currently `/` routes straight to internal `DashboardPage`!*
- `/features` (Report Intelligence, Schedule Intelligence, Reconciliation, Collaboration, Analytics).
- `/how-it-works` (01 Upload → 02 Extract → 03 Understand → 04 Match → 05 Review → 06 Confirm → 07 Audit).
- `/solutions` (Persona-based: Project Managers, Planners, Site Supervisors, EPC Teams).
- `/pricing` (Free/Trial, Professional, Enterprise tier cards).
- `/about` (Mission, Vision, Problem, Product Philosophy, Team).
- `/contact` (Interactive contact inquiry form).
- `/docs` (Documentation UI: Getting Started, How OnGround Works, Projects, Schedules, Reports, Reconciliation, Review, Analytics).
- `/security` (Only documented capabilities: Role-based access control, planner confirmation gates, immutable audit trail, baseline schedule immutability).
- `/faq` (Structured question-and-answer accordions from approved blueprint).
- `/privacy`, `/terms`, `/cookies` (Legal and compliance pages).

### 2. Authentication System (4 missing routes):
- `/signup` (Sign up flow with role selection).
- `/forgot-password` (Password recovery request).
- `/reset-password` (New password creation).
- `/verify-email` (Verification code / confirmation state).
- *Existing `/login` needs refinement to fit public/auth layout conventions.*

### 3. Application Portfolio Layer (3 routes):
- `/dashboard` (True central command center with search, notifications, profile, multi-project summary, reconciliation health).
- `/projects` (Project portfolio list/cards with status filters, client details, progress, reports count, search).
- `/projects/new` (5-step Project Creation Wizard: Info → Details → Import Schedule → Team → Complete).

### 4. Unified Project Workspace (`/projects/:id/*`) (12 routes):
- Dynamic project routing (`/projects/:id/...`) with active project context provider (Line 247 EPC Package, Mumbai Metro Line 3, Vadodara Refinery).
- `/projects/:id/overview` (Project-specific command center).
- `/projects/:id/schedule` (Project schedule with search, filter, sort, mock import/export).
- `/projects/:id/activities` (Activity explorer linking Activity → Reports → Schedule → Matches → Audit).
- `/projects/:id/reports` (Reports list with Uploaded, Processing, Completed, Failed status).
- `/projects/:id/reports/upload` (Project-scoped upload flow).
- `/projects/:id/processing` (Real-time visual processing pipeline: Upload → Extraction → Embedding → Matching → Complete, with failure retry).
- `/projects/:id/reconciliation` (Scoped reconciliation table with Matched, Needs Review, Unmatched tabs).
- `/projects/:id/review` and `/projects/:id/review/:matchId` (Interactive candidate disambiguation).
- `/projects/:id/unmatched` (Unmatched pool with manual search & match).
- `/projects/:id/analytics` (KPIs, Reports over time, Matching trends, Review rates, Confidence distribution).
- `/projects/:id/audit` (Project-specific audit trail).
- `/projects/:id/team` (Team members list, role changes, invite member modal).
- `/projects/:id/settings` (General, Schedule, Reports, Matching thresholds, Notifications, Danger zone).

### 5. Architectural Infrastructure:
- Centralized mock data repository (`src/mocks/`) linking projects, schedules, reports, extractions, matches, team, and audit logs.
- Clean API abstraction layer (`src/api/`) allowing toggling between mock services and live FastAPI/Supabase endpoints.
- Global UI primitives missing: `Modal`/`Dialog`, `Drawer`, `Tabs`, `Select`/`Dropdown`, `Breadcrumbs`, `PageHeader`, `ProgressBar`, `StatusIndicator`, `ConfirmationDialog`.
- Responsive navigation (mobile menu, drawer sidebar, touch-friendly tables).

---

## K. Components That Can Be Reused

The existing components are well-written and directly reusable with minimal or zero modification:
1. `ConfidenceBadge.tsx` & `StatusBadge.tsx`: Reusable across all tables, cards, and review panels.
2. `KPICard.tsx`: Reusable in Dashboard, Project Overview, and Analytics.
3. `DataTable.tsx`: Reusable in Projects list, Schedule, Activities, Reports, Team, and Settings.
4. `EmptyState.tsx`, `ErrorState.tsx`, `LoadingSkeleton.tsx`, `Toast.tsx`: Reusable across all pages and states.
5. `MatchRow.tsx`, `CandidateList.tsx`, `DisambiguationPanel.tsx`: Reusable in Project Reconciliation and Review screens.
6. `ActivityDetailCard.tsx`, `ConfirmRejectBar.tsx`, `ReviewPanel.tsx`: Reusable in Review screen.
7. `UploadDropzone.tsx`, `UploadStatusCard.tsx`: Reusable in Project Upload & Processing screens.
8. `AuditTimeline.tsx`: Reusable in Project Audit screen.
9. `DisciplineBreakdown.tsx`, `ProgressSummary.tsx`, `RecentUploads.tsx`: Reusable in Project Overview and Dashboard.

---

## L. Components That Need Modification

1. `App.tsx`: Refactor from flat route list into structured nested routes with 3 distinct layouts: `PublicLayout`, `AuthLayout`, `AppLayout`, and `ProjectWorkspaceLayout`.
2. `AppShell.tsx`: Split into a general App layout (`AppLayout` for `/dashboard`, `/projects`) and a dedicated `ProjectWorkspaceLayout` for `/projects/:id/*` with project-aware sidebar and context.
3. `Sidebar.tsx`: Update to support two modes:
   - Global App navigation (Dashboard, Projects).
   - Project Workspace navigation (Overview, Schedule, Activities, Reports, Processing, Reconciliation, Review, Unmatched, Analytics, Audit, Team, Settings) with active project switcher.
4. `TopBar.tsx`: Add breadcrumb support, global search modal trigger, notifications drawer, and project switcher dropdown.
5. `ReconciliationTable.tsx`: Add tab switching (`Matched`, `Needs Review`, `Unmatched`), quick confirm/reject interactions, and link to Activity Explorer.
6. `index.css`: Add styles for public marketing pages (hero gradients, feature grids, pricing cards, doc navigation, footer, interactive modals, drawers, tabs).

---

## M. Components & Pages That Need Creation

### 1. Public Pages (`src/pages/public/`):
- `HomePage.tsx` (Top-tier polish, visual workflow, interactive demo preview)
- `FeaturesPage.tsx`
- `HowItWorksPage.tsx`
- `SolutionsPage.tsx`
- `PricingPage.tsx`
- `AboutPage.tsx`
- `ContactPage.tsx`
- `DocsPage.tsx`
- `SecurityPage.tsx`
- `FAQPage.tsx`
- `PrivacyPage.tsx`
- `TermsPage.tsx`
- `CookiesPage.tsx`

### 2. Public Layout & Shared Components (`src/components/public/`):
- `PublicNavbar.tsx` (Logo, Product, Solutions, How It Works, Pricing, Docs, Login/Get Started buttons)
- `PublicFooter.tsx` (Links, copyright, social links, status)

### 3. Auth Pages (`src/pages/auth/`):
- `SignupPage.tsx`
- `ForgotPasswordPage.tsx`
- `ResetPasswordPage.tsx`
- `VerifyEmailPage.tsx`

### 4. App Portfolio Pages (`src/pages/app/`):
- `PortfolioDashboardPage.tsx` (Command center for all projects)
- `ProjectsPage.tsx` (Projects list with search, status filters, progress bars)
- `CreateProjectPage.tsx` (5-step wizard)

### 5. Project Workspace Pages (`src/pages/project/`):
- `ProjectOverviewPage.tsx`
- `ProjectSchedulePage.tsx` (enhanced with sort, activity detail modal, mock import/export)
- `ProjectActivitiesPage.tsx` (Activity explorer with discipline, date, match status filters and detail drawer)
- `ProjectReportsPage.tsx` (Reports list with status tags and actions)
- `ProjectUploadPage.tsx` (Scoped to active project)
- `ProjectProcessingPage.tsx` (Dedicated processing pipeline tracker with simulated stages & retry)
- `ProjectReconciliationPage.tsx` (Multi-tab reconciliation experience)
- `ProjectReviewPage.tsx` (Human review interface)
- `ProjectUnmatchedPage.tsx` (Unmatched activity search & manual link modal)
- `ProjectAnalyticsPage.tsx` (Match rate, review rate, confidence distribution charts/bars)
- `ProjectAuditPage.tsx` (Project-specific audit timeline with filters)
- `ProjectTeamPage.tsx` (Team roster, invite modal, role assignment)
- `ProjectSettingsPage.tsx` (General, Schedule, Reports, Matching, Notifications, Danger zone)

### 6. Missing UI Primitives (`src/components/ui/`):
- `Modal.tsx` / `Dialog.tsx`
- `Drawer.tsx`
- `Tabs.tsx`
- `Breadcrumbs.tsx`
- `PageHeader.tsx`
- `ProgressBar.tsx`
- `Select.tsx` / `Dropdown.tsx`
- `ConfirmationDialog.tsx`

### 7. Centralized Mock & API Layer (`src/mocks/` & `src/api/`):
- `mockProjects.ts`: 3 realistic EPC infrastructure projects.
- `mockSchedule.ts`: Baseline Primavera P6 schedule derived from `data/baseline_schedule.csv`.
- `mockReports.ts`: Daily site progress reports from site engineers.
- `mockActivities.ts`: Extracted activities with disciplines, timestamps, and locations.
- `mockMatches.ts`: Matched, pending review, and unmatched records with candidate alternatives.
- `mockTeam.ts`: Planners, site supervisors, and project managers.
- `mockAudit.ts`: Chronological audit trail records.
- `mockAnalytics.ts`: Metric series for reports, match rates, and confidence distributions.
- `apiService.ts`: Unified API abstraction layer with mock/live mode switch.
- `ProjectContext.tsx`: React Context providing active project state to all `/projects/:id/*` routes.

---

## N. Potential Technical Risks & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| **Breaking Existing Functionality** | SIH demo flows (reconciliation, upload, audit) could be disrupted. | Preserve existing component logic. Wrap them cleanly inside the new `ProjectWorkspaceLayout`. Keep existing route paths functional as aliases or redirects. |
| **Data Inconsistency across Views** | Discrepancies between report activities, schedule codes, and reconciliation items. | Use a single centralized mock data source (`src/mocks/`) with relational integrity based on `data/baseline_schedule.csv`. |
| **Navigation & Deep-Linking Breaks** | Users jumping directly to `/projects/proj-1/reconciliation` might crash if project context is missing. | Default `ProjectContext` to fallback project (`proj-01`: Line 247 EPC Package) if invalid or unspecified ID. |
| **CSS Bloat or Inconsistent Themes** | Introducing public pages might clash with the dark infrastructure theme. | Extend existing CSS variable system (`--bg-primary`, `--accent-blue`, etc.) with cohesive public SaaS styling maintaining dark, high-contrast aesthetic. |
| **Scope Creep into Backend** | Temptation to build real backend endpoints or database logic. | Strictly adhere to Rule 4: all state updates handled in-memory / localStorage with realistic async mock delays and clean API abstraction. |

---

## O. Verification & Audit Sign-Off
- TypeScript compiler verification: Passed (`tsc && vite build` exited with code 0).
- Existing component inventory: Complete.
- Blueprint gap analysis: 32 target routes mapped to implementation milestones.
- Discovery phase: Completed. Ready for Implementation Plan execution.
