# OnGround — SIH 2026 Claim Verification Matrix & Presentation Safety Guide
**Project:** OnGround (Problem Statement ID: 26122)  
**Target Event:** Smart India Hackathon 2026 Grand Finale  
**Classification:** Factual Accuracy Audit & Claim Verification Guide  

---

## 1. Executive Summary & Verification Rules
To guarantee the highest possible credibility during judging and eliminate disqualification risks or aggressive technical penalties, **EVERY SINGLE CLAIM made in the SIH PPT, pitch, and jury Q&A must map directly to verified code, automated tests, or deployed infrastructure.**

Below is the authoritative classification matrix for the OnGround project.

---

## 2. Claim Classification Matrix

### Category A: Claims Fully Verified by Code & Tests (SAFELY CLAIM)

| Claim Statement | Verification Level | Code & File Evidence | Test / Benchmark Evidence |
|---|---|---|---|
| *"OnGround ingests multi-format daily reports across PDF, CSV, Excel, and plain text."* | **VERIFIED BY CODE & TEST** | `backend/services/extraction_service.py` (`extract_text_from_file`), `backend/routes/upload.py`. | Tested in `test_routes.py` (`test_upload_endpoint_valid_file`) and `evaluate_pipeline.py`. |
| *"Extraction confidence is calculated deterministically on the server based on completeness."* | **VERIFIED BY CODE & TEST** | `backend/services/extraction_service.py` (`calculate_extraction_confidence`). | Tested in `test_extraction_service.py` (`test_calculate_extraction_confidence`). |
| *"Semantic matching uses 384-dimensional dense vector embeddings with cosine similarity."* | **VERIFIED BY CODE & TEST** | `backend/services/matching_service.py` (`compute_similarity`, `all-MiniLM-L6-v2`). | Tested in `test_matching_service.py` and `evaluate_pipeline.py`. |
| *"A strict 15% penalty is subtracted when extracted and baseline disciplines clash."* | **VERIFIED BY CODE & TEST** | `backend/services/matching_service.py` (`calculate_match_score`). | Tested in `test_matching_service.py` (`test_calculate_match_score_discipline_penalty`). |
| *"Three-tier decision banding automatically links matches $\ge 85\%$, queues $70\%-84\%$ for review, and isolates $<70\%$."* | **VERIFIED BY CODE & TEST** | `backend/services/matching_service.py` lines 205–211. | Tested in `test_matching_service.py` (`test_matching_service_bands`). |
| *"Disambiguation logic flags matches for human review if top two candidates are within a 5% score margin."* | **VERIFIED BY CODE & TEST** | `backend/services/matching_service.py` lines 182–190. | Validated in `backend/services/matching_service.py` candidate serialization. |
| *"Confirm and Reject review actions are strictly restricted to the Planner role."* | **VERIFIED BY CODE & TEST** | `backend/routes/review.py` (`require_planner_role`). | Tested in `test_routes.py` (`test_review_confirm_role_enforcement` $\rightarrow$ HTTP 403 verified). |
| *"The audit trail is append-only with database-level RLS policies preventing updates and deletes."* | **VERIFIED BY CODE** | `backend/db/schema.sql` lines 239–251. | Verified in PostgreSQL schema definition. |
| *"The frontend updates in real time via Supabase Realtime WebSocket subscriptions."* | **VERIFIED BY CODE** | `frontend/src/hooks/useMatches.ts`, `useAuditTrail.ts`. | Supabase Realtime channel subscription logic verified. |
| *"The test suite contains 17 passing backend unit tests."* | **VERIFIED BY TEST** | `backend/tests/` (all 4 test modules). | `pytest backend/tests` executed: 17 passed in 71.36s (100%). |
| *"The frontend compiles cleanly with zero TypeScript errors."* | **VERIFIED BY BUILD** | `frontend/src/` (Vite 5 + TS 5.5). | `tsc && vite build` executed: Built in 10.41s (0 errors). |

---

### Category B: Documented But Not Yet Automated (CLAIM AS ARCHITECTURAL PATTERN)

| Claim Statement | Current Real Status | How to Present Truthfully to Judges |
|---|---|---|
| *"Integration with Oracle Primavera P6"* | Standard WBS CSV/Excel import is implemented; direct Primavera P6 REST API bi-directional connector is documented in `docs/INTEGRATIONS.md`. | *"We currently import standard WBS schedule schemas exported from Primavera P6, with direct bi-directional P6 API synchronization designed for Phase 2."* |
| *"Vector database scalability with pgvector"* | Dense vector embeddings and cosine similarity are currently calculated in-memory in Python; `pgvector` indexing is documented in `docs/ARCHITECTURE.md`. | *"For thousands of activities, our in-memory vector matching executes in milliseconds. For 50,000+ activities, our architecture natively supports pre-indexed `pgvector` in PostgreSQL."* |
| *"Voice memo transcript processing"* | Database schema contains `'voice_transcript'` enum in `extractions.file_type`; audio transcription pipeline is planned. | *"Our data schema supports voice transcript ingestion, and we have roadmap integration planned with OpenAI Whisper."* |

---

### Category C: PLANNED / FUTURE ROADMAP (DO NOT CLAIM AS CURRENTLY IMPLEMENTED)

| Claim Statement | Roadmap Phase | Presentation Instruction |
|---|---|---|
| 4D BIM schedule visualizer | Phase 3 (12 Months) | Mention only on Slide 16 (Future Roadmap). |
| Native mobile Android/iOS camera OCR app | Phase 2 (6 Months) | Mention as a mobile expansion strategy. |
| Predictive machine learning delay forecasting | Phase 3 (12 Months) | State as an advanced data intelligence opportunity. |
| Multilingual automatic translation for regional Hindi DPRs | Phase 2 (3 Months) | Present as a localization feature. |

---

### Category D: DANGER ZONE — DO NOT CLAIM IN FRONT OF JUDGES

> [!CAUTION]
> The following claims are factually inaccurate, technically indefensible, or exaggerated. **NEVER make these claims in your presentation or Q&A:**

1. **DO NOT CLAIM:** *"We have a fine-tuned custom deep learning model trained from scratch."*  
   *Why:* We use the established, benchmarked `all-MiniLM-L6-v2` embedding model and OpenRouter LLMs. Claiming custom training will lead judges to ask for GPU cluster training logs, loss curves, and dataset sizes.
2. **DO NOT CLAIM:** *"Our AI is 100% autonomous and updates Primavera P6 without human review."*  
   *Why:* In contractual megaprojects, autonomous unverified schedule writes violate construction governance. OnGround's core value is **human-in-the-loop verification with deterministic confidence banding**.
3. **DO NOT CLAIM:** *"We have a live on-device mobile OCR camera scanner deployed on the Play Store."*  
   *Why:* We currently process digital PDFs, spreadsheets, and text reports on web.
4. **DO NOT CLAIM:** *"The LLM calculates its own confidence score."*  
   *Why:* Generative LLMs hallucinate confidence. We calculate confidence **deterministically on the Python backend**.
5. **DO NOT CLAIM:** *"We have processed 1 million real-world enterprise documents."*  
   *Why:* We have benchmarked our pipeline on standard multi-discipline EPC ground truth datasets.

---
*End of Claim Verification Guide*
