"""
Notification service for OnGround IPIS.

Notifications are generated from real pipeline events — never seeded with sample
rows. Every helper here is best-effort: a notification failure must not roll back
the business operation that triggered it, but it is always logged.
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_write

logger = logging.getLogger("onground.notifications")

VALID_TYPES = ("review", "variance", "evidence", "system")


def _create(
    project_id: UUID,
    notification_type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    user_id: Optional[UUID] = None,
) -> Optional[Dict[str, Any]]:
    """Insert one notification. Returns None on failure (non-fatal by design)."""
    if notification_type not in VALID_TYPES:
        logger.error("Invalid notification type '%s'", notification_type)
        return None

    supabase = get_supabase_client()
    if not supabase:
        return None

    payload = {
        "project_id": str(project_id),
        "user_id": str(user_id) if user_id else None,
        "type": notification_type,
        "title": title,
        "message": message,
        "link": link,
    }

    try:
        rows = execute_write(
            supabase.table("notifications").insert(payload),
            table="notifications",
            operation=f"notification.{notification_type}",
        )
        return rows[0] if rows else None
    except PersistenceError as exc:
        logger.error("Failed to create notification: %s", exc)
        return None


# -----------------------------------------------------------------------------
# Event-driven helpers
# -----------------------------------------------------------------------------

def notify_extraction_complete(
    project_id: UUID,
    extraction_id: UUID,
    activities_count: int,
) -> None:
    """Raised when a report finishes extraction."""
    if activities_count == 0:
        _create(
            project_id,
            "system",
            "Report processed with no activities",
            "Extraction completed but no site activities were identified. "
            "The report may be empty or in an unexpected format.",
            link=f"/projects/{project_id}/reports",
        )
        return

    _create(
        project_id,
        "evidence",
        "New report processed",
        f"{activities_count} site activit{'y' if activities_count == 1 else 'ies'} "
        f"extracted and ready for reconciliation.",
        link=f"/projects/{project_id}/reports",
    )


def notify_pending_review(
    project_id: UUID,
    match_id: UUID,
    activity_description: str,
    confidence: Optional[float] = None,
) -> None:
    """Raised when a match lands in pending_review and needs a human decision."""
    confidence_text = (
        f" (confidence {confidence:.0%})" if confidence is not None else ""
    )
    _create(
        project_id,
        "review",
        "Match needs review",
        f"\"{_truncate(activity_description)}\"{confidence_text} could not be "
        f"auto-linked with sufficient confidence.",
        link=f"/projects/{project_id}/reconciliation",
    )


def notify_unmatched(
    project_id: UUID,
    extracted_activity_id: UUID,
    activity_description: str,
    reason: Optional[str] = None,
) -> None:
    """Raised when a reported activity cannot be tied to any planned activity."""
    detail = f" Reason: {reason}." if reason else ""
    _create(
        project_id,
        "variance",
        "Unplanned activity reported",
        f"\"{_truncate(activity_description)}\" has no matching planned activity.{detail}",
        link=f"/projects/{project_id}/unmatched",
    )


def notify_extraction_failed(
    project_id: UUID,
    extraction_id: UUID,
    reason: str,
) -> None:
    """Raised when an extraction job fails."""
    _create(
        project_id,
        "system",
        "Report processing failed",
        f"A report could not be processed: {_truncate(reason, 160)}",
        link=f"/projects/{project_id}/reports",
    )


def notify_schedule_imported(
    project_id: UUID,
    imported: int,
    skipped: int,
) -> None:
    """Raised after a schedule import completes."""
    _create(
        project_id,
        "system",
        "Schedule imported",
        f"{imported} planned activit{'y' if imported == 1 else 'ies'} imported"
        + (f", {skipped} row(s) skipped." if skipped else "."),
        link=f"/projects/{project_id}/schedule",
    )


# -----------------------------------------------------------------------------
# Read / mutate
# -----------------------------------------------------------------------------

def list_notifications(
    project_id: UUID,
    user_id: UUID,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """Return notifications visible to `user_id` within `project_id`, newest first."""
    supabase = get_supabase_client()
    if not supabase:
        return []

    query = (
        supabase.table("notifications")
        .select("*")
        .eq("project_id", str(project_id))
        .or_(f"user_id.is.null,user_id.eq.{user_id}")
    )

    if unread_only:
        query = query.is_("read_at", "null")

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

    return execute_read(query, table="notifications", operation="notification.list")


def mark_read(notification_id: UUID, project_id: UUID) -> Dict[str, Any]:
    """Mark a single notification read. Raises PersistenceError if it does not exist."""
    supabase = get_supabase_client()
    if not supabase:
        raise PersistenceError("Database is not configured.", table="notifications")

    from datetime import datetime, timezone

    rows = execute_write(
        supabase.table("notifications")
        .update({"read_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", str(notification_id))
        .eq("project_id", str(project_id)),
        table="notifications",
        operation="notification.mark_read",
    )
    return rows[0]


def mark_all_read(project_id: UUID, user_id: UUID) -> int:
    """Mark every unread notification in the project read. Returns the count."""
    supabase = get_supabase_client()
    if not supabase:
        raise PersistenceError("Database is not configured.", table="notifications")

    from datetime import datetime, timezone

    rows = execute_write(
        supabase.table("notifications")
        .update({"read_at": datetime.now(timezone.utc).isoformat()})
        .eq("project_id", str(project_id))
        .is_("read_at", "null"),
        table="notifications",
        operation="notification.mark_all_read",
        expect_rows=False,
    )
    return len(rows)


def _truncate(text: str, limit: int = 80) -> str:
    text = (text or "").strip()
    return text if len(text) <= limit else f"{text[: limit - 1]}…"
