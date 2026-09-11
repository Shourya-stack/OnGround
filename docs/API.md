# OnGround — API

## Design principle

Custom FastAPI endpoints exist only where real logic happens (AI calls, matching, atomic multi-table writes). Everything else — reading activities, matches, audit trail, baseline schedule — goes directly from the React frontend to Supabase's auto-generated REST API. This keeps the hand-written API surface small.

## Custom FastAPI endpoints

### `POST /upload`
Upload a daily report or spreadsheet.

**Request:** multipart file + `project_id`, `file_type`
**Does:** stores file in Supabase Storage, creates an `EXTRACTIONS` row with `status: pending`
**Response:** `{ extraction_id, file_url, status }`

### `POST /extract/{extraction_id}`
Run LLM extraction on an uploaded file.

**Does:** fetches the file, calls the LLM provider per `SYSTEM_PROMPT.md`, writes rows to `EXTRACTED_ACTIVITIES`, updates `EXTRACTIONS.status`, writes `AUDIT_TRAIL` entries
**Response:** `{ extraction_id, activities: [...], status: "complete" }`

### `POST /match/{extracted_activity_id}`
Run matching for a single extracted activity against the project's baseline schedule.

**Does:** filters `SCHEDULE_PLAN` by discipline/date, computes embedding similarity, applies confidence banding, writes to `SCHEDULE_MATCHES` or `UNMATCHED_ACTIVITIES`, writes `AUDIT_TRAIL`
**Response:** `{ status: "auto_linked" | "pending_review" | "unmatched", match: {...} }`

### `POST /match/{match_id}/confirm`
Planner confirms a proposed match.

**Does:** updates `SCHEDULE_MATCHES.status = 'confirmed'`, sets `resolved_by`, writes `AUDIT_TRAIL`
**Response:** `{ match_id, status: "confirmed" }`

### `POST /match/{match_id}/reject`
Planner rejects a proposed match.

**Request body:** optional `reason`
**Does:** updates `SCHEDULE_MATCHES.status = 'rejected'`, writes `AUDIT_TRAIL`, activity becomes available for manual re-linking
**Response:** `{ match_id, status: "rejected" }`

## Direct-from-frontend (Supabase client, no FastAPI route)

| Need | How |
|---|---|
| List extracted activities | `supabase.from('EXTRACTED_ACTIVITIES').select()` |
| Reconciliation table data | `supabase.from('SCHEDULE_MATCHES').select('*, EXTRACTED_ACTIVITIES(*), SCHEDULE_PLAN(*)')` |
| Audit trail for a match | `supabase.from('AUDIT_TRAIL').select().eq('related_match_id', id)` |
| Upload baseline schedule (CSV) | Parse in-browser, `supabase.from('SCHEDULE_PLAN').insert([...])` |
| Live dashboard updates | `supabase.channel(...).on('postgres_changes', ...)` (Realtime) |

## Why sync, not async job queue

Every custom endpoint above does its work and returns a result in the same request — no background job system. At this project's scale (single-digit files per demo, extraction taking a few seconds), a queue would add infrastructure (Redis/Celery) to solve a latency problem that doesn't exist yet.

## Error responses

All custom endpoints return errors in a consistent shape:
```json
{ "error": "extraction_failed", "message": "AI extraction failed. Retry or enter activities manually.", "extraction_id": "..." }
```
matching the plain, direct error language defined in `BRAND.md` — no vague "something went wrong."
