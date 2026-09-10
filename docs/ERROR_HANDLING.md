# TrueLine — Error Handling

Note: `/AI/GUARDRAILS.md` covers AI-specific failure modes (hallucination, low confidence, ambiguous matches). This file covers ordinary application errors — network, validation, infra — across the rest of the stack.

## Principle

Same voice rule as everywhere else in this product (`/DESIGN/BRAND.md`): state what happened and what to do, never apologize, never show a raw stack trace or generic "something went wrong" to a user.

## Backend (FastAPI)

- Every custom endpoint (`/ENGINEERING/API.md`) catches its own known failure modes and returns the consistent error shape defined there — no unhandled exception should ever reach the client as a bare 500 with a traceback.
- LLM API failures (timeout, rate limit, malformed response): caught in `extraction_service.py`, surfaced as `extraction_failed` with the manual-entry fallback always offered, per `/AI/GUARDRAILS.md`. No vendor-specific error details are exposed to users.
- Supabase write failures (RLS rejection, constraint violation): caught and translated into a plain-language reason where possible ("You don't have permission to confirm matches" rather than a raw Postgres error string).
- Uncaught exceptions still get logged server-side with full detail (for debugging) even though the client only sees the plain-language version — don't lose information, just don't expose it raw.

## Frontend (React)

- Every data-fetching hook (`useActivities()`, etc., per `CODING_RULES.md`) returns a `{ data, error, loading }` shape — components handle all three states explicitly, never assume `data` is present.
- Network/Supabase errors render using the `/DESIGN/UI_STATES.md` error-state patterns — same visual and copy language as everywhere else in the product, not a separate "crash screen" style.
- A failed action (e.g. confirm-match request fails) leaves the UI in its prior state and shows an inline error near the action, rather than losing the user's place or clearing the screen.

## What must never happen

- A user-facing error that just says "Error" or shows a raw exception/stack trace.
- A failed background action (like a Realtime reconnect) that silently fails with no visible indication — if data might be stale, the UI says so.
- An error that loses unsaved user input (e.g. a manual-entry form clearing itself if submission fails) — always preserve what the user typed on failure.

## Logging

Server-side errors log: timestamp, endpoint, error type, and enough context to reproduce (extraction/match ID, not full request bodies if they might contain large file content). This is deliberately lightweight — no external logging service integration for the hackathon build; stdout/file logging is sufficient at this scale.
