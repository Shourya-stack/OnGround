# OnGround IPIS — Test Datasets & Demo Artifacts

This directory contains synthetic datasets generated specifically for the **Smart India Hackathon (SIH 2026) Problem Statement 26122: Infrastructure Data Capture & Schedule-Linking**.

---

## 1. Baseline Master Schedule (`baseline_schedule.csv`)
* **Format:** CSV with headers (`activity_code`, `activity_description`, `discipline`, `planned_start`, `planned_end`).
* **Content:** 21 authoritative Primavera P6 WBS activities spanning all 6 EPC disciplines:
  - **Civil:** Site grading, foundations, rebar, pipe rack structural steel (`CIV-101` to `CIV-104`).
  - **Piping:** Spool fabrication, butt welding, NDT inspection, hydrotesting, underground firewater (`PIP-201` to `PIP-205`).
  - **Electrical:** Cable tray installation, 11kV feeder pulling, transformer busducts, grounding grid (`ELE-301` to `ELE-304`).
  - **Instrumentation:** Air headers, transmitter calibration, DCS loop checking (`INS-401` to `INS-403`).
  - **Static & Rotating Equipment:** Column C-101 heavy lift, boiler feed pump alignment, fin-fan exchangers (`EQP-501` to `EQP-503`).
  - **HSE:** Scaffold safety inspection, confined space atmospheric testing (`HSE-601`, `HSE-602`).

---

## 2. Synthetic Daily Progress Reports

| File | Type | Primary Discipline | Description |
|---|---|---|---|
| `sample_report_piping.txt` | Unstructured Text / PDF source | Piping, HSE | Daily welding log, spool ISO numbers, welder IDs, hydrotest records. |
| `sample_report_electrical.txt` | Unstructured Text | Electrical, Instrumentation | Cable tray runs, 11kV duct bank pulling, megger testing, transmitter calibration. |
| `sample_report_mixed.csv` | Structured Tabular CSV | Multi-Discipline | Daily contractor progress export covering civil, piping, electrical, instrumentation, and equipment. |

---

## 3. Demo Evaluation Sequence
1. **Load Baseline Schedule:** Import `baseline_schedule.csv` into `SCHEDULE_PLAN` table in Supabase.
2. **Supervisor Ingestion:** Upload `sample_report_piping.txt` on the `/upload` screen.
3. **AI Pipeline Processing:**
   - LLM extracts physical activities (`activity_description`, `discipline`, timestamps, location).
   - Server deterministically computes extraction confidence score.
   - `sentence-transformers` matches embeddings against active baseline activities and applies hybrid contextual weighting.
4. **Reconciliation & Review:**
   - High-confidence matches ($\ge 85\%$) are automatically linked (`auto_linked`).
   - Ambiguous or moderate matches ($70-84\%$) populate the Review queue with candidate suggestions.
   - Lead Planner logs in, reviews side-by-side comparison on `/review/:matchId`, and confirms or disambiguates with 1-click.
5. **Audit Verification:** View append-only chronological lifecycle actions on `/audit`.
