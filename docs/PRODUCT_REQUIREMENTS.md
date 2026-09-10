# PS 26122: Infrastructure Data Capture & Schedule-Linking
## REQUIREMENTS DOCUMENTATION

---

## 1. FUNCTIONAL REQUIREMENTS (What System Must Do)

### FR1: File Upload & Validation
```
1.1 System SHALL accept files in PDF, CSV, and TXT formats
1.2 System SHALL validate file size (min 1KB, max 10MB)
1.3 System SHALL validate file integrity (no corruption)
1.4 System SHALL reject invalid file types with error message
1.5 System SHALL support concurrent file uploads
1.6 System SHALL show upload progress to user
1.7 System SHALL store upload metadata (filename, size, timestamp)
1.8 System SHALL implement deduplication (same file uploaded twice rejected)
```

### FR2: Multi-Format Text Extraction
```
2.1 PDF: System SHALL extract text from PDF documents using PDFPlumber
2.2 CSV: System SHALL parse CSV files and convert to text format
2.3 TXT: System SHALL read plain text files as-is
2.4 System SHALL handle encoding issues (UTF-8, Latin-1, etc.)
2.5 System SHALL extract text from multi-page PDFs
2.6 System SHALL gracefully handle scanned PDFs (with OCR fallback)
2.7 System SHALL clean whitespace and normalize text
```

### FR3: LLM-Based Activity Extraction
```
3.1 System SHALL call LLM API via provider abstraction with structured prompts
3.2 System SHALL extract activity_name (string)
3.3 System SHALL extract discipline (enum: civil, piping, electrical, etc.)
3.4 System SHALL extract start_date (YYYY-MM-DD format)
3.5 System SHALL extract start_time (HH:MM format, optional)
3.6 System SHALL extract end_date (YYYY-MM-DD format, optional)
3.7 System SHALL extract end_time (HH:MM format, optional)
3.8 System SHALL extract status (enum: pending, in_progress, completed)
3.9 System SHALL assign confidence_score (float 0-1.0) to each extraction
3.10 System SHALL handle missing/null values gracefully
3.11 System SHALL parse JSON response from LLM correctly
3.12 System SHALL retry on LLM API failure (max 3 retries)
3.13 System SHALL timeout LLM calls after 30 seconds
3.14 System SHALL cache LLM results to reduce API calls
```

### FR4: Data Validation & Cleaning
```
4.1 System SHALL validate dates (not future, reasonable past dates)
4.2 System SHALL parse various date formats (15-Jan, 01/15, etc.)
4.3 System SHALL standardize all dates to YYYY-MM-DD format
4.4 System SHALL validate discipline against known list
4.5 System SHALL handle unknown disciplines gracefully (tag as 'unknown')
4.6 System SHALL validate time format (24-hour clock)
4.7 System SHALL remove duplicate activities (same activity twice)
4.8 System SHALL flag suspicious entries (impossible dates, etc.)
4.9 System SHALL reject null/empty activity_name
4.10 System SHALL merge similar activities (fuzzy deduplication)
```

### FR5: Fuzzy Schedule Matching
```
5.1 System SHALL load Primavera schedule from database
5.2 System SHALL calculate semantic similarity using sentence-transformers embeddings (see DECISION_LOG D6)
5.3 System SHALL apply discipline context to matching
5.4 System SHALL apply date proximity weighting
5.5 System SHALL calculate final match_confidence score (0-1.0)
5.6 System SHALL match activities only if score >= threshold (0.70)
5.7 System SHALL flag unmatched activities (<0.70 confidence)
5.8 System SHALL prevent duplicate matches (1 activity → 1 schedule node max)
5.9 System SHALL handle case-insensitive matching
5.10 System SHALL handle partial word matches (abbreviations)
```

### FR6: Schedule Update & Variance Calculation
```
6.1 System SHALL update actual_start_date from extraction
6.2 System SHALL update actual_end_date from extraction
6.3 System SHALL calculate variance_days (actual - planned)
6.4 System SHALL determine status based on variance:
    - EARLY_SIGNIFICANT: variance < -7
    - EARLY: variance -7 to 0
    - ON_TRACK: variance = 0
    - MINOR_DELAY: variance 1-3
    - DELAYED: variance 4-7
    - CRITICAL_DELAY: variance > 7
6.5 System SHALL generate updated schedule CSV/Excel
6.6 System SHALL export schedule in Primavera-compatible format
6.7 System SHALL preserve original schedule (create new version)
6.8 System SHALL include confidence scores in export
```

### FR7: Audit Trail & Logging
```
7.1 System SHALL log every extraction (timestamp, source, confidence)
7.2 System SHALL log every match (activity_id, schedule_id, confidence)
7.3 System SHALL log every update (old value, new value, timestamp)
7.4 System SHALL assign unique ID to each audit entry
7.5 System SHALL make audit trail immutable (no edits/deletes)
7.6 System SHALL include user_id in audit trail (system/reviewer)
7.7 System SHALL timestamp all entries in UTC
7.8 System SHALL store audit trail in database
7.9 System SHALL allow querying audit trail (filter by date, activity)
7.10 System SHALL export audit trail to CSV/JSON
```

