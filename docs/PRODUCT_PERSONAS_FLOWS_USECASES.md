# PS 26122: Infrastructure Data Capture & Schedule-Linking
## USER PERSONAS, FLOWS & USE CASES

---

# PART 1: USER PERSONAS

## Persona 1: Raj Kumar — Site Supervisor

**Demographics:**
- Age: 35
- Experience: 12 years in construction
- Education: Diploma (Civil Engineering)
- Tech Savviness: Medium (uses Excel, WhatsApp)

**Background:**
Raj manages a large infrastructure project with 6 disciplines (civil, piping, electrical, instrumentation, HSE, mechanical). Every day, he coordinates with supervisors from each discipline, collects progress updates, and manually enters them into the schedule. This takes 2-3 hours daily.

**Pain Points:**
- ❌ Manual data entry is tedious and error-prone
- ❌ Supervisors give updates in different formats (verbal, WhatsApp, handwritten)
- ❌ By the time he enters data, it's already 1-2 days old
- ❌ Managers keep asking "when will X be done?" but data is stale
- ❌ No way to prove "this is what actually happened"

**Goals:**
- ✅ Reduce time spent on data entry (should be 30 mins, not 2-3 hours)
- ✅ Trust the accuracy of extracted data
- ✅ Have transparency (see confidence scores, know what needs review)
- ✅ Build historical record for future projects

**Tech Stack Knowledge:**
- Excel (good)
- Primavera (basic)
- PDF (reads daily reports)
- Zero programming

**Quote:**
> "If I can just upload the daily reports and the schedule updates itself, I'd have so much more time to actually manage the site instead of typing."

**Needs from System:**
1. Simple file upload (photo of handwritten report, Excel file, PDF)
2. Clear indication of what needs review (confidence scores)
3. No complex UI (straightforward dashboard)
4. Works on laptop (not a smartphone only)

---

## Persona 2: Priya Patel — Project Manager

**Demographics:**
- Age: 42
- Experience: 18 years in project management
- Education: MBA, PMP certified
- Tech Savviness: High (uses all PM tools)

**Background:**
Priya oversees 5 large construction projects simultaneously. She needs real-time visibility into progress to make resource allocation decisions. Currently, she gets progress updates every 3 days through manual consolidation. By then, decisions are outdated.

**Pain Points:**
- ❌ Progress data is 3-7 days late (by then, damage is done)
- ❌ Different sites report in different formats (no consistency)
- ❌ Can't identify delays early enough to react
- ❌ No historical data to predict future delays
- ❌ Manual process doesn't scale to 5+ projects

**Goals:**
- ✅ Real-time progress visibility (same-day updates)
- ✅ Automatic variance calculation (know which activities are delayed)
- ✅ Early warning system (flag delays before critical)
- ✅ Cross-site analytics (compare performance)
- ✅ Predictive insights (if trend continues, when will we complete?)

