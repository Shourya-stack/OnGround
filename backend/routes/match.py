"""
Match route handler stub (Phase 1 scaffolding).
Full implementation in Phase 2.
"""

from fastapi import APIRouter, HTTPException, status
from uuid import UUID
from backend.models.schemas import MatchResult

router = APIRouter(tags=["match"])

@router.post("/match/{extracted_activity_id}", response_model=MatchResult)
async def trigger_match(extracted_activity_id: UUID):
    """
    Triggers sentence-transformers matching for an extracted activity.
    """
    # Stub placeholder for Phase 1
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Matching endpoint is implemented in Phase 2"
    )
