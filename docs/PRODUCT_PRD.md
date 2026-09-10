# PS 26122: Infrastructure Data Capture & Schedule-Linking
## PRODUCT REQUIREMENTS DOCUMENT (PRD)

---

## 1. EXECUTIVE SUMMARY

### Problem Statement
Construction sites in India generate progress data across 5-6 disciplines in 5-6 different formats (daily reports, spreadsheets, scanned diaries, supervisor texts, Primavera exports). None of this is automatically linked back to the planned L5/L6 activity IDs in the schedule.

**Result:**
- Actual progress data arrives 3-7 days late
- Manual reconciliation with schedule takes 8+ hours per week
- Downstream analytics inherit garbage data
- After project ends, knowledge is lost (not captured structurally)

**Cost to Industry:** ₹10,000+ crore annually in construction delays (India)

### Vision
Transform construction site progress tracking from **manual, fragmented, error-prone processes** to **automated, unified, real-time intelligent system** that enables data-driven project management and institutional knowledge building.

### Mission
Enable construction managers, site supervisors, and planners to automatically capture, standardize, link, and track project progress data in real-time, reducing delays by 15-20% and saving ₹500+ lakh per large project annually.

---

## 2. PRODUCT OVERVIEW

### Product Name
**Infrastructure Progress Intelligence System (IPIS)**

### Product Type
B2B SaaS (Software-as-a-Service) - MVP for 36-hour hackathon, designed for production scale

### Target Users
- **Primary:** Site Supervisors, Project Managers, Planners at large construction projects
- **Secondary:** Government agencies overseeing infrastructure, Contractors managing multiple sites
- **Tertiary:** Industry consultants, Academic researchers studying construction delays

### Key Value Propositions
```
FOR SITE SUPERVISOR:
✅ No more manual data entry (saves 2 hrs/day)
✅ Confidence scores show data quality
✅ Instant feedback on what needs manual review

FOR PROJECT MANAGER:
✅ Real-time progress visibility (no 3-day delay)
✅ Automatic vs planned comparison
✅ Early warning for delays (before they compound)

FOR PLANNER:
✅ Unified view across all disciplines
✅ Historical data for pattern analysis
✅ Basis for predictive analytics & resource optimization
```

---

## 3. PRODUCT GOALS

### OKR-1: Reduce Manual Data Entry Time
```
Objective: Decrease time spent on progress data capture
Key Result 1: 80% of daily reports processed automatically in <2 seconds
Key Result 2: Achieve 85%+ matching accuracy between extracted and scheduled activities
Key Result 3: Flag <5% of activities for manual review
```

### OKR-2: Improve Schedule Visibility
```
Objective: Enable real-time progress tracking
Key Result 1: 90% of site data linked to schedule within 24 hours
Key Result 2: Managers receive progress updates same-day (not 3 days later)
Key Result 3: Dashboard shows actual vs planned with confidence scores
```

### OKR-3: Build Institutional Knowledge
```
Objective: Create searchable repository of actual project data
Key Result 1: System stores 1000+ historical activities with full traceability
Key Result 2: Planners can query past projects ("Show me spool erection activities")
Key Result 3: Enable predictive scheduling based on historical data
```

---

## 4. SCOPE (MVP for 36-hr Hackathon)

### IN SCOPE ✅
```
1. Multi-format input processing
   - Daily progress reports (PDF/text)
   - Discipline-wise spreadsheets (CSV/Excel)
   - Scanned site diary text (pre-transcribed)

2. LLM-based extraction
   - Activity name, discipline, dates, times
   - Confidence scoring per extraction
   - Handle messy, informal language

3. Fuzzy matching to schedule
   - Link extracted activities to L5/L6 plan nodes
   - Handle terminology differences
   - Calculate confidence scores

4. Auto-update schedule
   - Update actual start/end dates
   - Calculate variance (early/on-time/delayed)
   - Generate updated schedule CSV

5. Dashboard visualization
   - Extracted activities table
   - Schedule matches + confidence
   - Actual vs planned Gantt chart
   - Unmatched items (for review)
   - Audit trail (who/what/when)

6. Real-time alerts
   - Flag unmatched items
   - Show low-confidence extractions
   - Highlight schedule mismatches
```

