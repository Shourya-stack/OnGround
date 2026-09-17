# OnGround — SIH 2026 Live Demo Script & Execution Playbook
**Project:** OnGround (Problem Statement ID: 26122)  
**Target Event:** Smart India Hackathon 2026 Live Jury Demonstration  
**Classification:** Operational Demo Protocol & Presentation Runbook  

---

## 1. Demo Preparation & Pre-Flight Checklist

### 15 Minutes Before Demo:
1. **Frontend Server:** Verify Vite dev server running on `http://localhost:5173` (or live Vercel URL).
2. **Backend Server:** Verify FastAPI backend running on `http://localhost:8000` (or Render URL).
3. **Health Check:** Open `http://localhost:8000/health` $\rightarrow$ Confirm `{"status": "ok", "version": "1.0.0"}`.
4. **Browser Setup:** Open Chrome in full screen ($1920 \times 1080$), zoom set to $100\%$, browser dev tools closed.
5. **Pre-Loaded Sample Files:** Have `data/sample_report_electrical.txt` and `data/sample_report_piping.txt` readily accessible on Desktop.
6. **Demo Role State:** Verify user role toggle in top-right navigation is visible and defaults to **Planner**.

---

## 2. The 3-Minute Rapid Live Demo Sequence

### Step 1: The Executive Dashboard (0:00 – 0:30)
- **Screen:** `/` (`DashboardPage.tsx`)
- **Action:** Point mouse to the 4 KPI cards at the top.
- **Presenter Says:**  
  *"We begin on the Executive Intelligence Dashboard. Project managers can see real-time progress across all EPC disciplines. Notice our high-level KPIs: Total Reconciled Matches, Auto-Linked percentage, pending planner reviews, and isolated unmatched tasks. As site logs are uploaded, these metrics update live via WebSockets."*

### Step 2: Supervisor Report Upload & AI Extraction (0:30 – 1:15)
- **Screen:** Navigate to `/upload` (`UploadPage.tsx`)
- **Action:** Drag and drop `sample_report_electrical.txt` into the dropzone. Click **"Process & Extract Activities"**.
- **Visual on Screen:** File validation badge turns green, parsing spinner animates, and within 2 seconds, extracted activities appear in structured cards.
- **Presenter Says:**  
  *"Now, let's step into the shoes of a site supervisor. We upload an unstructured daily electrical report containing free-form text. OnGround validates the file, normalizes the text, and calls our structured extraction engine. Notice how it extracts individual tasks—cable tray installation, 11kV feeder pulling, and transformer busduct terminations—with auto-classified disciplines, timestamps, and server-calculated deterministic confidence scores."*

### Step 3: Reconciliation Workbench & Disambiguation (1:15 – 2:00)
- **Screen:** Navigate to `/reconciliation` (`ReconciliationPage.tsx`)
- **Action:** Show the table rows with status badges. Point to a `pending_review` match with a candidate expansion drawer.
- **Presenter Says:**  
  *"Next, we switch to the Project Planner's view on the Reconciliation Workbench. High-confidence items ($\ge 85\%$) are automatically linked. But look at this electrical activity: our matching engine detected two close baseline candidates within a 5% score margin. Instead of guessing, OnGround flags it for human review."*

### Step 4: Side-by-Side Review & 1-Click Confirmation (2:00 – 2:35)
- **Screen:** Click **"Review Match"** $\rightarrow$ Navigate to `/review/:matchId` (`ReviewPage.tsx`)
- **Action:** Show side-by-side cards (Extracted Activity on left vs. Baseline Schedule Activity on right). Click the green **"Confirm Schedule Link"** button.
- **Visual on Screen:** Success toast notification appears; status instantly updates to `confirmed`.
- **Presenter Says:**  
  *"On the Review Workbench, the planner compares the ground report directly against the candidate schedule items. With 1-click, the planner confirms the link. Our backend verifies the planner's authorization and commits the link."*

### Step 5: Immutable Audit Trail & Realtime Sync (2:35 – 3:00)
- **Screen:** Navigate to `/audit` (`AuditPage.tsx`)
- **Action:** Scroll to the top entry in the timeline.
- **Presenter Says:**  
  *"Finally, we navigate to the Immutable Audit Trail. Look at the latest entry: the exact action 'confirmed', the timestamp, the confidence score (0.88), and the planner's UUID are permanently recorded. Under PostgreSQL Row-Level Security, this log cannot be altered or deleted, providing complete legal auditability for EPC project contracts."*

---

## 3. The 5-Minute Technical Deep-Dive Demo Sequence

*(Includes all steps from the 3-minute demo plus the following two deep-dive steps:)*

### Additional Step A: Handling Unmatched Activities (3:00 – 3:45)
- **Screen:** Navigate to `/unmatched` (`UnmatchedPage.tsx`)
- **Action:** Show an activity with low semantic similarity ($< 70\%$).
- **Presenter Says:**  
  *"What happens when a subcontractor reports work that does not exist in the baseline schedule—such as unplanned rework or out-of-scope tasks? Rather than hallucinating a false match, OnGround isolates the item in the Unmatched Queue. The planner can investigate, mark it as 'New Out-of-Scope Activity', or manually map it to a WBS code, ensuring ground reality is captured without corrupting baseline progress."*

### Additional Step B: Baseline WBS Schedule Explorer (3:45 – 4:30)
- **Screen:** Navigate to `/schedule` (`SchedulePage.tsx`)
- **Action:** Filter by discipline (`Piping` or `Electrical`), search for `ELE-302`.
- **Presenter Says:**  
  *"Here is our Baseline Schedule WBS Explorer. Planners can inspect all master activities across disciplines with planned start and end dates. This serves as the ground truth against which our 384-dimensional `sentence-transformers` vector space computes cosine similarities."*

### Closing & Transition to Q&A (4:30 – 5:00)
- **Presenter Says:**  
  *"To summarize: OnGround transforms messy site reports into verified, audit-proof schedule intelligence in seconds. Respected judges, we are now ready for your questions."*

---

## 4. Demo Risk Mitigation & Backup Scenarios

| Potential Failure Point | Likelihood | System Fail-Safe / Backup Plan |
|---|---|---|
| **No Internet at Venue** | Low–Medium | Backend automatically switches to local `_local_mock_fallback()` and synthetic baseline schedule; all frontend components render fallback mock datasets without throwing errors. |
| **OpenRouter LLM API Rate Limit** | Low | The backend catches API errors, logs a warning, and gracefully falls back to deterministic rule extraction without crashing the API. |
| **Supabase Cloud Latency** | Low | Frontend hooks include local state optimistic updates and local mock fallbacks if network queries exceed timeout. |
| **Accidental Role Switch** | Low | Planner role can be instantly toggled back via the top-navigation badge dropdown. |

---
*End of Live Demo Script*
