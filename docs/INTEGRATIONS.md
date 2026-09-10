# TrueLine — Integrations

## v1: no live external system integrations

TrueLine's prototype reads Primavera/MS Project data as a **file export** (CSV/Excel of the L5/L6 schedule), not via a live API connection — building and authenticating against a real Primavera integration is heavy infrastructure that doesn't change what the prototype needs to prove: that extraction + fuzzy matching works. This mirrors the parent PS's own scoping ("full production-grade OCR/ASR is not required").

## What's simulated vs. real in the demo

| System | v1 treatment |
|---|---|
| Primavera / MS Project | Baseline schedule imported as CSV/Excel export, not a live API connection |
| Daily reports / site diaries | Uploaded as text/CSV/PDF files, not pulled from any external reporting system |
| Voice input | Browser Web Speech API (free, built-in) transcribes to text, then goes through the same text extraction pipeline — no separate voice infrastructure |

## LLM API

The one real external API integration in v1 — the extraction service calls a free-tier LLM API through a provider abstraction layer (see `DECISION_LOG.md` D11, `ARCHITECTURE.md`). No special integration concerns beyond standard API key management (`SECURITY.md`). The provider and model are configurable via environment variables, so the underlying model can be replaced without changing extraction business logic.

## Roadmap: future integration points

Presented honestly as "not built" rather than demoed as working, per the same disclosure principle used in `RAG.md`:

- **Primavera / MS Project live sync** — a real integration would use Primavera's P6 EPPM web services API to write actual/start dates back automatically, rather than requiring a manual export/import cycle.
- **PMIS (Project Management Information System) integration** — the parent PS mentions updating "the schedule/PMIS in near real time"; v1's Supabase database stands in for this, with a clear extension point (the `SCHEDULE_MATCHES` confirm action) where a real PMIS write-back call would go.
- **Contractor SSO** — noted in `AUTH.md` as the natural identity-integration point once this moves beyond prototype.

## Why this honesty matters for judging

A judge asking "does this actually talk to Primavera?" gets a clear, confident "not in this prototype — here's exactly where and how it would" rather than an evasive answer. Per `GUARDRAILS.md`'s broader philosophy, disclosed limitations build more credibility than an implied capability that isn't real.
