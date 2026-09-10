# PS 26122: Infrastructure Data Capture & Schedule-Linking
## FEATURES DOCUMENTATION

---

## 1. CORE FEATURES

### Feature 1: Multi-Format File Upload

**Description:**
Users can upload construction site progress data in multiple formats (PDF daily reports, Excel spreadsheets, text files from scanned diaries). System automatically detects format and processes accordingly.

**User Stories:**
```
AS A site supervisor
I WANT TO upload my daily report (handwritten, scanned as PDF)
SO THAT I don't have to manually enter activities into the schedule

AS A project manager
I WANT TO upload Excel spreadsheets from different disciplines
SO THAT I can consolidate all progress data in one place

AS A planner
I WANT TO upload raw text from site diaries
SO THAT I don't lose informal progress notes
```

**Acceptance Criteria:**
```
✅ System accepts PDF files (min 50KB, max 10MB)
✅ System accepts CSV/Excel files (.csv, .xlsx)
✅ System accepts plain text files (.txt)
✅ System rejects unsupported formats with clear error message
✅ File upload progress shown to user
✅ System validates file integrity before processing
✅ Same file uploaded twice is detected (deduplication)
```

**Technical Details:**
```
Input:
- File (binary)
- File type (pdf, csv, txt)
- Optional: source (daily_report, spreadsheet, diary)

Processing:
- Validate file type & size
- Extract text (PDFPlumber for PDF, pandas for CSV, raw read for TXT)
- Clean encoding issues
- Return raw text + metadata

Output:
- Cleaned text string
- Source information
- File hash (for deduplication)
```

**MVP Implementation:**
```
UI: Simple file upload form (drag-drop + click)
Backend: FastAPI POST /api/v1/extract endpoint
Storage: Temporary filesystem for uploaded files
Processing: Synchronous (user waits for results)
```

---

### Feature 2: Intelligent Activity Extraction

**Description:**
System uses LLM (free-tier API via provider abstraction) to read messy, unstructured progress text and automatically extract structured activity data (what was done, when, by which discipline).

**User Stories:**
```
AS A site supervisor
I WANT THE SYSTEM TO automatically understand my informal report
("Spool work started Tuesday, weather delayed us 2 hours")
SO THAT I don't need to fill out rigid forms

AS A project manager
I WANT TO trust the extracted data quality
SO THAT I know which extractions need manual review

AS A planner
I WANT TO see why the system flagged certain extractions
SO THAT I can make intelligent corrections
```

**Acceptance Criteria:**
```
✅ Extracts activity name (what was done)
✅ Extracts discipline (civil, piping, electrical, etc.)
✅ Extracts start date (in YYYY-MM-DD format)
✅ Extracts start time (optional, HH:MM format)
✅ Extracts end date (optional)
✅ Extracts end time (optional)
✅ Extracts activity status (pending, in_progress, completed)
✅ Assigns confidence score (0-1.0) to each extraction
✅ Handles missing information gracefully (sets to null)
✅ Processes 50 activities in <2 seconds
```

**Technical Details:**
```
Input: Raw text (messy, informal language)

LLM Prompt:
"Extract construction activities from this report. 
 For each activity, identify:
 - Name (what was done)
 - Discipline (civil/piping/electrical/etc)
 - Start date (YYYY-MM-DD)
 - Status (pending/in_progress/completed)
 Return ONLY valid JSON, no explanation."

Output:
{
  "activities": [
    {
      "activity_name": "Spool fabrication Line 24-XX",
      "discipline": "piping",
      "start_date": "2024-01-15",
      "start_time": "12:30",
      "end_date": null,
      "status": "in_progress",
      "confidence": 0.94
    }
  ]
}
```

**Confidence Scoring Logic:**
```
Base: 0.5
+ 0.3 if start_date valid
+ 0.25 if discipline recognized
+ 0.2 if activity_name detailed (>20 chars)
+ 0.1 if start_time provided
= Final confidence (clamped to 0-1.0)

Example:
- Valid date (+0.3)
- Piping discipline (+0.25)
- Good description (+0.2)
- No time provided (0)
- Total: 0.75
```

