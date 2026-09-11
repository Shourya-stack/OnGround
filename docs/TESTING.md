# OnGround — Testing

Note: this covers testing the *codebase*. AI-pipeline-specific accuracy testing (extraction recall, matching top-1 accuracy) is `/AI/EVALUATION.md`'s job — don't duplicate that here.

## Testing philosophy for a 36-hour build

Not aiming for high coverage — aiming for tests that catch the failures that would actually embarrass the team on demo day. Prioritize accordingly.

## What to actually test

| Priority | What | Why |
|---|---|---|
| High | `matching_service.py` similarity + banding logic | Pure function, easy to test, and a banding bug (wrong threshold applied) is the single most demo-visible failure |
| High | Pydantic schema validation on all API request/response models | Catches malformed-data bugs before they hit the database |
| High | LLM provider abstraction (`llm/provider.py`) with a mock provider | Verifies the extraction pipeline works without requiring a real LLM API call — provider interface returns structured JSON, Pydantic validates it, deterministic confidence is calculated |
| Medium | `extraction_service.py` with a mocked LLM provider response | Verifies parsing/validation/confidence logic without burning real API calls in CI |
| Medium | RLS policies (via Supabase's local dev / a test project) | A broken policy is a silent security bug, not a visible crash — worth explicit verification |
| Low | React component rendering | Time-boxed — a couple of smoke tests on `ReconciliationTable` and confidence badge rendering is enough; don't chase full component coverage |

## LLM provider abstraction tests

The provider abstraction must be testable with a mock provider that returns structured extraction responses. Core tests:

- Mock provider returns valid structured JSON → Pydantic validation passes → deterministic confidence score is calculated correctly
- Mock provider returns malformed JSON → extraction service handles gracefully, returns error
- Mock provider simulates timeout/failure → extraction service returns `extraction_failed` error, no crash
- Real provider (if available) returns structured JSON for a known input → validates end-to-end

The core extraction tests must NOT require a paid LLM API. Mock the provider for automated tests.

Matching tests remain completely independent of the LLM provider — matching uses sentence-transformers embeddings, not LLM output.

## What NOT to spend time testing

- Supabase's own auto-generated CRUD endpoints — that's Supabase's test surface, not this project's.
- Exhaustive edge cases in extraction wording — that's what `/AI/EVALUATION.md`'s test set is for, and it's a different kind of testing (accuracy, not correctness).
- UI pixel-perfect visual regression — not worth the setup time for a hackathon demo.
- The LLM provider's own behavior — the mock provider covers the interface contract; real provider testing is done manually during evaluation (Phase 5).

## Test data

Reuse the synthetic reports and baseline schedule built for `/AI/EVALUATION.md` (Phase 5 in `TASKS.md`) — one shared fixture set for both AI evaluation and code testing avoids maintaining two parallel synthetic datasets.

## Before demo day

Run the full test suite once, clean, right before the final polish pass (`TASKS.md` Phase 6) — not continuously throughout the build. This is a hackathon, not a codebase with a CI/CD pipeline; one clean run before the deadline is the right amount of ceremony.
