"""
Schedule import service.

Reuses the file-reading helpers from extraction_service to parse CSV/XLSX
baseline schedules, validates the columns, and upserts schedule_plan rows by
activity_code within a project.
"""

import io
import logging
from datetime import date, datetime
from typing import List, Dict, Any, Tuple
from uuid import UUID

from backend.services.extraction_service import extract_text_from_file
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_write

logger = logging.getLogger("onground.schedule_import")

REQUIRED_COLUMNS = {"activity_code", "activity_description", "discipline"}
OPTIONAL_DATE_COLUMNS = {"planned_start", "planned_end", "start_date", "end_date"}


def _normalize_column(name: Any) -> str:
    return str(name).strip().lower().replace(" ", "_")


def _to_iso_date(value: Any) -> str | None:
    if value is None or (isinstance(value, float) and __import__("math").isnan(value)):
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    s = str(value).strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _valid_discipline(value: str | None) -> str:
    if not value:
        return "unknown"
    v = str(value).strip().lower().replace(" ", "_")
    valid = {
        "civil", "piping", "electrical", "instrumentation",
        "static_rotating_equipment", "hse",
    }
    return v if v in valid else "unknown"


def _load_dataframe(file_bytes: bytes, filename: str) -> Tuple[List[str], List[Dict[str, Any]]]:
    lower_name = filename.lower()
    if lower_name.endswith(".csv"):
        import pandas as pd
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif lower_name.endswith((".xlsx", ".xls")):
        import pandas as pd
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        # Fall back to CSV-like text parsing.
        text = extract_text_from_file(file_bytes, filename)
        import pandas as pd
        df = pd.read_csv(io.StringIO(text))

    df.columns = [_normalize_column(c) for c in df.columns]
    return list(df.columns), df.to_dict(orient="records")


def import_schedule_from_bytes(
    file_bytes: bytes,
    filename: str,
    project_id: UUID,
    uploaded_by: UUID | None = None,
) -> Tuple[int, int, int, List[Dict[str, Any]]]:
    """
    Import a baseline schedule file for a project.

    Returns: (imported_count, updated_count, skipped_count, errors)
    """
    supabase = get_supabase_client()
    if not supabase:
        raise RuntimeError("Database is not configured")

    columns, rows = _load_dataframe(file_bytes, filename)
    missing = REQUIRED_COLUMNS - set(columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    # Pre-fetch existing plan activities for this project to decide insert vs update.
    existing_rows = execute_read(
        supabase.table("schedule_plan")
        .select("id, activity_code")
        .eq("project_id", str(project_id)),
        table="schedule_plan",
        operation="schedule_import.list_existing",
    )
    existing_by_code = {r["activity_code"]: r["id"] for r in existing_rows}

    imported = 0
    updated = 0
    skipped = 0
    errors: List[Dict[str, Any]] = []

    for idx, row in enumerate(rows, start=2):  # row 1 is header
        try:
            code = str(row.get("activity_code", "")).strip()
            desc = str(row.get("activity_description", "")).strip()
            if not code or not desc:
                errors.append({"row": idx, "error": "activity_code and activity_description are required"})
                skipped += 1
                continue

            start = _to_iso_date(
                row.get("planned_start") or row.get("start_date") or row.get("planned_start_date")
            )
            end = _to_iso_date(
                row.get("planned_end") or row.get("end_date") or row.get("planned_end_date")
            )

            payload = {
                "project_id": str(project_id),
                "activity_code": code,
                "activity_description": desc,
                "discipline": _valid_discipline(row.get("discipline")),
                "planned_start": start,
                "planned_end": end,
            }

            existing_id = existing_by_code.get(code)
            if existing_id:
                execute_write(
                    supabase.table("schedule_plan")
                    .update(payload)
                    .eq("id", existing_id),
                    table="schedule_plan",
                    operation="schedule_import.update",
                )
                updated += 1
            else:
                payload["id"] = str(UUID())
                execute_write(
                    supabase.table("schedule_plan").insert(payload),
                    table="schedule_plan",
                    operation="schedule_import.insert",
                )
                imported += 1
        except PersistenceError as exc:
            logger.error("Schedule import row %s failed: %s", idx, exc)
            errors.append({"row": idx, "error": exc.public_detail})
        except Exception as exc:
            logger.error("Schedule import row %s failed: %s", idx, exc)
            errors.append({"row": idx, "error": str(exc)})

    return imported, updated, skipped, errors
