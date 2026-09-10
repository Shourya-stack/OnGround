"""
Unit tests for ExtractionService and deterministic confidence scoring.
"""

import unittest
from uuid import uuid4
from datetime import datetime
from backend.services.extraction_service import (
    calculate_extraction_confidence,
    normalize_text,
    extract_text_from_file,
    ExtractionService,
)
from backend.llm.provider import LLMProvider


class MockLLMProvider(LLMProvider):
    def extract_activities(self, raw_text: str) -> str:
        return """[
            {
                "activity_description": "Fit-up and welding of cooling water pipe spool",
                "discipline": "piping",
                "start_time": "2026-09-10 08:00:00",
                "end_time": "2026-09-10 16:00:00",
                "location_reference": "Area 2 Substation"
            },
            {
                "activity_description": "Unclassified inspection",
                "discipline": "unknown",
                "start_time": null,
                "end_time": null,
                "location_reference": null
            }
        ]"""


class TestExtractionService(unittest.TestCase):
    def test_calculate_extraction_confidence(self):
        # Full details: Base 0.50 + 0.15 (discipline) + 0.15 (start) + 0.10 (end) + 0.10 (location) = 1.00
        score_full = calculate_extraction_confidence(
            activity_desc="Welding pipe",
            discipline="piping",
            start_dt=datetime.now(),
            end_dt=datetime.now(),
            location_ref="Unit 200",
        )
        self.assertEqual(score_full, 1.00)

        # Minimal details: Base 0.50 + 0 = 0.50
        score_min = calculate_extraction_confidence(
            activity_desc="Unknown activity",
            discipline="unknown",
            start_dt=None,
            end_dt=None,
            location_ref=None,
        )
        self.assertEqual(score_min, 0.50)

        # Partial details: Base 0.50 + 0.15 (civil) + 0.15 (start) = 0.80
        score_partial = calculate_extraction_confidence(
            activity_desc="Excavation",
            discipline="civil",
            start_dt=datetime.now(),
            end_dt=None,
            location_ref="",
        )
        self.assertEqual(score_partial, 0.80)

    def test_normalize_text(self):
        text = "Hello\u00A0World!"  # Non-breaking space
        normalized = normalize_text(text)
        self.assertIn("Hello", normalized)

        long_text = "A" * 10000
        truncated = normalize_text(long_text, max_chars=500)
        self.assertEqual(len(truncated), 500)

    def test_extraction_service_pipeline(self):
        service = ExtractionService(provider=MockLLMProvider())
        eid = uuid4()
        sample_bytes = b"Daily progress report content"
        results = service.process_file_content(sample_bytes, "report.txt", eid)

        self.assertEqual(len(results), 2)

        # First activity should have high confidence
        self.assertEqual(results[0].discipline, "piping")
        self.assertEqual(results[0].extraction_confidence, 1.00)
        self.assertEqual(results[0].location_reference, "Area 2 Substation")

        # Second activity should have baseline confidence
        self.assertEqual(results[1].discipline, "unknown")
        self.assertEqual(results[1].extraction_confidence, 0.50)


if __name__ == "__main__":
    unittest.main()
