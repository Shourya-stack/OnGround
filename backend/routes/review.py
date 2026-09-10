"""
Review route handlers stub (Phase 1 scaffolding).
Full implementation in Phase 2.
"""

from fastapi import APIRouter, HTTPException, status
from uuid import UUID
from backend.models.schemas import ConfirmResponse, RejectRequest, RejectResponse

router = APIRouter(tags=["review"])

@router.post("/match/{match_id}/confirm", response_model=ConfirmResponse)
async def confirm_match(match_id: UUID):
    """
    Planner confirms a proposed match.
    """
    # Stub placeholder for Phase 1
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Confirm endpoint is implemented in Phase 2"
    )

@router.post("/match/{match_id}/reject", response_model=RejectResponse)
async def reject_match(match_id: UUID, request: RejectRequest = None):
    """
    Planner rejects a proposed match.
    """
    # Stub placeholder for Phase 1
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Reject endpoint is implemented in Phase 2"
    )