### OUT OF SCOPE ❌
```
1. Image OCR (for handwritten documents)
   - Assume diary already transcribed
   - Can add post-MVP

2. Live Primavera API integration
   - Using mock schedule update
   - Can add post-MVP

3. Mobile app (MVP is web only)
   - Mobile-responsive design included
   - Native app can come later

4. Real-time collaborative editing
   - Not needed for MVP demo
   - Can add for production

5. Deployment infrastructure
   - Hackathon demo via Vercel + cloud-hosted backend
   - Production deployment (AWS/GCP) is post-MVP

6. Enterprise user authentication
   - MVP uses Supabase Auth with two roles (planner/supervisor) per DECISION_LOG D9
   - Enterprise SSO / fine-grained permissions post-MVP

7. IP management, patent filing
   - Out of scope for hackathon
   - Business layer post-MVP
```

---

## 5. SUCCESS METRICS

### Technical Metrics
```
1. Extraction Accuracy
   - Target: 85%+ confidence for 95% of activities
   - Measure: Average confidence score per extraction
   - Data: Sample 50 realistic inputs

2. Matching Precision
   - Target: 90%+ of activities matched correctly
   - Measure: Correct matches / total matches
   - Data: Compare system output vs manual verification

3. Processing Speed
   - Target: <2 seconds to process 50 activities
   - Measure: Time from upload to results ready
   - Data: 10 different input files

4. Low False Positives
   - Target: <5% unmatched or mismatched
   - Measure: Manual review items / total items
   - Data: Full test suite

5. System Reliability
   - Target: 99% uptime (demo)
   - Measure: No crashes, graceful error handling
   - Data: 2-hour continuous demo
```

### Business Metrics
```
1. Time Saved Per Project
   - Before: 8 hours/week manual reconciliation
   - After: 30 minutes/week system review
   - Saving: 7.5 hours/week = 390 hours/year

2. Cost Savings Per Site
   - Labor cost: ₹5,000/hour × 390 hours = ₹19.5 lakh/year
   - Additional savings from faster decisions: ₹30 lakh/year
   - Total: ₹50 lakh/year per site

3. Delay Reduction
   - Current: 15-20% projects delayed
   - Target: 5-8% projects delayed
   - Impact: ₹10,000 crore × 10% = ₹1,000 crore annual savings for India

4. Adoption Rate (Post-MVP)
   - Year 1: 50 large construction projects
   - Year 2: 200 projects
   - Year 3: 1000+ projects
```

### User Satisfaction Metrics
```
1. NPS (Net Promoter Score)
   - Target: 50+ (excellent for B2B software)
   - Survey: Post-demo questionnaire

2. Feature Adoption
   - Target: 90% use all 3 main features
   - Measure: Feature usage logs

3. Support Ticket Volume
   - Target: <1 ticket per 10 users/month
   - Measure: Support queue

4. Time-to-Value
   - Target: User sees first result within 5 minutes
   - Measure: Time from login to first successful extraction
```

---

## 6. PRODUCT ROADMAP

### Phase 1: MVP (36-hour Hackathon) ✅
```
Core features:
- File upload (multi-format)
- LLM extraction
- Fuzzy matching
- Schedule update
- Dashboard
- Audit trail

Target: Working demo, 85% accuracy, judges impressed
```

### Phase 2: Closed Beta (Months 1-3 Post-Hackathon)
```
Additions:
- OCR for handwritten documents
- Live Primavera API integration
- Multi-site dashboard
- Basic analytics (trends, patterns)
- Email alerts for delays
- Mobile-responsive design polish
- User authentication + role-based access
```

### Phase 3: Open Beta (Months 3-6)
```
Additions:
- Predictive analytics (ML model for delay forecasting)
- Resource optimization recommendations
- Integration with project management tools (Asana, Monday.com)
- Advanced reporting (PDF export, scheduled reports)
- Institutional memory search
- Document versioning
```

### Phase 4: Production (Months 6-12)
```
Additions:
- Enterprise deployment options
- Advanced security (encryption, compliance)
- Multi-language support
- Custom rule configuration
- API for third-party integrations
- Training platform, documentation
- Professional services
```

---

## 7. ASSUMPTIONS & CONSTRAINTS

### Assumptions
```
1. Sample schedule data available (Primavera format)
2. Sample site data provided (daily reports, spreadsheets)
3. LLM API available and functional (free-tier provider)
4. Internet connectivity stable during demo
5. Users familiar with construction terminology
6. Feedback available during/after demo
```

