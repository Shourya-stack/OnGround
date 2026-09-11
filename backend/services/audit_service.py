"""
Audit Trail Logging Service for TrueLine IPIS.
Provides append-only logging of lifecycle events across extractions, activities, and schedule matches.
"""

import logging
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from backend.db.supabase_client import get_supabase_client

logger = logging.getLogger("trueline.audit")


def log_action(
    entity_type: str,
    entity_id: UUID,
    action: str,
    actor_id: Optional[UUID] = None,
    actor_role: str = "system",
    previous_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None,
    confidence_score: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    """
    Appends an immutable record to the AUDIT_TRAIL table.
    """
    supabase = get_supabase_client()
    
    # Map action to schema constraint: ('extracted', 'auto_linked', 'flagged', 'confirmed', 'rejected', 'manually_linked')
    normalized_action = action.lower()
    if normalized_action in ("confirm_match", "confirm"):
        normalized_action = "confirmed"
    elif normalized_action in ("reject_match", "reject"):
        normalized_action = "rejected"
    elif normalized_action in ("matched", "auto_match"):
        normalized_action = "auto_linked"

    payload = {
        "related_match_id": str(entity_id) if entity_type == "schedule_matches" else None,
        "related_unmatched_id": str(entity_id) if entity_type == "unmatched_activities" else None,
        "action": normalized_action,
        "confidence_score": confidence_score or (new_state.get("confidence_score") if new_state else None),
        "actor": str(actor_id) if actor_id else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if not supabase:
        logger.info(f"[DEV/MOCK AUDIT LOG] {action} on {entity_type}:{entity_id} by {actor_role} ({actor_id})")
        return payload

    try:
        res = supabase.table("audit_trail").insert(payload).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return payload
    except Exception as e:
        logger.error(f"Failed to record audit trail: {e}")
        # Audit failures shouldn't necessarily crash the whole pipeline, but log error
        return None
