# OnGround — SIH 2026 Master Fact Sheet & Quick Reference
**Smart India Hackathon 2026 | Problem Statement ID:** 26122  
**System Name:** OnGround (*formerly TrueLine*)  
**Theme:** Miscellaneous | **Category:** Software Edition  
**Repository:** `Shourya-stack/OnGround`  

---

## 1. Quick Reference Metadata

| Parameter | Authoritative Value |
|---|---|
| **Project Title** | OnGround — Infrastructure Progress Intelligence System (IPIS) |
| **Problem Statement ID** | 26122 |
| **PS Title** | Infrastructure Data Capture & Schedule-Linking |
| **Target Users** | EPC Megaproject Planners, Site Supervisors, Project Directors, Lead Discipline Engineers |
| **Supported File Ingests**| `.pdf`, `.csv`, `.xlsx`, `.xls`, `.txt`, `.log` (Max: 10 MB) |
| **AI LLM Model** | OpenRouter (`liquid/lfm-2.5-2.6b:free` or `meta-llama/llama-3.3-70b-instruct:free`) |
| **Dense Vector Model** | `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors) |
| **Backend Framework** | FastAPI 0.110+, Python 3.12, Uvicorn, Pydantic v2 |
| **Frontend Framework** | React 18, TypeScript 5.5, Vite 5, React Router v6, Lucide React |
| **Database & Storage** | Supabase Cloud (PostgreSQL 15, Row-Level Security, Storage Bucket `'reports'`) |
| **Realtime Engine** | Supabase Realtime (WebSocket PostgreSQL change replication) |
| **Cloud Hosting** | Vercel (Frontend SPA) + Render (FastAPI Backend) |
| **Backend Unit Tests** | **17 / 17 Passed (100% Pass Rate)** |
| **Frontend Build Status** | **Vite Clean Build (0 Errors, 483kB bundle, 131kB gzip)** |
| **Evaluated Matching Top-1**| **100.0% (15/15 Ground Truth Activities Mapped Exactly)** |
| **False-Positive Auto-Links**| **0 Verified False Positives** |

---

## 2. Core Mathematical Formulas

### Deterministic Extraction Confidence Score
$$\text{Confidence}_{\text{extraction}} = \min\left(1.0, \, 0.50 + \delta_{\text{discipline}} + \delta_{\text{start}} + \delta_{\text{end}} + \delta_{\text{location}}\right)$$
- Base: $0.50$
- Valid Discipline: $+0.15$
- Valid Start Time: $+0.15$
- Valid End Time: $+0.10$
- Valid Location ($\ge 3$ chars): $+0.10$

### Hybrid Composite Schedule Matching Score
$$\text{Score}_{\text{composite}} = (0.70 \times \text{Sim}_{\text{cosine}}) + (0.20 \times \text{Conf}_{\text{extract}}) + (0.10 \times \text{Factor}_{\text{date}}) - \text{Penalty}_{\text{discipline}}$$
- Dense Vector Cosine Similarity Weight: $70\%$
- Extraction Completeness Weight: $20\%$
- Temporal Proximity Weight: $10\%$
- Discipline Mismatch Penalty: $-0.15$ (applied when disciplines differ and are not "unknown")

### Decision Banding & Disambiguation Thresholds
- $\ge 0.85$ (and $|\text{Score}_1 - \text{Score}_2| > 0.05$): **Auto-Linked**
- $0.70 \le \text{Score} < 0.85$ (or $|\text{Score}_1 - \text{Score}_2| \le 0.05$): **Pending Planner Review** (top 3 candidates stored in JSONB)
- $< 0.70$: **Unmatched Queue** (isolated from schedule)

---

## 3. Database Schema Overview (7 Tables)

1. `profiles`: User account metadata and role mapping (`planner` vs `supervisor`).
2. `schedule_plan`: Ground truth baseline WBS activities (`activity_code`, `discipline`, dates).
3. `extractions`: Uploaded report documents and asynchronous pipeline processing status.
4. `extracted_activities`: Normalized tasks with discipline, timestamps, location, and deterministic confidence.
5. `schedule_matches`: Semantic linkages between extracted tasks and schedule items with status pills.
6. `unmatched_activities`: Isolated low-confidence activities with logged reasons and resolution state.
7. `audit_trail`: Append-only immutable log with database-level RLS disallowing `UPDATE` and `DELETE`.

---

## 4. Primary API Route Inventory

- `GET /health` $\rightarrow$ Liveness check.
- `POST /upload` $\rightarrow$ File validation, Supabase Storage write, `extractions` record creation.
- `POST /extract/{id}` $\rightarrow$ PDF/spreadsheet extraction, OpenRouter LLM parsing, deterministic confidence scoring.
- `POST /match/{extracted_activity_id}` $\rightarrow$ `sentence-transformers` vector inference and decision banding.
- `POST /match/{id}/confirm` $\rightarrow$ **Planner-only** match confirmation and audit logging.
- `POST /match/{id}/reject` $\rightarrow$ **Planner-only** match rejection and routing to unmatched queue.

---

## 5. Key Differentiators for Judges

1. **Deterministic vs. Hallucinated Scoring:** Confidence is computed in Python, never self-reported by the LLM.
2. **Discipline-Aware Penalty Heuristics:** Prevents vector embedding false positives between different construction trades.
3. **Automated Candidate Disambiguation:** Refuses to make autonomous guesses when top candidates are within a 5% score margin.
4. **Append-Only Immutability:** Guaranteed at the PostgreSQL RLS level for legal dispute defense.
5. **Real-Time Collaboration:** Supabase Realtime WebSockets synchronize UI state across supervisor uploads and planner approvals in milliseconds.

---
*End of Master Fact Sheet*