### FR8: Dashboard & Visualization
```
8.1 System SHALL display extracted activities in table format
8.2 System SHALL show confidence scores with color indicators
8.3 System SHALL display schedule matches with confidence
8.4 System SHALL highlight unmatched items for review
8.5 System SHALL show actual vs planned in Gantt chart
8.6 System SHALL show summary statistics (total, matched %, accuracy)
8.7 System SHALL allow filtering by discipline, date, confidence
8.8 System SHALL allow sorting by any column
8.9 System SHALL display audit trail timeline
8.10 System SHALL show processing time and status
```

### FR9: Data Export
```
9.1 System SHALL export extracted activities to CSV
9.2 System SHALL export schedule matches to CSV
9.3 System SHALL export audit trail to CSV
9.4 System SHALL export updated schedule to Excel
9.5 System SHALL export all results to JSON
9.6 System SHALL preserve data formatting in exports
9.7 System SHALL generate PDF report (summary)
```

### FR10: Error Handling
```
10.1 System SHALL return meaningful error messages to users
10.2 System SHALL not crash on invalid input (graceful degradation)
10.3 System SHALL log all errors with timestamps
10.4 System SHALL retry failed operations (up to 3 times)
10.5 System SHALL have fallback for LLM failures (rule-based)
10.6 System SHALL warn on low-confidence extractions (<0.70)
10.7 System SHALL timeout long-running operations
10.8 System SHALL validate all inputs before processing
```

---

## 2. NON-FUNCTIONAL REQUIREMENTS

### NFR1: Performance
```
1.1 File upload: <5 seconds for files up to 10MB
1.2 Text extraction: <30 seconds for 50-page PDF
1.3 LLM extraction: <2 seconds for 50 activities
1.4 Fuzzy matching: <1 second for 50 activities vs 500 schedule nodes
1.5 Dashboard load: <2 seconds for 100 activities
1.6 Database query: <500ms for any single query
1.7 End-to-end processing: <60 seconds for typical document
1.8 Concurrent users: Support 10+ simultaneous users in demo
```

### NFR2: Reliability
```
2.1 System uptime: 99% (demo)
2.2 No data loss on unexpected shutdown
2.3 Graceful handling of API timeouts
2.4 Automatic retry on transient failures (3x)
2.5 Error logging for all failures
2.6 Database backup daily (post-MVP)
2.7 Recover from partial processing failures
2.8 No silent failures (user always notified)
```

### NFR3: Scalability
```
3.1 Database: Handle 1000+ activities
3.2 Matching: Handle 500+ schedule nodes
3.3 Concurrent: Process 10+ files simultaneously
3.4 Storage: <1GB for 10,000 activities + audit trail
3.5 API: Support 100+ requests/minute
3.6 Memory: Use <1GB RAM for typical workload
```

### NFR4: Usability
```
4.1 UI: Responsive design (works on desktop + tablet)
4.2 Navigation: <3 clicks to reach any feature
4.3 Learning: New user can use system without training
4.4 Accessibility: Color-blind friendly (not just red/green)
4.5 Consistency: Same UI patterns throughout
4.6 Help: Tooltips for all metrics/scores
4.7 Language: English (primary), Hindi (secondary, future)
```

### NFR5: Security
```
5.1 Input validation: All inputs sanitized
5.2 SQL injection: Parameterized queries (Supabase client SDK)
5.3 XSS prevention: React auto-escapes, no dangerousHTML
5.4 Authentication: Supabase Auth with planner/supervisor roles
5.5 Authorization: Role-based access via Supabase RLS
5.6 Data encryption: HTTPS for API calls (production)
5.7 File storage: Uploaded files not accessible publicly
5.8 API rate limiting: 100 requests/min per IP
5.9 Logging: No sensitive data in logs
5.10 Compliance: GDPR-ready (no PII collection, optional)
```

### NFR6: Compatibility
```
6.1 Browser: Chrome, Firefox, Safari (latest 2 versions)
6.2 OS: Windows, macOS, Linux
6.3 File formats: PDF (text), CSV/Excel (standard), TXT (UTF-8)
6.4 Database: Supabase Postgres
6.5 API: RESTful, JSON standard
6.6 LLM: Free-tier API via provider abstraction (OpenRouter preferred, switchable)
```

### NFR7: Maintainability
```
7.1 Code: Python/React best practices
7.2 Documentation: Inline comments for complex logic
7.3 Testing: Unit tests for core modules
7.4 Logging: Structured logging (timestamps, levels)
7.5 Configuration: Environment variables for settings
7.6 Versioning: Git for all code
7.7 Dependencies: Pinned versions in requirements.txt
```

