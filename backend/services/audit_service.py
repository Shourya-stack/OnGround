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
) -> Optional[Dict[str, Any]]:
    """
    Appends an immutable record to the AUDIT_TRAIL table.
    """
    supabase = get_supabase_client()
    payload = {
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "action": action,
        "actor_id": str(actor_id) if actor_id else None,
        "actor_role": actor_role,
        "previous_state": previous_state,
        "new_state": new_state,
        "reason": reason,
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
