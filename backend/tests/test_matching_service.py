"""
Unit tests for MatchingService, hybrid contextual scoring formula, and dynamic date proximity (F-07).
"""

import unittest
from uuid import uuid4
from datetime import date, datetime
from backend.services.matching_service import (
    calculate_match_score,
    compute_similarity,
    calculate_date_proximity,
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

    def test_date_proximity_same_day(self):
        prox = calculate_date_proximity("2026-09-10", "2026-09-10", "2026-09-10", "2026-09-10")
        self.assertEqual(prox, 1.0)

    def test_date_proximity_overlapping_windows(self):
        # Extracted window: Sept 5 to Sept 15; Planned window: Sept 10 to Sept 20
        prox = calculate_date_proximity("2026-09-05", "2026-09-15", "2026-09-10", "2026-09-20")
        self.assertEqual(prox, 1.0)

    def test_date_proximity_nearby_dates(self):
        # 1 day gap
        prox_1d = calculate_date_proximity("2026-09-11", "2026-09-11", "2026-09-10", "2026-09-10")
        self.assertAlmostEqual(prox_1d, 0.9672, places=3)

        # 7 days gap
        prox_7d = calculate_date_proximity("2026-09-17", "2026-09-17", "2026-09-10", "2026-09-10")
        self.assertAlmostEqual(prox_7d, 0.7919, places=3)

    def test_date_proximity_moderately_separated(self):
        # 30 days gap
        prox_30d = calculate_date_proximity("2026-10-10", "2026-10-10", "2026-09-10", "2026-09-10")
        self.assertAlmostEqual(prox_30d, 0.3679, places=3)

    def test_date_proximity_far_away(self):
        # 180 days gap
        prox_180d = calculate_date_proximity("2027-03-10", "2027-03-10", "2026-09-10", "2026-09-10")
        self.assertLess(prox_180d, 0.01)
        self.assertGreaterEqual(prox_180d, 0.0)

    def test_date_proximity_missing_extracted_dates(self):
        # None extracted dates -> neutral 1.0
        prox = calculate_date_proximity(None, None, "2026-09-10", "2026-09-20")
        self.assertEqual(prox, 1.0)

    def test_date_proximity_missing_plan_dates(self):
        # None plan dates -> neutral 1.0
        prox = calculate_date_proximity("2026-09-10", "2026-09-10", None, None)
        self.assertEqual(prox, 1.0)

    def test_date_proximity_partial_single_sided(self):
        # Only start date provided on extracted side
        prox = calculate_date_proximity("2026-09-10", None, "2026-09-10", "2026-09-20")
        self.assertEqual(prox, 1.0)

    def test_date_proximity_reversed_ranges(self):
        # Reversed range: start > end
        prox = calculate_date_proximity("2026-09-20", "2026-09-10", "2026-09-12", "2026-09-15")
        self.assertEqual(prox, 1.0)

    def test_date_proximity_bounds(self):
        # Ensure always in [0.0, 1.0]
        for gap in [0, 1, 10, 50, 100, 1000, -100]:
            p = calculate_date_proximity(
                date(2026, 1, 1),
                date(2026, 1, 1),
                date(2026, 1, 1),
                date(2026, 1, 1),
            )
            self.assertTrue(0.0 <= p <= 1.0)

    def test_match_activity_dynamic_date_factor_integration(self):
        service = MatchingService()
        eid = uuid4()

        plan_activities = [
            {
                "id": str(uuid4()),
                "activity_code": "PIP-101",
                "activity_description": "Piping fit-up and spool fabrication area 1",
                "discipline": "piping",
                "planned_start": "2026-09-01",
                "planned_end": "2026-09-30",
            }
        ]

        # In-window activity: date proximity = 1.0
        res_near = service.match_activity(
            extracted_activity_id=eid,
            activity_description="Piping fit-up and spool fabrication area 1",
            discipline="piping",
            extraction_confidence=0.90,
            start_time=datetime(2026, 9, 15, 8, 0),
            end_time=datetime(2026, 9, 15, 16, 0),
            plan_activities=plan_activities,
        )

        # Distant activity (1 year later): date proximity ~0.00
        res_far = service.match_activity(
            extracted_activity_id=eid,
            activity_description="Piping fit-up and spool fabrication area 1",
            discipline="piping",
            extraction_confidence=0.90,
            start_time=datetime(2027, 9, 15, 8, 0),
            end_time=datetime(2027, 9, 15, 16, 0),
            plan_activities=plan_activities,
        )

        self.assertGreater(res_near.confidence_score, res_far.confidence_score)
        # Difference should reflect the ~0.10 date proximity factor contribution
        self.assertAlmostEqual(res_near.confidence_score - res_far.confidence_score, 0.10, places=1)

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
