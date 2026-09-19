import json as json_module
import unittest
from unittest.mock import patch, MagicMock
from uuid import uuid4

from backend.llm.openrouter import OpenRouterProvider
from backend.services.extraction_service import ExtractionService

class TestLLMFailover(unittest.TestCase):

    def test_primary_returns_429_fails_over_to_fallback_model(self):
        """When primary model returns 429, provider should immediately attempt fallback model without retrying 429."""
        provider = OpenRouterProvider(
            api_key="sk-or-test-live-key",
            model="primary/model:free",
            fallback_model="fallback/model:free"
        )
        
        call_models = []
        
        def mock_post(url, headers, json=None, **kwargs):
            model = json.get("model") if json else None
            call_models.append(model)
            if model == "primary/model:free":
                # Returns 429 rate limit
                resp = MagicMock()
                resp.status_code = 429
                resp.text = '{"error": {"message": "Rate limit exceeded: free-models-per-day", "code": 429}}'
                return resp
            elif model == "fallback/model:free":
                # Fallback model succeeds
                resp = MagicMock()
                resp.status_code = 200
                resp.json.return_value = {
                    "choices": [{
                        "message": {
                            "content": json_module.dumps([{
                                "activity_description": "Piping fit-up in Unit 200",
                                "discipline": "piping",
                                "start_time": "2026-09-18T08:00:00",
                                "end_time": "2026-09-18T14:00:00",
                                "location_reference": "Unit 200 Area B"
                            }])
                        }
                    }]
                }
                return resp
            raise ValueError(f"Unexpected model: {model}")

        with patch("httpx.Client.post", side_effect=mock_post):
            result = provider.extract_activities("Fit-up of cooling water line in Unit 200")
            parsed = json_module.loads(result)
            self.assertEqual(len(parsed), 1)
            self.assertEqual(parsed[0]["discipline"], "piping")
            # Proves primary model was called once, and fallback model was called immediately
            self.assertEqual(call_models[0], "primary/model:free")
            self.assertEqual(call_models[1], "fallback/model:free")
            self.assertEqual(call_models.count("primary/model:free"), 1)

    def test_all_models_unavailable_uses_offline_fallback(self):
        """When all candidate models return 429 or fail, provider gracefully uses offline fallback."""
        provider = OpenRouterProvider(
            api_key="sk-or-test-live-key",
            model="primary/model:free"
        )
        
        def mock_post(url, headers, json=None, **kwargs):
            resp = MagicMock()
            resp.status_code = 429
            resp.text = '{"error": {"message": "Rate limit exceeded"}}'
            return resp

        with patch("httpx.Client.post", side_effect=mock_post):
            sample_report = (
                "DAILY PROGRESS REPORT - 2026-09-18\n"
                "1. Excavation and lean concrete pouring for pump house A (07:30 to 12:00). Location: Pump House A. Discipline: Civil.\n"
                "2. Welding of 8-inch hydrocarbon header in Unit 200 (09:00 to 16:00). Location: Unit 200 Area B. Discipline: Piping.\n"
            )
            result = provider.extract_activities(sample_report)
            parsed = json_module.loads(result)
            self.assertIsInstance(parsed, list)
            self.assertGreaterEqual(len(parsed), 2)
            self.assertIn(parsed[0]["discipline"], ["civil", "piping"])

    def test_successful_primary_does_not_call_fallback(self):
        """When primary model succeeds on first attempt, fallback models are NOT called."""
        provider = OpenRouterProvider(
            api_key="sk-or-test-live-key",
            model="primary/model:free"
        )
        
        called_models = []
        def mock_post(url, headers, json=None, **kwargs):
            model = json.get("model") if json else None
            called_models.append(model)
            resp = MagicMock()
            resp.status_code = 200
            resp.json.return_value = {
                "choices": [{
                    "message": {
                        "content": '[{"activity_description": "Cable pulling", "discipline": "electrical"}]'
                    }
                }]
            }
            return resp

        with patch("httpx.Client.post", side_effect=mock_post):
            result = provider.extract_activities("Cable pulling in Substation")
            parsed = json_module.loads(result)
            self.assertEqual(len(parsed), 1)
            self.assertEqual(called_models, ["primary/model:free"])

    def test_extraction_service_end_to_end_with_fallback(self):
        """Verify ExtractionService processes fallback JSON into valid ExtractedActivityCreate models."""
        provider = OpenRouterProvider(api_key="mock")
        service = ExtractionService(provider=provider)
        
        raw_report = (
            "DAILY PROGRESS REPORT\n"
            "ACT-CIV-01 Foundation excavation for pump house A. 2026-09-18T07:30:00 to 2026-09-18T12:00:00 Location: Pump House A Civil\n"
            "ACT-ELE-02 Cable tray installation in Substation 3. 2026-09-18T08:00:00 to 2026-09-18T15:00:00 Location: Substation 3 Electrical\n"
        )
        
        eid = uuid4()
        models = service.process_file_content(raw_report.encode("utf-8"), "report.txt", eid)
        self.assertGreaterEqual(len(models), 2)
        for m in models:
            self.assertGreaterEqual(m.extraction_confidence, 0.50)
            self.assertIsNotNone(m.activity_description)

if __name__ == "__main__":
    unittest.main()
