"""
Extract route handler stub (Phase 1 scaffolding).
Full implementation in Phase 2.
"""

from fastapi import APIRouter, HTTPException, status
from uuid import UUID
from backend.models.schemas import ExtractionResponse

router = APIRouter(tags=["extract"])

@router.post("/extract/{extraction_id}", response_model=ExtractionResponse)
async def trigger_extraction(extraction_id: UUID):
    """
    Triggers AI extraction on an uploaded report file.
    """
    # Stub placeholder for Phase 1
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Extraction endpoint is implemented in Phase 2"
    )