### NFR8: Data Quality
```
8.1 Extraction accuracy: 85%+ confidence for 95% of items
8.2 Matching precision: 90%+ correct matches
8.3 Deduplication: 100% detection of duplicate submissions
8.4 Date parsing: Handle 95% of date formats
8.5 Discipline recognition: 90% of disciplines correctly identified
8.6 Null handling: Graceful for missing fields
```

---

## 3. CONSTRAINTS

### Technical Constraints
```
C1: 36-hour development time (single hackathon)
C2: Public hackathon deployment via Vercel + cloud-hosted backend (no production infrastructure)
C3: Supabase Postgres for demo and production
C4: Supabase Auth with two roles (planner, supervisor)
C5: No external data sources (use sample/synthetic data)
C6: Single project scope (not multi-site)
C7: Synchronous processing (no async jobs for MVP)
C8: No mobile native app (web-responsive only)
C9: No real-time collaboration (single user per session)
C10: Limited compute resources (single machine)
```

### Business Constraints
```
B1: Budget: Zero (hackathon, no payment)
B2: Team: 3-4 engineers (not enterprise team)
B3: Timeline: 36 continuous hours
B4: Data: Sample/synthetic only (no real project data)
B5: Support: Self-service documentation only
B6: Compliance: Demo-level (not production-grade)
B7: SLA: Best-effort (no guaranteed uptime)
```

### Environmental Constraints
```
E1: Internet: Continuous connection required (for LLM API + Supabase)
E2: Projector: May need to work with unreliable venue tech
E3: Power: May have limited power outlets
E4: Network: WiFi may be shared/unstable
E5: Hardware: Demo on laptop (not server)
E6: Software: Python 3.11+, Node 16+, modern browser
```

---

## 4. ASSUMPTIONS

### User Assumptions
```
A1: Users familiar with construction terminology
A2: Users can use browser-based software
A3: Users have internet connectivity
A4: Users can upload/download files
A5: Users read documentation (tooltips, help)
```

### Data Assumptions
```
D1: Sample schedule data in Primavera format available
D2: Sample site reports (PDF, CSV, TXT) provided or synthetic
D3: Data encoding is UTF-8 or detectable
D4: Dates follow standard formats (15-Jan, 01/15, Jan 15, etc.)
D5: Activity descriptions in English (primary language)
```

### Technical Assumptions
```
T1: Free-tier LLM API available and functional
T2: File sizes reasonable (<10MB)
T3: Files not corrupted (valid format)
T4: Database can be initialized from scratch
T5: No legacy system integration needed
T6: PDFs are searchable (not pure images)
```

### Deployment Assumptions
```
DP1: Public deployment via Vercel (frontend) + cloud-hosted FastAPI (backend)
DP2: No Kubernetes/Docker orchestration needed
DP3: Single instance sufficient (no high availability)
DP4: No CDN or caching layer needed
DP5: Supabase Postgres (no distributed DB)
```

---

## 5. DEPENDENCIES

### External Dependencies
```
E1: LLM API (free-tier, via provider abstraction) — LLM extraction
E2: sentence-transformers — Embedding-based matching
E3: PDFPlumber — PDF text extraction
E4: pandas — CSV/Excel parsing
E5: dateparser — Flexible date parsing
E6: FastAPI — Backend framework
E7: React — Frontend framework
E8: Recharts — Chart library (Gantt visualization)
E9: Supabase client SDK — Database access
E10: Pydantic — Data validation
```

### Internal Dependencies
```
I1: Database schema must be initialized before processing
I2: Schedule plan must be loaded before fuzzy matching
I3: LLM client must be initialized before extraction
I4: File parser must work before LLM extraction
I5: Validation must pass before matching
```

---

## 6. PRIORITY & MUST-HAVES

### Tier 1: CRITICAL (Must-Have for MVP)
```
P1.1: File upload (any format)
P1.2: LLM extraction with confidence scoring
P1.3: Fuzzy matching with schedule
P1.4: Schedule update
P1.5: Dashboard visualization
P1.6: Audit trail (basic)
P1.7: Error handling (graceful, no crashes)
```

### Tier 2: IMPORTANT (Nice-to-Have)
```
P2.1: Color-coded confidence indicators
P2.2: Filtering/sorting in dashboard
P2.3: CSV export
P2.4: PDF report generation
P2.5: Deduplication logic
P2.6: Advanced analytics
P2.7: Multi-language support
```

### Tier 3: NICE-TO-HAVE (Future)
```
P3.1: Mobile app
P3.2: Real-time notifications
P3.3: OCR for handwritten
P3.4: Predictive analytics
P3.5: Integration with Primavera API
P3.6: Custom user rules
P3.7: Advanced reporting
```

---

**This covers all functional + non-functional requirements. Ready for USER_PERSONAS.md?** 🚀