### Constraints
```
1. 36-hour time limit
2. No deployment infrastructure setup
3. No production-grade authentication/security
4. No real historical data (using synthetic samples)
5. Single-project scope (not multi-site)
6. MVP features only (no advanced analytics)
7. Demo machine constraints (Supabase Postgres, not distributed DB)
```

---

## 8. RISKS & MITIGATION

### Technical Risks
```
Risk 1: LLM API quota exhausted or free-tier unavailable
  Impact: Demo system becomes non-functional
  Mitigation: Cache results, have fallback provider, reserve quota, provider abstraction enables switching

Risk 2: Fuzzy matching accuracy lower than expected
  Impact: Judges question reliability
  Mitigation: Show confidence scores, manual flag low-accuracy matches

Risk 3: Database corruption/data loss
  Impact: Unable to recover extraction results
  Mitigation: Git commits every hour, backups, test recovery process

Risk 4: PDF extraction fails on complex documents
  Impact: Cannot process real-world files
  Mitigation: Test on actual sample PDFs, have fallback text versions
```

### Market Risks
```
Risk 1: Contractors resist adopting new tools
  Impact: Low adoption post-MVP
  Mitigation: Demonstrate ROI clearly, make system easy to use

Risk 2: Existing solutions (Primavera plugins) block market entry
  Impact: Competition is entrenched
  Mitigation: Focus on underserved segment (Tier 2/3 contractors)

Risk 3: Data privacy concerns (monitoring sites)
  Impact: Regulatory blockers
  Mitigation: Privacy-first approach, anonymize personal data, local processing
```

---

## 9. COMPETITIVE LANDSCAPE

### Existing Solutions
```
1. Primavera P6
   - Status: Entrenched, expensive
   - Gap: Doesn't automate data capture from messy inputs
   - Our Edge: AI extraction, automatic linking

2. Microsoft Project
   - Status: Popular for small-medium projects
   - Gap: Manual data entry, no automation
   - Our Edge: Intelligent extraction from unstructured data

3. Touchplan
   - Status: Growing, visual planning
   - Gap: Still requires manual progress entry
   - Our Edge: Automatic extraction + matching

4. Bridgit
   - Status: Labor scheduling focused
   - Gap: Not schedule tracking
   - Our Edge: Direct schedule-linked automation

### Our Competitive Advantages
```
✅ AI-powered (LLM extraction, fuzzy matching)
✅ Multi-format input (handles real-world mess)
✅ Automatic matching (no manual linking)
✅ Real-time updates (not 3-day delay)
✅ Confidence scoring (transparency about data quality)
✅ Institutional memory (learn from past projects)
✅ Affordable (not ₹50+ lakh license fee)
```

---

## 10. SUCCESS CRITERIA FOR HACKATHON

### Judge's Perspective ✅
```
Problem:
  ✅ Clearly articulated (construction delays = ₹10k crore)
  ✅ Real-world (not academic)
  ✅ Impactful (saves ₹100 crore+ annually)

Solution:
  ✅ Novel (AI extraction + fuzzy matching = not obvious)
  ✅ Practical (MVP actually works)
  ✅ Scalable (works for 1 site → 1000 sites)

Demo:
  ✅ Live end-to-end (upload → extract → match → update)
  ✅ Works without errors
  ✅ Shows real-world data handling
  ✅ Confidence scores visible
  ✅ Audit trail demonstrable

Pitch:
  ✅ Clear problem statement
  ✅ Solution explained simply
  ✅ Impact quantified
  ✅ Q&A answered confidently
```

### Team's Perspective ✅
```
✅ All team members understand product
✅ Can explain different parts
✅ Can answer tough questions
✅ Confident in what system can/can't do
✅ Proud of what was built in 36 hours
```

---

## 11. POST-HACKATHON VISION

### Year 1: Establish Market
```
- 50 large construction projects using system
- ₹2.5 crore revenue (₹50 lakh × 50 sites)
- Build brand (case studies, testimonials)
- Hire first team (2-3 engineers, 1 sales)
```

### Year 2: Scale & Expand
```
- 200 projects
- ₹10 crore revenue
- Add predictive analytics
- Expand to Tier 2 cities
- Build enterprise features
```

### Year 3: Transform Industry
```
- 1000+ projects
- ₹50 crore+ revenue
- Become standard for infrastructure projects
- Potentially acquire by larger PM software company (Primavera, Touchplan)
```

---

**This is the complete PRD. Ready for FEATURES.md next?** 🚀
