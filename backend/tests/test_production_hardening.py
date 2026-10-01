"""
Unit and integration tests for Phase 6.4 Remaining Production Hardening:
- F-08: Authentication policy across all read endpoints (/schedule, /reports, /matches, /unmatched, /analytics)
- Production CORS configuration resolution
- Environment validation and configuration health checks
- Rate limiter parsing robust fallbacks
"""

import os
import unittest
from uuid import uuid4
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import get_cors_origins, get_cors_regex, validate_environment, get_environment
from backend.auth.rate_limiter import parse_rate_limit, limiter
from backend.tests.helpers import fake_db


class TestProductionHardening(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        limiter.reset()
        self.user_id = uuid4()
        self.project_id = uuid4()
        self.planner_headers = {"Authorization": "Bearer valid.planner.token"}
        self.supervisor_headers = {"Authorization": "Bearer valid.supervisor.token"}

        # Mock Planner Supabase Auth
        self.mock_planner_supabase = MagicMock()
        mock_planner_user = MagicMock(id=str(self.user_id), email="planner@onground.build")
        self.mock_planner_supabase.auth.get_user.return_value = MagicMock(user=mock_planner_user)
        self.mock_planner_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.user_id), "email": "planner@onground.build", "role": "planner"}
        ]

        # Mock Supervisor Supabase Auth
        self.mock_supervisor_supabase = MagicMock()
        mock_sup_user = MagicMock(id=str(self.user_id), email="supervisor@onground.build")
        self.mock_supervisor_supabase.auth.get_user.return_value = MagicMock(user=mock_sup_user)
        self.mock_supervisor_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.user_id), "email": "supervisor@onground.build", "role": "supervisor"}
        ]

    # =========================================================================
    # F-08: Read Endpoint Authentication Tests
    # =========================================================================

    def test_schedule_without_token_returns_401(self):
        response = self.client.get("/schedule")
        self.assertEqual(response.status_code, 401)

    def test_schedule_with_invalid_token_returns_401(self):
        mock_auth = MagicMock()
        mock_auth.auth.get_user.side_effect = Exception("Invalid JWT")
        with patch("backend.auth.security.get_supabase_client", return_value=mock_auth):
            response = self.client.get("/schedule", headers={"Authorization": "Bearer bad.token"})
            self.assertEqual(response.status_code, 401)

    def test_schedule_with_planner_and_supervisor_allowed(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            resp1 = self.client.get(f"/schedule?project_id={self.project_id}", headers=self.planner_headers)
            self.assertEqual(resp1.status_code, 200)

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supervisor_supabase):
            resp2 = self.client.get(f"/schedule?project_id={self.project_id}", headers=self.supervisor_headers)
            self.assertEqual(resp2.status_code, 200)

    def test_schedule_without_project_id_returns_422(self):
        """Schedule is project-scoped; project_id may not be omitted."""
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            response = self.client.get("/schedule", headers=self.planner_headers)
            self.assertEqual(response.status_code, 422)

    def test_reports_without_token_returns_401(self):
        response = self.client.get("/reports")
        self.assertEqual(response.status_code, 401)

    def test_reports_with_auth_allowed(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            response = self.client.get(f"/reports?project_id={self.project_id}", headers=self.planner_headers)
            self.assertEqual(response.status_code, 200)

    def test_reports_without_project_id_returns_422(self):
        """Reports is project-scoped; project_id may not be omitted."""
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            response = self.client.get("/reports", headers=self.planner_headers)
            self.assertEqual(response.status_code, 422)

    def test_matches_without_token_returns_401(self):
        response = self.client.get("/matches")
        self.assertEqual(response.status_code, 401)

    def test_matches_with_auth_allowed(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase), \
             patch("backend.routes.match.get_supabase_client", return_value=fake_db()):
            response = self.client.get(
                f"/matches?project_id={self.project_id}", headers=self.planner_headers
            )
            self.assertEqual(response.status_code, 200)

    def test_matches_without_project_id_returns_422(self):
        """Read endpoints are project-scoped; project_id may not be omitted."""
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            response = self.client.get("/matches", headers=self.planner_headers)
            self.assertEqual(response.status_code, 422)

    def test_unmatched_without_token_returns_401(self):
        response = self.client.get("/unmatched")
        self.assertEqual(response.status_code, 401)

    def test_unmatched_with_auth_allowed(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase), \
             patch("backend.routes.match.get_supabase_client", return_value=fake_db()):
            response = self.client.get(
                f"/unmatched?project_id={self.project_id}", headers=self.planner_headers
            )
            self.assertEqual(response.status_code, 200)

    def test_analytics_without_token_returns_401(self):
        response = self.client.get("/analytics")
        self.assertEqual(response.status_code, 401)

    def test_analytics_with_auth_allowed(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase), \
             patch("backend.routes.analytics.get_supabase_client", return_value=fake_db()):
            response = self.client.get(f"/analytics?project_id={self.project_id}", headers=self.planner_headers)
            self.assertEqual(response.status_code, 200)

    def test_analytics_without_project_id_returns_422(self):
        """Analytics is project-scoped; project_id may not be omitted."""
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            response = self.client.get("/analytics", headers=self.planner_headers)
            self.assertEqual(response.status_code, 422)

    def test_health_remains_public_unauthenticated(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    # =========================================================================
    # Production CORS Configuration Tests
    # =========================================================================

    def test_cors_development_origins(self):
        with patch.dict(os.environ, {"ENVIRONMENT": "development", "FRONTEND_URL": "http://localhost:5173"}):
            origins = get_cors_origins()
            self.assertIn("http://localhost:5173", origins)
            self.assertIn("http://127.0.0.1:5173", origins)

    def test_cors_production_origins_strict(self):
        with patch.dict(os.environ, {
            "ENVIRONMENT": "production",
            "ALLOWED_ORIGINS": "https://onground.vercel.app,https://admin.onground.build",
            "FRONTEND_URL": "",
        }):
            origins = get_cors_origins()
            self.assertIn("https://onground.vercel.app", origins)
            self.assertIn("https://admin.onground.build", origins)
            self.assertNotIn("http://localhost:5173", origins)

    def test_cors_regex_configuration(self):
        with patch.dict(os.environ, {"ALLOWED_ORIGIN_REGEX": r"https://.*\.onground\.build"}):
            regex = get_cors_regex()
            self.assertEqual(regex, r"https://.*\.onground\.build")

        with patch.dict(os.environ, {"ALLOWED_ORIGIN_REGEX": ""}):
            regex = get_cors_regex()
            self.assertIsNone(regex)

    # =========================================================================
    # Environment / Config Validation Tests
    # =========================================================================

    def test_validate_environment_development_mode(self):
        with patch.dict(os.environ, {"ENVIRONMENT": "development", "SUPABASE_URL": "", "SUPABASE_SERVICE_KEY": ""}):
            is_valid, msgs = validate_environment()
            self.assertTrue(is_valid)  # Allowed in development (offline/mock mode)

    def test_validate_environment_production_mode_missing_keys(self):
        with patch.dict(os.environ, {"ENVIRONMENT": "production", "SUPABASE_URL": "", "SUPABASE_SERVICE_KEY": ""}):
            is_valid, msgs = validate_environment()
            self.assertFalse(is_valid)
            self.assertTrue(any("CRITICAL" in m for m in msgs))

    # =========================================================================
    # Rate Limiter Robust Parsing Tests
    # =========================================================================

    def test_rate_limiter_parsing_units(self):
        self.assertEqual(parse_rate_limit("10/minute"), (10, 60))
        self.assertEqual(parse_rate_limit("5/second"), (5, 1))
        self.assertEqual(parse_rate_limit("100/hour"), (100, 3600))
        self.assertEqual(parse_rate_limit("500/day"), (500, 86400))
        self.assertEqual(parse_rate_limit("25"), (25, 60))

    def test_rate_limiter_parsing_malformed_fallbacks(self):
        # Invalid / negative values fall back to defaults
        self.assertEqual(parse_rate_limit("invalid/minute", default_count=10), (10, 60))
        self.assertEqual(parse_rate_limit("-5/minute", default_count=10), (10, 60))
        self.assertEqual(parse_rate_limit("0/minute", default_count=10), (10, 60))
        self.assertEqual(parse_rate_limit(None, default_count=15, default_window=30), (15, 30))


if __name__ == "__main__":
    unittest.main()
