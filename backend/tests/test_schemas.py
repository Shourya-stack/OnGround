"""
Unit tests for Pydantic validation schemas in backend/models/schemas.py.
"""

import unittest
from uuid import uuid4
from pydantic import ValidationError
from backend.models.schemas import (
    HealthResponse,
    CurrentUser,
    ExtractedActivityRaw,
    ExtractedActivityCreate,
    CandidateMatch,
    MatchResult,
    ConfirmResponse,
    RejectRequest,
)


class TestSchemas(unittest.TestCase):
    def test_health_response(self):
        resp = HealthResponse()
        self.assertEqual(resp.status, "ok")
        self.assertEqual(resp.version, "1.0.0")

    def test_discipline_normalization(self):
        # Valid discipline casing
        raw1 = ExtractedActivityRaw(
            activity_description="Welding 12in pipe",
            discipline="Piping",
        )
        self.assertEqual(raw1.discipline, "piping")

        # Multi-word discipline normalization
        raw2 = ExtractedActivityRaw(
            activity_description="Compressor alignment",
            discipline="Static Rotating Equipment",
        )
        self.assertEqual(raw2.discipline, "static_rotating_equipment")

        # Unknown discipline mapping
        raw3 = ExtractedActivityRaw(
            activity_description="Random miscellaneous task",
            discipline="Painting",
        )
        self.assertEqual(raw3.discipline, "unknown")

    def test_extracted_activity_create_validation(self):
        eid = uuid4()
        model = ExtractedActivityCreate(
            extraction_id=eid,
            activity_description="Civil foundation concrete pour",
            discipline="civil",
            extraction_confidence=0.85,
        )
        self.assertEqual(model.extraction_confidence, 0.85)
        self.assertEqual(model.discipline, "civil")

        # Confidence must be between 0.0 and 1.0
        with self.assertRaises(ValidationError):
            ExtractedActivityCreate(
                extraction_id=eid,
                activity_description="Invalid confidence",
                extraction_confidence=1.5,
            )

    def test_candidate_match_schema(self):
        cid = uuid4()
        candidate = CandidateMatch(
            plan_activity_id=cid,
            activity_code="PIP-101",
            activity_description="Pipe fabrication",
            score=0.92,
        )
        self.assertEqual(candidate.score, 0.92)
        self.assertEqual(candidate.activity_code, "PIP-101")


if __name__ == "__main__":
    unittest.main()
