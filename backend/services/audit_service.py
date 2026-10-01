"""
Audit Trail Logging Service for OnGround IPIS.
Provides append-only logging of lifecycle events across extractions, activities,
schedule matches, projects, and team membership changes.

NOTE ON FAILURE SEMANTICS
-------------------------
An audit write failure must never silently vanish, but it also must not roll back
a business operation that already succeeded. `log_action` therefore returns the
persisted row on success and raises nothing on failure — instead it records the
problem and returns None, and callers surface that as an `audit_warning` on the
response so the gap is visible rather than hidden.
"""

import logging
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timezone

from backend.db.supabase_client import get_supabase_client
from backend.db.errors import execute_write, execute_read, PersistenceError

logger = logging.getLogger("onground.audit")


# Canonical actions accepted by the audit_trail CHECK constraint.
VALID_ACTIONS = {
    "extracted",
    "auto_linked",
    "flagged",
    "confirmed",
    "rejected",
    "manually_linked",
    "uploaded",
    "archived",
    "imported",
    "project_created",
    "project_updated",
    "member_invited",
    "member_removed",
    "reassigned",
}

# Friendly aliases callers may pass.
_ACTION_ALIASES = {
    "confirm_match": "confirmed",
    "confirm": "confirmed",
    "reject_match": "rejected",
    "reject": "rejected",
    "matched": "auto_linked",
    "auto_match": "auto_linked",
    "reassign_match": "reassigned",
    "reassign": "reassigned",
    "manual_link": "manually_linked",
    "upload": "uploaded",
    "archive": "archived",
    "import": "imported",
}

# entity_type -> the dedicated FK column on audit_trail, when one exists.
_ENTITY_FK_COLUMN = {
    "schedule_matches": "related_match_id",
    "unmatched_activities": "related_unmatched_id",
}


def normalize_action(action: str) -> str:
    """
    Map a caller-supplied action onto the canonical vocabulary.

    Raises:
        ValueError: if the action is not representable. Previously an unknown
                    action (notably "uploaded") was passed straight through and
                    violated the CHECK constraint on every insert.
    """
    key = (action or "").strip().lower()
    normalized = _ACTION_ALIASES.get(key, key)

    if normalized not in VALID_ACTIONS:
        raise ValueError(
            f"Unknown audit action '{action}'. "
            f"Valid actions: {', '.join(sorted(VALID_ACTIONS))}"
        )
    return normalized


def log_action(
    entity_type: str,
    entity_id: UUID,
    action: str,
    project_id: Optional[UUID] = None,
    actor_id: Optional[UUID] = None,
    actor_role: str = "system",
    previous_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None,
    confidence_score: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    """
    Append an immutable record to the AUDIT_TRAIL table.

    Returns the persisted row, or None if the audit write failed. Callers should
    treat None as "operation succeeded but audit trail has a gap" and surface it.
    """
    try:
        normalized_action = normalize_action(action)
    except ValueError as exc:
        logger.error("Refusing to write audit row: %s", exc)
        return None

    # A confidence of 0.0 is meaningful. The previous `confidence_score or ...`
    # expression treated it as missing.
    resolved_confidence = confidence_score
    if resolved_confidence is None and new_state:
        candidate = new_state.get("confidence_score")
        if candidate is not None:
            resolved_confidence = candidate

    payload: Dict[str, Any] = {
        "project_id": str(project_id) if project_id else None,
        "entity_type": entity_type,
        "entity_id": str(entity_id) if entity_id else None,
        "action": normalized_action,
        "previous_state": previous_state,
        "new_state": new_state,
        "reason": reason,
        "confidence_score": resolved_confidence,
        "actor": str(actor_id) if actor_id else None,
        "actor_role": actor_role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Populate the dedicated relational column when the entity has one.
    fk_column = _ENTITY_FK_COLUMN.get(entity_type)
    if fk_column and entity_id:
        payload[fk_column] = str(entity_id)

    supabase = get_supabase_client()
    if not supabase:
        logger.info(
            "[OFFLINE AUDIT] %s on %s:%s by %s (%s)",
            normalized_action,
            entity_type,
            entity_id,
            actor_role,
            actor_id,
        )
        return None

    try:
        rows = execute_write(
            supabase.table("audit_trail").insert(payload),
            table="audit_trail",
            operation=f"audit.{normalized_action}",
        )
        return rows[0] if rows else None
    except PersistenceError as exc:
        # Deliberately non-fatal: the business operation already committed.
        logger.error(
            "Audit trail write failed (operation continues): action=%s entity=%s:%s error=%s",
            normalized_action,
            entity_type,
            entity_id,
            exc,
        )
        return None


def get_audit_trail(
    project_id: UUID,
    limit: int = 100,
    offset: int = 0,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Read the audit trail for a single project, newest first.

    project_id is required — the previous implementation returned every project's
    audit history to any authenticated caller.
    """
    supabase = get_supabase_client()
    if not supabase:
        return []

    query = (
        supabase.table("audit_trail")
        .select("*")
        .eq("project_id", str(project_id))
    )

    if action:
        query = query.eq("action", normalize_action(action))
    if entity_type:
        query = query.eq("entity_type", entity_type)

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

    return execute_read(query, table="audit_trail", operation="audit.list")