**MVP Implementation:**
```
LLM: Free-tier API via provider abstraction (see DECISION_LOG.md D11)
Caching: Store results to reduce API calls
Fallback: Rule-based extraction if LLM fails
```

---

### Feature 3: Fuzzy Schedule Linking

**Description:**
System matches extracted activities to the planned schedule using fuzzy string matching + context (discipline, dates). Even if terminology differs, system finds correct schedule node.

**User Stories:**
```
AS A project manager
I WANT THE SYSTEM TO understand "Spool erection" = "Erect Line 24-XX"
SO THAT I don't have to manually link each activity to the schedule

AS A planner
I WANT TO see the confidence level of each match
SO THAT I know which matches to trust vs verify manually

AS A scheduler
I WANT unmatched activities flagged immediately
SO THAT I can update the schedule if new work appeared
```

**Acceptance Criteria:**
```
✅ Matches activities with 70%+ similarity to schedule nodes
✅ Handles terminology differences ("Spool" vs "Erect")
✅ Uses discipline as context (piping can only match piping activities)
✅ Considers date proximity (matches within reasonable date range)
✅ Produces confidence score for each match
✅ Flags unmatched activities for manual review
✅ Deduplicates duplicate matches (1 activity → 1 schedule node max)
✅ Processes 50 activities in <1 second
```

**Technical Details:**
```
Algorithm:
FOR EACH extracted activity:
  FOR EACH schedule node:
    - Calculate embedding cosine similarity (sentence-transformers)
    - Apply discipline filter (+/- penalty)
    - Apply date proximity boost
    - Final score = weighted combination
    
  IF score >= threshold (0.70):
    Link activity to schedule node (match)
  ELSE:
    Flag as unmatched (for review)

Matching Score Calculation:
score = (string_similarity * 0.7) + 
        (activity_confidence * 0.2) + 
        (date_proximity_boost * 0.1) - 
        (discipline_mismatch_penalty)
```

**Threshold Tuning:**
```
0.70 = Most matches accepted, some false positives
0.75 = Balanced (recommended for MVP)
0.80 = Conservative, higher precision, lower recall
```

**MVP Implementation:**
```
Algorithm: sentence-transformers all-MiniLM-L6-v2 embeddings + cosine similarity (see DECISION_LOG.md D6)
Threshold: 0.70 (can be tuned post-demo)
Fallback: Manual review for <0.70 matches
```

---

### Feature 4: Auto-Update Schedule

**Description:**
System automatically updates the baseline schedule with actual activity dates, calculates variance (early/on-time/delayed), and creates audit trail.

**User Stories:**
```
AS A project manager
I WANT THE SCHEDULE TO automatically update with actual dates
SO THAT I always see current progress without manual updates

AS A planner
I WANT TO see variance vs plan (early/delayed)
SO THAT I can identify bottlenecks and resource issues

AS A controller
I WANT complete audit trail of all changes
SO THAT I can trace who said what, when
```

**Acceptance Criteria:**
```
✅ Updates actual start/end dates from extractions
✅ Calculates variance (actual vs planned, in days)
✅ Determines status (early/on-time/minor delay/critical delay)
✅ Generates updated schedule CSV/Excel
✅ Creates audit entry for each update (source, confidence, timestamp)
✅ Handles multiple extractions of same activity (keeps latest)
✅ Exports updated schedule in Primavera-compatible format
```

**Technical Details:**
```
Update Logic:
FOR EACH matched activity:
  schedule_node.actual_start_date = activity.start_date
  schedule_node.actual_end_date = activity.end_date
  schedule_node.variance_days = days_between(actual, planned)
  schedule_node.status = DETERMINE_STATUS(variance)
  
  AUDIT_LOG:
    - activity_id
    - schedule_node_id
    - old_actual_date
    - new_actual_date
    - confidence
    - timestamp
    - source_file
```

**Status Determination:**
```
variance < -7 days   → EARLY_SIGNIFICANT
variance -7 to 0     → EARLY
variance 0           → ON_TRACK
variance 1 to 3      → MINOR_DELAY
variance 4 to 7      → DELAYED
variance > 7         → CRITICAL_DELAY
```

