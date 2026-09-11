# OnGround — Auth

## Approach: Supabase Auth, kept minimal

No custom auth system. Supabase Auth (email/password, or magic link for an even faster demo login) handles identity — this was a deliberate scope decision so no time gets spent building or debugging auth logic that Supabase already provides.

## Roles

Two roles, stored as a `role` column on the user's profile row (`planner` or `supervisor`):

| Role | Can do |
|---|---|
| `planner` | Upload/edit baseline schedule, confirm/reject matches, view all disciplines |
| `supervisor` | Upload daily reports, view their own discipline's activities, cannot confirm/reject matches |

Role check happens in two places, deliberately redundant:
1. **Supabase Row Level Security** (`DATABASE.md`) — the actual enforcement boundary; even a compromised frontend can't bypass it.
2. **Frontend UI** — hides actions a role can't perform, so the interface never shows a button that would just fail — this is a UX guard, not a security boundary.

## Demo-day shortcut

For a live hackathon demo, a simple role-switcher (dropdown: "View as Planner" / "View as Supervisor") backed by two pre-seeded demo accounts is faster and more reliable on stage than live-typing login credentials in front of judges. Real login flow still exists and works — the switcher is just the fastest demo path, not a replacement.

## What's explicitly out of scope for v1

- No SSO / enterprise identity integration — noted as a "future: integrates with existing EPC contractor SSO" roadmap line, not built.
- No fine-grained per-discipline permissions within the supervisor role (e.g. a piping supervisor editing electrical entries) — v1 treats all supervisors equally; discipline-scoping is a natural v2 extension once the core loop is proven.
- No session-length/token-refresh customization — Supabase Auth's defaults are used as-is.