**Tech Stack Knowledge:**
- Primavera (expert)
- Excel (expert)
- Dashboards (loves metrics)
- PowerPoint (executive presentations)
- Python (aware but doesn't code)

**Quote:**
> "If I could see 'this site is trending 5 days late' on Day 3, I'd shift 10 more workers there immediately. But by Day 5 when I get the data, it's too late."

**Needs from System:**
1. Real-time dashboard (not 3-day delay)
2. Confidence scores (trust the data before acting)
3. Trend analysis (help predict final completion date)
4. Integration with existing PM tools
5. Mobile access (check from site)

---

## Persona 3: Akshay Singh — Planner/Scheduler

**Demographics:**
- Age: 38
- Experience: 14 years in planning
- Education: B.Tech (Civil), advanced planning certification
- Tech Savviness: Medium-High (Excel power user, Primavera intermediate)

**Background:**
Akshay creates and maintains the baseline schedule (L1-L6) for infrastructure projects. He needs actual data to update the schedule, identify bottlenecks, and optimize resource allocation. Currently, he spends 30% of his time reconciling actual data with the plan (manually).

**Pain Points:**
- ❌ Actual data inconsistent (different formats, terminology)
- ❌ Manual reconciliation is 8+ hours per week
- ❌ Can't identify patterns (which activities always delay? why?)
- ❌ Historical data lost after project closure
- ❌ No way to benchmark against similar projects

**Goals:**
- ✅ Quick data reconciliation (30 mins instead of 8 hours)
- ✅ Identify bottlenecks automatically
- ✅ Build historical database (learn from past projects)
- ✅ Predictive scheduling (based on historical patterns)
- ✅ Resource optimization recommendations

**Tech Stack Knowledge:**
- Primavera (expert)
- Excel (expert)
- Python/SQL (basic, willing to learn)
- Databases (understands concepts)
- Statistical analysis (wants but doesn't have tools)

**Quote:**
> "If I knew 'piping always delays by 3 days, so I should schedule it 4 days early,' I'd save so much time and deliver projects on time consistently."

**Needs from System:**
1. Automatic reconciliation (actual vs planned)
2. Confidence scores + audit trail (trust the historical data)
3. Analytics (bottleneck identification)
4. Export to Primavera format
5. Ability to save historical patterns for future projects

---

## Persona 4: Vikram Prabhu — Government Officer (Secondary User)

**Demographics:**
- Age: 45
- Experience: 20 years in government oversight
- Education: IAS officer, infrastructure background
- Tech Savviness: Low-Medium

**Background:**
Vikram oversees 20+ construction projects for state government. He needs visibility into progress to identify stalled projects and intervene early. Currently, he relies on monthly reports (very late).

**Pain Points:**
- ❌ Monthly reports (2+ months delay)
- ❌ No standardized data format (different agencies report differently)
- ❌ Can't cross-compare performance (which contractor is best?)
- ❌ Public accountability (citizens ask when road will be ready, he doesn't know)

**Goals:**
- ✅ Real-time dashboard of all 20 projects
- ✅ Early warning for stalled projects
- ✅ Public dashboard (transparency)
- ✅ Performance comparison (which contractor is reliable?)
- ✅ Automated alerts (escalate issues)

**Tech Stack Knowledge:**
- Excel (basic)
- Web portals (basic)
- Email (expert)
- Zero technical skills

**Quote:**
> "I need to tell the CM 'this road will be ready on date X with 95% confidence,' not 'we don't know, probably next month.'"

**Needs from System:**
1. Government-grade reporting (certifiable, auditable)
2. Public transparency dashboard
3. Mobile-friendly (check from field)
4. Alerts for delays
5. Annual performance reports (PDF, shareable)

---

# PART 2: USER FLOWS

## Flow 1: Happy Path (Site Supervisor — Daily Use)

```
START
  ↓
1. Raj opens browser, goes to dashboard
  ↓
2. Clicks "Upload Daily Report"
  ↓
3. Selects PDF (daily report from piping supervisor)
  ↓
4. System processes (2-3 seconds)
  ↓
5. Results displayed:
   - 15 activities extracted
   - 14 matched to schedule (93%)
   - 1 needs manual review (low confidence)
  ↓
6. Raj glances at results, clicks "Approve"
  ↓
7. Schedule automatically updated
  ↓
8. Dashboard shows progress (actual vs planned)
  ↓
9. Raj sends WhatsApp to project manager:
   "Progress updated, on track. Piping 1 day ahead."
  ↓
END

Time spent: 5 minutes (vs 2-3 hours manually)
```

---

## Flow 2: Problem Path (Supervisor — Unmatched Item)

```
START
  ↓
1. Raj uploads spreadsheet from electrical team
  ↓
2. System processes
  ↓
3. Results show:
   - 12 activities extracted
   - 10 matched
   - 2 flagged "needs review" (low confidence)
  ↓
4. Raj clicks on flagged activity: "Cable tray installation, 20-Jan"
  ↓
5. System suggests matches:
   - "Install cable tray" (Schedule: Jan 22-23) - 65% match
   - "Electrical installation" (Schedule: Jan 20-24) - 58% match
  ↓
6. Raj confirms: "This is 'Install cable tray', but it started on 20-Jan, not 22-Jan"
  ↓
7. System updates:
   - Confidence increased (user confirmed)
   - Audit trail records: "Raj confirmed on 15-Jan at 10:23 AM"
   - Schedule updated with actual date
  ↓
8. Raj clicks "Save", dashboard refreshed
  ↓
9. Manager sees: "Electrical 2 days ahead of schedule"
  ↓
END

Time spent: 3 minutes for this correction
```

---

## Flow 3: Manager Path (Priya — Decision Making)

```
START
  ↓
1. Priya opens dashboard (she does this daily at 9 AM)
  ↓
2. Dashboard shows all 5 projects:
   - Project A: 92% complete, on-time (green)
   - Project B: 78% complete, 3 days delayed (red)
   - Project C: 85% complete, on-time (green)
   - Project D: 60% complete, 1 day ahead (blue)
   - Project E: 88% complete, 5 days delayed (red)
  ↓
3. Priya clicks on Project B (3 days delayed)
  ↓
4. Detail view shows:
   - Critical path: Piping delayed by 5 days (root cause)
   - Electrical: on-time
   - Civil: on-time
  ↓
5. Priya's insight:
   "If piping delay continues 2 more days, will compress finish timeline.
    Need to add resources NOW (not 3 days from now)"
  ↓
6. Priya sends alert to contractor:
   "Add 5 piping workers from today. Confident: 94%. Data: automated extraction."
  ↓
7. 48 hours later: Piping activity catches up
  ↓
8. Priya notes: "Early intervention saved 2 weeks of delay"
  ↓
9. Adds to "best practices": "Monitor piping risk early"
  ↓
END

Value: Early warning + data confidence → Faster decision → Time/cost saved
```

---

## Flow 4: Planner Path (Akshay — Schedule Analysis)

```
START
  ↓
1. Akshay runs month-end analysis (30th of each month)
  ↓
2. System generates report:
   - "January actual vs planned comparison"
   - Shows all 50+ activities and their variance
  ↓
3. Akshay analyzes:
   - Piping activities: avg 3.2 days late
   - Civil activities: avg 0.5 days late
   - Electrical: avg 1.1 days late
  ↓
4. Akshay exports historical data:
   - 300+ activities from past 3 projects
   - Trends: piping always delays, electrical always on-time
  ↓
5. Akshay updates scheduling rules:
   - "For piping activities, add 4-day buffer"
   - "For electrical, tight schedule is OK"
  ↓
6. Next project: Akshay schedules piping 4 days early
  ↓
7. Project completes on-time (piping no longer critical)
  ↓
8. Akshay documents: "Piping delay pattern + mitigation strategy"
  ↓
END

Value: Pattern recognition → Predictive scheduling → Consistent on-time delivery
```

---

# PART 3: USE CASES

## Use Case 1: Daily Progress Tracking (Supervisor)

**Actor:** Site Supervisor (Raj)
**Trigger:** End of work day (5 PM)
**Preconditions:** System is available, today's report is ready

**Main Flow:**
1. Supervisor prepares daily report (informal: PDF or Excel)
2. Logs into system
3. Uploads daily report
4. System processes (2-3 seconds)
5. Reviews extracted activities
6. Confirms all matches (or corrects low-confidence ones)
7. Clicks "Save & Send"
8. System updates schedule
9. Manager receives notification: "Daily update complete"

**Postconditions:** 
- Schedule updated with actual dates
- Audit trail recorded
- Manager can see progress by 5:30 PM (same day)

**Alternate Flow (Unmatched Item):**
- If activity doesn't match schedule node:
  - System flags for review
  - Supervisor manually matches (2-3 minutes)
  - System confirms and updates

**Expected Outcome:**
- 2-3 hour task done in 5-10 minutes
- Zero data-entry errors
- Manager has real-time visibility

---

## Use Case 2: Delay Detection & Alert (Manager)

**Actor:** Project Manager (Priya)
**Trigger:** Daily dashboard review (9 AM)
**Preconditions:** Previous day's data already processed, schedule updated

**Main Flow:**
1. Manager opens dashboard
2. Scans all projects for red flags (delays)
3. Spots "Project B: 3 days delayed"
4. Clicks to drill down
5. System shows: "Piping critical path 5 days late"
6. Manager confirms confidence: "94% confidence" (high)
7. Manager decides: "Add 5 workers to piping team"
8. Manager sends alert to contractor (email/WhatsApp)
9. System logs: "Manager decision + reasoning" (optional)

**Postconditions:**
- Resources reallocated
- Piping team notified
- Alert logged for audit

**Expected Outcome:**
- Early intervention (catch delays at Day 3, not Day 10)
- Confidence in data enables quick decision
- Risk mitigated before compounding

---

## Use Case 3: Schedule Reconciliation (Planner)

**Actor:** Planner/Scheduler (Akshay)
**Trigger:** Month-end (30th or 31st)
**Preconditions:** All month's daily updates processed, data validated

**Main Flow:**
1. Planner requests "Month-end reconciliation report"
2. System generates:
   - Actual vs planned comparison
   - Variance by discipline
   - Confidence summary
   - Trend analysis
3. Planner exports to Excel for detailed analysis
4. Planner identifies patterns:
   - "Piping consistently 3+ days late"
   - "Electrical always on-time"
5. Planner documents "Scheduling rules for next project"
6. Planner updates schedule template with lessons learned
7. System archives historical data (searchable)

**Postconditions:**
- Historical database updated
- Scheduling rules refined
- Next project benefits from lessons

**Expected Outcome:**
- Patterns identified automatically (vs manual analysis taking 8 hours)
- Data confidence enables trust in patterns
- Continuous improvement for future projects

---

## Use Case 4: Audit & Compliance (Government Officer)

**Actor:** Government Officer (Vikram)
**Trigger:** Monthly/quarterly oversight review
**Preconditions:** All contractor data submitted, system has validated

**Main Flow:**
1. Officer opens "Government dashboard"
2. Sees all 20 infrastructure projects
3. Scans for stalled projects (red flags)
4. Spots "Road Project X: Not progressing"
5. System shows audit trail:
   - "No daily updates submitted in 3 days"
   - Last update: 10 days ago
   - Reason: Contractor not submitting reports
6. Officer calls contractor: "Why no updates? What's the delay?"
7. Contractor responds with documents
8. Officer uploads new reports to system
9. System processes and updates
10. Officer confirms data completeness
11. Generates compliance report (PDF) with signature
12. System records: "Officer reviewed, data certified"

**Postconditions:**
- Audit trail complete
- Data certified for public disclosure
- Accountability established

**Expected Outcome:**
- Government has confidence in data (auditable)
- Public can see certified progress (transparency)
- Contractors motivated to submit real-time updates (oversight)

---

## Use Case 5: System Error Handling (Any User)

**Actor:** Any user
**Trigger:** Unexpected error during processing
**Preconditions:** User uploaded file, system started processing

**Main Flow:**
1. User uploads file
2. System begins processing
3. Error occurs (e.g., LLM API timeout)
4. System catches error and shows user:
   "Processing encountered an issue. Retrying..."
5. System retries (up to 3x)
6. If still fails:
   "Processing failed. Please try again or use fallback."
7. User can:
   a. Retry (wait for retry)
   b. Switch to fallback (rule-based extraction, lower accuracy)
   c. Contact support (email)
8. System logs error with full context (for debugging)

**Postconditions:**
- No data loss
- User informed of error
- Error logged for analysis
- System recovers gracefully

**Expected Outcome:**
- User doesn't lose work
- System doesn't crash
- Developers can debug later

---

**All personas, flows, and use cases documented. Ready to present to team!** 🚀
