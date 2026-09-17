# OnGround — SIH 2026 Presentation Screenshot Capture Checklist
**Project:** OnGround (Problem Statement ID: 26122)  
**Target Event:** Smart India Hackathon 2026 Grand Finale Presentation  
**Classification:** Visual Asset Capture & Media Production Guidelines  

---

## 1. Master Screenshot Inventory

| # | Screen / View Name | Route | What MUST Be Visible | What MUST NOT Be Visible | Target Slide in PPT |
|---|---|---|---|---|---|
| **SS-01** | **Executive Intelligence Dashboard** | `/` | 4 KPI summary cards with active counts, Discipline Breakdown progress bar, Recent Uploads table with completed status badges. | Scrollbars, browser developer tools, placeholder text, empty cards. | **Slide 9** (Product Tour: Dashboard) |
| **SS-02** | **Daily Report Upload Dropzone** | `/upload` | Drag-and-drop box with supported format badges (`.pdf`, `.csv`, `.xlsx`, `.txt`), file size indicator (10MB limit), and "Process & Extract" button. | Any private file paths or system user folders. | **Slide 10** (Product Tour: Ingestion) |
| **SS-03** | **Extraction Progress & Structured Output** | `/upload` | Extracted activity cards showing description, auto-detected discipline badge (`piping`, `electrical`), timestamps, location, and confidence gauge ($0.95$). | Raw unformatted JSON text without styling. | **Slide 7** (AI Extraction Pipeline) |
| **SS-04** | **Reconciliation Table & Status Badges** | `/reconciliation` | Multi-column table with Extracted Activity, Linked WBS Activity, Discipline tag, Confidence score bar, Status pills (`auto_linked`, `pending_review`), and action buttons. | Missing joined relationships or broken table alignment. | **Slide 10** (Product Tour: Reconciliation) |
| **SS-05** | **Candidate Disambiguation Drawer** | `/reconciliation` | Expanded row displaying the top 2–3 ranked baseline candidates with individual similarity percentages ($78\%$ vs $74\%$). | Overflowing un-truncated text strings. | **Slide 8 & 11** (Matching Engine / Disambiguation) |
| **SS-06** | **Side-by-Side Review Workbench** | `/review/:matchId` | Side-by-side card layout comparing Ground Report metadata with Baseline Schedule activity, candidate score comparison, and green "Confirm" / red "Reject" buttons. | Disabled/broken action buttons. | **Slide 11** (Product Tour: Review Workbench) |
| **SS-07** | **Unmatched Activities Isolation Queue** | `/unmatched` | Isolated list of low-confidence or rejected field tasks with documented failure reasons and resolution options ("Mark Out-of-Scope", "Manual Link"). | Empty error screens. | **Slide 5 & 14** (Workflow / Existing vs OnGround) |
| **SS-08** | **Baseline WBS Schedule Explorer** | `/schedule` | Master schedule table with activity codes (`PIP-201`, `ELE-302`), discipline filters, planned date ranges, and search bar. | Unsorted, unindexed raw data. | **Slide 4** (The OnGround Solution) |
| **SS-09** | **Immutable Audit Trail Timeline** | `/audit` | Chronological event cards displaying action (`auto_linked`, `confirmed`), actor badge (`Planner: UUID`), timestamp, and confidence score with append-only security badge. | Any editable form fields (must clearly look immutable). | **Slide 12** (Security & Auditability) |
| **SS-10** | **Role-Switching Authentication Badge** | Top Nav Bar | Clean top-right role indicator displaying active role ("Planner (Admin)" vs "Supervisor") with 1-click switcher. | Exposed JWT tokens, API keys, or raw passwords. | **Slide 12** (Security & Roles) |

---

## 2. Capture & Framing Guidelines for Maximum PPT Impact

1. **Resolution:** Capture at full HD resolution ($1920 \times 1080$ or higher) with standard display DPI scaling ($100\%$).
2. **Theme Consistency:** Use OnGround's native dark-mode enterprise palette (`#0B0F17` background, `#1E293B` cards, `#3B82F6` primary accents, `#10B981` success badges).
3. **Data Polish:** Ensure sample data in screenshots displays realistic EPC industrial terminology (e.g., *"12-inch CS cooling water line"*, *"11kV feeder cable pulling"*), not placeholder text like *"test 123"*.
4. **Cropping:** Crop out browser window borders, bookmarks bar, and OS taskbars. Frame only the clean application UI.
5. **Callout Highlights:** In PPT slides, place a subtle 2px glowing primary border or translucent callout bubble around key metrics (such as the $95\%$ confidence gauge or the *"Auto-Linked"* badge).

---
*End of Screenshot Checklist*
