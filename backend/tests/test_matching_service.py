"""
Unit tests for MatchingService and hybrid contextual scoring formula.
"""

import unittest
from uuid import uuid4
from backend.services.matching_service import (
    calculate_match_score,
    compute_similarity,
    MatchingService,
)


class TestMatchingService(unittest.TestCase):
    def test_calculate_match_score_identical_discipline(self):
        # Embedding sim = 0.90, extraction confidence = 0.90, date proximity = 1.0, same discipline
        # score = (0.70 * 0.90) + (0.20 * 0.90) + (0.10 * 1.0) - 0.0 = 0.63 + 0.18 + 0.10 = 0.91
        score = calculate_match_score(
            embedding_sim=0.90,
            extraction_confidence=0.90,
            extracted_discipline="piping",
            plan_discipline="piping",
            date_proximity_factor=1.0,
        )
        self.assertEqual(score, 0.91)

    def test_calculate_match_score_discipline_penalty(self):
        # Embedding sim = 0.90, extraction confidence = 0.90, date proximity = 1.0, mismatched discipline
        # score = 0.91 - 0.15 = 0.76
        score = calculate_match_score(
            embedding_sim=0.90,
            extraction_confidence=0.90,
            extracted_discipline="piping",
            plan_discipline="civil",
            date_proximity_factor=1.0,
        )
        self.assertEqual(score, 0.76)

    def test_matching_service_bands(self):
        service = MatchingService()
        eid = uuid4()

        # Highly matching piping description
        result_high = service.match_activity(
            extracted_activity_id=eid,
            activity_description="Piping fit-up and spool fabrication area 1",
            discipline="piping",
            extraction_confidence=0.95,
        )
        self.assertIn(result_high.status, ("auto_linked", "pending_review"))

        # Unrelated description
        result_low = service.match_activity(
            extracted_activity_id=eid,
            activity_description="Astronomy telescope lens calibration in satellite",
            discipline="unknown",
            extraction_confidence=0.50,
        )
        self.assertEqual(result_low.status, "unmatched")


if __name__ == "__main__":
    unittest.main()
