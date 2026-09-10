# TrueLine — Database (Supabase / Postgres)

## Tables

### `SCHEDULE_PLAN`
The baseline schedule — static ground truth, uploaded once per project by the planner.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `project_id` | uuid | |
| `activity_code` | text | e.g. "L5-247-ERC" |
| `activity_description` | text | e.g. "Erect Line 247-XX Piping Spool" |
| `discipline` | text | civil / piping / electrical / instrumentation / static_rotating_equipment / hse |
| `planned_start` | date | |
| `planned_end` | date | |
| `created_at` | timestamptz | |

### `EXTRACTIONS`
One row per uploaded file — tracks the job, not the individual activities.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `project_id` | uuid | |
| `file_url` | text | Supabase Storage reference |
| `file_type` | text | daily_report / spreadsheet / voice_transcript |
| `status` | text | pending / processing / complete / failed |
| `uploaded_by` | uuid | FK → auth.users |
| `created_at` | timestamptz | |

### `EXTRACTED_ACTIVITIES`
Structured output from the LLM extraction step (see `AI_WORKFLOW.md`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `extraction_id` | uuid | FK → `EXTRACTIONS.id` |
| `activity_description` | text | raw, in supervisor's words |
| `discipline` | text | nullable — "unknown" if the model couldn't tell |
| `start_time` | timestamptz | nullable |
| `end_time` | timestamptz | nullable |
| `location_reference` | text | nullable |
| `extraction_confidence` | float | NOT NULL — deterministic server-side confidence score (0.0 to 1.0) calculated post-LLM |
| `created_at` | timestamptz | |

### `SCHEDULE_MATCHES`
Result of the matching step — links an extracted activity to a plan node.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `extracted_activity_id` | uuid | FK → `EXTRACTED_ACTIVITIES.id` |
| `plan_activity_id` | uuid | FK → `SCHEDULE_PLAN.id` |
| `confidence_score` | float | raw cosine similarity, 0-1 |
| `status` | text | auto_linked / pending_review / confirmed / rejected |
| `resolved_by` | uuid | nullable — FK → auth.users, set on human confirm/reject |
| `candidates` | jsonb | nullable — top-N candidate matches array: `[{"plan_activity_id": uuid, "activity_code": text, "activity_description": text, "score": float}]` |
| `created_at` | timestamptz | |

### `UNMATCHED_ACTIVITIES`
Extracted activities with no plan match above the minimum threshold.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `extracted_activity_id` | uuid | FK → `EXTRACTED_ACTIVITIES.id` |
| `best_score` | float | nullable — highest score seen, even if below threshold |
| `resolution` | text | unresolved / marked_new_activity / manually_linked |
| `created_at` | timestamptz | |

### `AUDIT_TRAIL`
Append-only log — every action, per `MEMORY.md`'s "audit trail is the memory" design.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `related_match_id` | uuid | nullable — FK → `SCHEDULE_MATCHES.id` |
| `related_unmatched_id` | uuid | nullable — FK → `UNMATCHED_ACTIVITIES.id` |
| `action` | text | extracted / auto_linked / flagged / confirmed / rejected / manually_linked |
| `confidence_score` | float | nullable |
| `actor` | uuid | nullable — FK → auth.users; null if system-actioned |
| `created_at` | timestamptz | |

## Relationships

```
SCHEDULE_PLAN (static, planner-uploaded)
       ▲
       │ matched against
       │
EXTRACTIONS ──< EXTRACTED_ACTIVITIES ──< SCHEDULE_MATCHES
       (1:many)         │                       │
                         └──< UNMATCHED_ACTIVITIES
                                    │
                    both feed ──> AUDIT_TRAIL (append-only)
```

## Row Level Security (Supabase)

- `SCHEDULE_PLAN`: writable only by users with `role = 'planner'`.
- `SCHEDULE_MATCHES` confirm/reject: writable by `planner` role only.
- `EXTRACTIONS` / `EXTRACTED_ACTIVITIES` inserts: any authenticated project member (supervisors upload reports too).
- `AUDIT_TRAIL`: insert-only for all roles, no update/delete policy for anyone — enforces the append-only guarantee at the database level, not just in application code.
