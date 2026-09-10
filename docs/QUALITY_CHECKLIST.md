# TrueLine — Quality Checklist

Run through this before submission / final demo. Grouped by the docs each item traces back to, so a failing check tells you exactly where to look.

## Functionality
- [ ] Full upload → extract → match → confirm flow works end-to-end with real (synthetic) data
- [ ] All 3 confidence bands are reachable and correctly styled (auto-linked, review, unmatched) — `/AI/AI_WORKFLOW.md`
- [ ] Disambiguation flow triggers correctly when two candidates score within 0.05 — `/AI/PROMPTS.md`
- [ ] Manual entry fallback works if extraction is skipped or fails — `/AI/GUARDRAILS.md`
- [ ] Audit trail entry exists for every match action (auto-link, confirm, reject) — `/ENGINEERING/DATABASE.md`

## Design
- [ ] Only `/DESIGN/DESIGN_SYSTEM.md` tokens used — no stray hex colors or fonts
- [ ] Confidence badges never rely on color alone (icon + text present) — `/DESIGN/ACCESSIBILITY.md`
- [ ] Empty, loading, and error states all implemented, not just the happy path — `/DESIGN/UI_STATES.md`
- [ ] Keyboard navigation works on the reconciliation table — `/DESIGN/ACCESSIBILITY.md`

## AI Pipeline
- [ ] Extraction recall ≥85% on the test set — `/AI/EVALUATION.md`
- [ ] Matching top-1 accuracy ≥80% on the test set
- [ ] Zero false-positive auto-links in the specific demo dataset that will be shown live
- [ ] No hallucinated timestamps/fields in a spot-check of 5 extractions
- [ ] Deterministic confidence calculation produces expected scores (not LLM-generated confidence)

## AI Provider
- [ ] Free-tier LLM provider works and returns structured extraction responses
- [ ] Provider failure produces graceful error message (no vendor-specific details exposed)
- [ ] Missing fields from LLM are not hallucinated — remain null/unknown
- [ ] Matching confidence remains independent of LLM — based on embeddings + contextual scoring only
- [ ] Provider/model can be switched via environment variables without code changes

## Security
- [ ] RLS policies verified — a supervisor account genuinely cannot confirm/reject matches
- [ ] No API keys committed to the repo (check `.env` is gitignored)
- [ ] `.env.example` exists with all required variable names (no actual secrets)
- [ ] File upload rejects non-allowed extensions
- [ ] No LLM API key or Supabase service-role key appears in frontend bundle

## Public Demo Deployment
- [ ] Public frontend URL works (Vercel)
- [ ] Frontend can communicate with hosted FastAPI backend
- [ ] Backend can communicate with Supabase
- [ ] Backend can communicate with free LLM provider
- [ ] Supabase RLS works in deployed environment
- [ ] Upload → extraction → validation → matching → review works through public URL
- [ ] Local fallback still works if deployment is unavailable

## Demo Readiness
- [ ] Demo script written and timed
- [ ] Backup video recording of a full clean run exists
- [ ] Demo accounts pre-seeded (planner + supervisor) — `/ENGINEERING/AUTH.md`
- [ ] Team knows what to say if judges ask about Primavera/PMIS integration — `/ENGINEERING/INTEGRATIONS.md` has the honest answer ready

## Documentation
- [ ] `PHASE.md` reflects actual current state, not stale plan
- [ ] `DECISION_LOG.md` has entries for any real judgment calls made during the build (not just the pre-build plan)

## Final gut check
- [ ] Would a judge asking "how does the AI actually decide a match is right?" get a clear, honest, specific answer — not just "the AI figures it out"