**MVP Implementation:**
```
Output Format: CSV (easily importable to Excel)
Update Method: File-based (not live Primavera integration)
Audit Trail: Supabase AUDIT_TRAIL table
```

---

### Feature 5: Interactive Dashboard

**Description:**
Real-time dashboard showing all extracted activities, matched results, confidence scores, and actual vs planned comparison.

**User Stories:**
```
AS A project manager
I WANT TO see all extracted activities in a clean table
SO THAT I can review what was captured

AS A planner
I WANT TO see actual vs planned in a Gantt chart
SO THAT I can visualize progress and delays

AS A supervisor
I WANT TO see which activities need manual review
SO THAT I can prioritize my QA work
```

**Acceptance Criteria:**
```
✅ Shows extracted activities table (name, discipline, date, confidence)
✅ Shows schedule matches with confidence scores
✅ Shows unmatched items flagged for review
✅ Shows actual vs planned timeline (Gantt chart)
✅ Shows audit trail (who/what/when)
✅ Summary statistics (total extracted, matched %, accuracy)
✅ All data searchable/filterable
✅ Export results to CSV/JSON
```

**Dashboard Sections:**

#### Section 1: Upload & Summary
```
┌─────────────────────────────────┐
│ Upload File: [Choose File]      │
│ Processing...                   │
├─────────────────────────────────┤
│ RESULTS SUMMARY                 │
│ ├─ Total Activities: 47         │
│ ├─ High Confidence (85%+): 41   │
│ ├─ Medium Confidence (70-85%): 4│
│ ├─ Flagged for Review: 2        │
│ └─ Processing Time: 2.3 sec     │
└─────────────────────────────────┘
```

#### Section 2: Extracted Activities
```
┌────────────────────────────────────────────────┐
│ EXTRACTED ACTIVITIES                           │
├──────────┬──────────┬────────┬──────────────┤
│Activity  │Discipline│Date    │Confidence    │
├──────────┼──────────┼────────┼──────────────┤
│Spool fab │Piping    │15-Jan  │94% 🟢        │
│Erect str │Civil     │18-Jan  │88% 🟢        │
│Cable lay │Elect     │20-Jan  │72% 🟡        │
└──────────┴──────────┴────────┴──────────────┘
```

#### Section 3: Schedule Matches
```
┌────────────────────────────────────────────────┐
│ SCHEDULE LINKS                                 │
├──────────┬─────────────┬──────────────────┤
│Extracted │Matched To   │Match Conf │Status │
├──────────┼─────────────┼──────────────────┤
│Spool fab │Erect Line   │87%    │3 days early│
│Erect str │Struct erect │91%    │On time     │
│Cable lay │Install elec │72%    │2 days late │
└──────────┴─────────────┴──────────────────┘
```

#### Section 4: Actual vs Planned
```
GANTT TIMELINE
Planned:  |========|    (Jan 18-20)
Actual:   |======| (Jan 15-17, 3 days early)

[Grouped by discipline with different colors]
```

#### Section 5: Unmatched Items
```
┌────────────────────────────────────────────────┐
│ NEEDS MANUAL REVIEW                            │
├──────────┬────────────────┬──────────────────┤
│Activity  │Reason          │Action            │
├──────────┼────────────────┼──────────────────┤
│Line 24   │Low confidence  │Review & match    │
│Inspection│No match found  │Add to schedule?  │
└──────────┴────────────────┴──────────────────┘
```

#### Section 6: Audit Trail
```
┌──────────────────────────────────────────┐
│ AUDIT TRAIL                              │
├────────┬────────────┬──────┬────────────┤
│Time    │Activity    │Source│Confidence  │
├────────┼────────────┼──────┼────────────┤
│10:23 AM│Spool fab   │report│94%         │
│10:23 AM│Erect str   │report│88%         │
│10:24 AM│Cable lay   │sheet │72%         │
└────────┴────────────┴──────┴────────────┘
```

**MVP Implementation:**
```
Frontend: React + Tailwind CSS
Charts: Recharts (Gantt-like timeline)
Tables: React Table component
Export: CSV/JSON download
```

---

### Feature 6: Confidence Scoring & Transparency

