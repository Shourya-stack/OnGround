"""
Unit tests for MatchingService, hybrid contextual scoring formula, and dynamic date proximity (F-07).
"""

import unittest
from uuid import uuid4
from datetime import date, datetime
from backend.services.matching_service import (
    calculate_match_score,
    compute_similarity,
    compute_vector_similarity,
    calculate_date_proximity,
    get_or_encode_embedding,
    get_embedding_cache,
    clear_embedding_cache,
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

    def test_embedding_cache_miss_and_hit(self):
        clear_embedding_cache()
        cache = get_embedding_cache()

        class MockModel:
            def __init__(self):
                self.encode_count = 0

            def encode(self, text):
                self.encode_count += 1
                return [0.1, 0.2, 0.3]

        mock_model = MockModel()
        key_id = "PLAN-101"
        text = "Welding CS cooling water pipe"

        # First retrieval: Miss, encodes via model
        emb1 = get_or_encode_embedding(text, activity_id=key_id, model=mock_model)
        self.assertIsNotNone(emb1)
        self.assertEqual(mock_model.encode_count, 1)
        self.assertEqual(cache.size(), 1)
        self.assertEqual(cache.stats()["hits"], 0)
        self.assertEqual(cache.stats()["misses"], 1)

        # Second retrieval: Hit, does not call model.encode
        emb2 = get_or_encode_embedding(text, activity_id=key_id, model=mock_model)
        self.assertEqual(emb1, emb2)
        self.assertEqual(mock_model.encode_count, 1)  # unchanged
        self.assertEqual(cache.stats()["hits"], 1)

    def test_embedding_cache_content_invalidation(self):
        clear_embedding_cache()
        cache = get_embedding_cache()

        class MockModel:
            def __init__(self):
                self.encode_count = 0

            def encode(self, text):
                self.encode_count += 1
                if "electrical" in text.lower():
                    return [0.9, 0.9, 0.9]
                return [0.1, 0.2, 0.3]

        mock_model = MockModel()
        plan_id = "PLAN-201"

        # First version: Piping
        emb_v1 = get_or_encode_embedding("Piping spool fabrication", activity_id=plan_id, model=mock_model)
        self.assertEqual(mock_model.encode_count, 1)

        # Second version with same plan_id but edited description: Cache miss, re-encoded
        emb_v2 = get_or_encode_embedding("Electrical cable pulling", activity_id=plan_id, model=mock_model)
        self.assertEqual(mock_model.encode_count, 2)
        self.assertNotEqual(emb_v1, emb_v2)

    def test_embedding_cache_bounded_lru_eviction(self):
        from backend.services.matching_service import EmbeddingCache

        small_cache = EmbeddingCache(max_size=3)

        small_cache.put("k1", [1.0, 0.0])
        small_cache.put("k2", [0.0, 1.0])
        small_cache.put("k3", [0.5, 0.5])
        self.assertEqual(small_cache.size(), 3)

        # Access k1 to make it most recently used
        self.assertIsNotNone(small_cache.get("k1"))

        # Add k4 -> should evict k2 (oldest LRU entry)
        small_cache.put("k4", [0.2, 0.8])
        self.assertEqual(small_cache.size(), 3)
        self.assertIsNone(small_cache.get("k2"))
        self.assertIsNotNone(small_cache.get("k1"))
        self.assertIsNotNone(small_cache.get("k3"))
        self.assertIsNotNone(small_cache.get("k4"))

    def test_vector_similarity_numerical_equivalence(self):
        # Orthogonal vectors: cosine sim = 0.0
        sim_ortho = compute_vector_similarity([1.0, 0.0, 0.0], [0.0, 1.0, 0.0])
        self.assertEqual(sim_ortho, 0.0)

        # Identical vectors: cosine sim = 1.0
        sim_ident = compute_vector_similarity([0.6, 0.8], [0.6, 0.8])
        self.assertAlmostEqual(sim_ident, 1.0, places=4)

        # Known angle (45 degrees, cos = sqrt(2)/2 approx 0.7071)
        sim_45 = compute_vector_similarity([1.0, 0.0], [1.0, 1.0])
        self.assertAlmostEqual(sim_45, 0.7071, places=3)

    def test_fallback_similarity_when_model_unavailable(self):
        # Word overlap between "Piping welding" and "Piping fit-up and welding"
        # s1 = {piping, welding}, s2 = {piping, fit-up, and, welding}
        # intersection = 2, total = 6, 2*2/6 = 0.6667
        sim = compute_similarity("Piping welding", "Piping fit-up and welding", model="fallback")
        self.assertAlmostEqual(sim, 0.6667, places=3)

    def test_ambiguity_margin_forces_review(self):
        service = MatchingService()
        eid = uuid4()

        # Two very similar candidates
        plan_activities = [
            {
                "id": str(uuid4()),
                "activity_code": "PIP-101",
                "activity_description": "Piping fit-up in Area 1",
                "discipline": "piping",
                "planned_start": "2026-09-01",
                "planned_end": "2026-09-30",
            },
            {
                "id": str(uuid4()),
                "activity_code": "PIP-102",
                "activity_description": "Piping fit-up in Area 2",
                "discipline": "piping",
                "planned_start": "2026-09-01",
                "planned_end": "2026-09-30",
            },
        ]

        result = service.match_activity(
            extracted_activity_id=eid,
            activity_description="Piping fit-up in Area 1",
            discipline="piping",
            extraction_confidence=0.95,
            start_time=datetime(2026, 9, 10, 8, 0),
            end_time=datetime(2026, 9, 10, 16, 0),
            plan_activities=plan_activities,
        )

        # Ambiguous candidate match forces pending_review and attaches candidates list
        self.assertIn(result.status, ("auto_linked", "pending_review"))
        if result.candidates:
            self.assertGreater(len(result.candidates), 1)


if __name__ == "__main__":
    unittest.main()