**Description:**
Every extraction, match, and update has a confidence score. Users see exactly how confident the system is about each piece of data.

**User Stories:**
```
AS A project manager
I WANT TO trust the data quality
SO THAT I make decisions based on high-confidence information

AS A supervisor
I WANT TO know which items need verification
SO THAT I don't waste time on obvious matches

AS AN AUDITOR
I WANT TO see confidence scores
SO THAT I can trace data quality issues
```

**Acceptance Criteria:**
```
✅ Extraction has confidence score (0-1.0)
✅ Schedule match has confidence score (0-1.0)
✅ Confidence visible on all screens
✅ Low confidence (<0.70) highlighted/flagged
✅ Confidence explained in tooltip/help
✅ Audit trail includes confidence for each step
✅ System doesn't hide low-confidence results (transparent)
```

**Confidence Display:**
```
94% 🟢 = High confidence (green)
85% 🟢 = Good confidence (green)
72% 🟡 = Medium confidence (yellow, review recommended)
60% 🔴 = Low confidence (red, needs manual verification)
45% 🔴 = Very low confidence (red, probably reject)
```

**MVP Implementation:**
```
Calculation: Multi-factor scoring (detailed in LLD)
Display: Percentage + color indicator + tooltip
Export: Included in CSV export
```

---

### Feature 7: Audit Trail & Traceability

**Description:**
Complete record of every extraction, match, and update. Who did what, when, from what source, with what confidence.

**User Stories:**
```
AS A project controller
I WANT complete audit trail
SO THAT I can trace any data change

AS A compliance officer
I WANT to verify data integrity
SO THAT I can certify project accuracy

AS A investigator (post-project)
I WANT to understand what happened
SO THAT I can improve future projects
```

**Acceptance Criteria:**
```
✅ Extraction logged (source file, timestamp, confidence)
✅ Matching logged (match confidence, algorithm version)
✅ Updates logged (old value, new value, variance)
✅ Manual reviews logged (reviewer name, action, timestamp)
✅ All timestamps in UTC
✅ Audit trail immutable (can't be edited)
✅ Audit trail exportable (CSV/JSON)
✅ Query audit trail (filter by date, activity, user)
```

**Audit Entry Structure:**
```
{
  "timestamp": "2024-01-15T10:23:45Z",
  "action": "extraction",
  "source_file": "daily_report_2024-01-15.pdf",
  "activity_name": "Spool fabrication",
  "extraction_confidence": 0.94,
  "matching_confidence": 0.87,
  "schedule_node_matched": "L5_PIPE_24XX_001",
  "user_id": "system",  // or reviewer name
  "notes": "Auto-extracted from daily report"
}
```

**MVP Implementation:**
```
Storage: Supabase AUDIT_TRAIL table
Query: REST API endpoint /api/v1/audit-trail
Export: CSV download
```

---

## 2. SECONDARY FEATURES (if time permits)

### Secondary Feature 1: Multi-Discipline Analytics
```
Show statistics by discipline:
- Piping: 15 activities extracted, 14 matched (93%)
- Civil: 18 activities extracted, 16 matched (89%)
- Electrical: 14 activities extracted, 12 matched (86%)
```

### Secondary Feature 2: Delay Warnings
```
Alert if:
- Activity delayed by >3 days
- Multiple activities delayed (critical path impact)
- Recommend "increase resources" if certain discipline consistently delayed
```

### Secondary Feature 3: Historical Search
```
"Show me all spool erection activities from past projects"
"What's the average duration for Line 24 activities?"
(Requires multiple projects in DB)
```

---

## 3. FUTURE FEATURES (Post-Hackathon)

```
1. OCR for handwritten documents
2. Live Primavera P6 API integration
3. Predictive delay forecasting (ML)
4. Resource optimization recommendations
5. Mobile app (native iOS/Android)
6. Multi-language support
7. Integration with Slack/Teams for notifications
8. Advanced reporting (scheduled email reports)
9. Custom rules (define discipline-specific extraction rules)
10. Cost analysis (link delays to cost impact)
```

---

**This covers all features. Ready for REQUIREMENTS.md next?** 🚀
