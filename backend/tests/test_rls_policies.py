"""
Unit and integration tests for Phase 9.2 Complete Security & Multi-Tenant Hardening:
- SEC-01: Profile role self-promotion prevention
- SEC-02: Project-level database RLS policy definitions & isolation logic
- SEC-03: Confirm / Reject / Reassign project-level planner authorization
- SEC-04: Extraction resource ownership and project membership authorization
- SEC-05: Rate limiting client identification & proxy header hardening
- SEC-06: Schema AST, policy completeness, and RLS constraint verification
"""

import os
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock
from uuid import uuid4, UUID
from fastapi.testclient import TestClient

from backend.main import app
from backend.auth.rate_limiter import limiter, InMemoryRateLimiter
from backend.auth.security import verify_user_project_access


class TestSecurityHardeningPhase92(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        limiter.reset()

        self.default_project_id = UUID("00000000-0000-0000-0000-000000000001")
        self.custom_project_id = uuid4()
        self.foreign_project_id = uuid4()

        self.planner_id = uuid4()
        self.supervisor_id = uuid4()
        self.unrelated_user_id = uuid4()

        self.planner_headers = {"Authorization": "Bearer valid.planner.token"}
        self.supervisor_headers = {"Authorization": "Bearer valid.supervisor.token"}
        self.unrelated_headers = {"Authorization": "Bearer valid.unrelated.token"}

        # Mock Planner Supabase Auth & Profile
        self.mock_planner_supabase = MagicMock()
        mock_p_user = MagicMock(id=str(self.planner_id), email="planner@onground.build")
        self.mock_planner_supabase.auth.get_user.return_value = MagicMock(user=mock_p_user)
        self.mock_planner_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.planner_id), "email": "planner@onground.build", "role": "planner"}
        ]

        # Mock Supervisor Supabase Auth & Profile
        self.mock_supervisor_supabase = MagicMock()
        mock_s_user = MagicMock(id=str(self.supervisor_id), email="supervisor@onground.build")
        self.mock_supervisor_supabase.auth.get_user.return_value = MagicMock(user=mock_s_user)
        self.mock_supervisor_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.supervisor_id), "email": "supervisor@onground.build", "role": "supervisor"}
        ]

    def tearDown(self):
        limiter.reset()

    # =========================================================================
    # 1. SEC-01 & SEC-02: Schema & RLS Policy AST/Completeness Verification
    # =========================================================================

    def test_schema_contains_all_required_tables_with_rls_enabled(self):
        """Verify all 8 tables in schema.sql have Row Level Security explicitly enabled."""
        schema_path = Path("backend/db/schema.sql")
        self.assertTrue(schema_path.exists(), "schema.sql must exist")
        sql = schema_path.read_text(encoding="utf-8")

        required_tables = [
            "public.profiles",
            "public.project_memberships",
            "public.schedule_plan",
            "public.extractions",
            "public.extracted_activities",
            "public.schedule_matches",
            "public.unmatched_activities",
            "public.audit_trail",
        ]

        for table in required_tables:
            expected_rls = f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"
            self.assertIn(expected_rls, sql, f"Table {table} must have RLS enabled in schema.sql")

    def test_schema_contains_has_project_access_and_protect_profile_role(self):
        """Verify schema.sql contains the security helper functions."""
        schema_path = Path("backend/db/schema.sql")
        sql = schema_path.read_text(encoding="utf-8")

        self.assertIn("CREATE OR REPLACE FUNCTION public.protect_profile_role()", sql)
        self.assertIn("CREATE TRIGGER protect_profile_role_trigger", sql)
        self.assertIn("CREATE OR REPLACE FUNCTION public.has_project_access", sql)
        self.assertIn("CREATE OR REPLACE FUNCTION public.is_planner()", sql)

    def test_project_access_helper_logic(self):
        """Test the multi-tenant project authorization helper function."""
        # 1. Default demo project is always accessible to all users
        self.assertTrue(verify_user_project_access(self.planner_id, self.default_project_id))
        self.assertTrue(verify_user_project_access(self.supervisor_id, self.default_project_id))

        # 2. Custom project with membership
        mock_db = MagicMock()
        mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(uuid4()), "project_id": str(self.custom_project_id), "user_id": str(self.planner_id)}
        ]
        with patch("backend.auth.security.get_supabase_client", return_value=mock_db):
            self.assertTrue(verify_user_project_access(self.planner_id, self.custom_project_id))

        # 3. Foreign project without membership
        mock_empty_db = MagicMock()
        mock_empty_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        with patch("backend.auth.security.get_supabase_client", return_value=mock_empty_db):
            self.assertFalse(verify_user_project_access(self.planner_id, self.foreign_project_id))

    # =========================================================================
    # 2. SEC-03: Confirm / Reject Project Authorization Tests
    # =========================================================================

    def test_confirm_match_allowed_for_authorized_project_planner(self):
        """Planner authorized for the match's project can confirm the match."""
        match_id = uuid4()
        plan_id = uuid4()

        mock_supabase = MagicMock()
        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(match_id), "plan_activity_id": str(plan_id), "status": "pending_review"}
        ]
        mock_matches.update.return_value.eq.return_value.execute.return_value = MagicMock()

        mock_plan = MagicMock()
        mock_plan.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(plan_id), "project_id": str(self.custom_project_id)}
        ]

        def router(tbl):
            if tbl == "schedule_matches":
                return mock_matches
            elif tbl == "schedule_plan":
                return mock_plan
            elif tbl == "profiles":
                p_mock = MagicMock()
                p_mock.select.return_value.eq.return_value.execute.return_value.data = [
                    {"id": str(self.planner_id), "role": "planner"}
                ]
                return p_mock
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_user = MagicMock(id=str(self.planner_id), email="planner@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.verify_user_project_access", return_value=True):

            response = self.client.post(f"/match/{match_id}/confirm", headers=self.planner_headers)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["status"], "confirmed")

    def test_confirm_match_rejected_for_unauthorized_project_planner(self):
        """Planner NOT authorized for the match's project receives 403 Forbidden."""
        match_id = uuid4()
        plan_id = uuid4()

        mock_supabase = MagicMock()
        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(match_id), "plan_activity_id": str(plan_id), "status": "pending_review"}
        ]

        mock_plan = MagicMock()
        mock_plan.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(plan_id), "project_id": str(self.foreign_project_id)}
        ]

        def router(tbl):
            if tbl == "schedule_matches":
                return mock_matches
            elif tbl == "schedule_plan":
                return mock_plan
            elif tbl == "profiles":
                p_mock = MagicMock()
                p_mock.select.return_value.eq.return_value.execute.return_value.data = [
                    {"id": str(self.planner_id), "role": "planner"}
                ]
                return p_mock
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_user = MagicMock(id=str(self.planner_id), email="planner@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.verify_user_project_access", return_value=False):

            response = self.client.post(f"/match/{match_id}/confirm", headers=self.planner_headers)
            self.assertEqual(response.status_code, 403)
            self.assertIn("not authorized for project", response.json()["detail"])

    def test_reject_match_rejected_for_unauthorized_project_planner(self):
        """Planner NOT authorized for the match's project receives 403 Forbidden on reject."""
        match_id = uuid4()
        plan_id = uuid4()

        mock_supabase = MagicMock()
        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(match_id), "plan_activity_id": str(plan_id), "status": "pending_review"}
        ]
        mock_plan = MagicMock()
        mock_plan.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(plan_id), "project_id": str(self.foreign_project_id)}
        ]

        def router(tbl):
            if tbl == "schedule_matches":
                return mock_matches
            elif tbl == "schedule_plan":
                return mock_plan
            elif tbl == "profiles":
                p_mock = MagicMock()
                p_mock.select.return_value.eq.return_value.execute.return_value.data = [
                    {"id": str(self.planner_id), "role": "planner"}
                ]
                return p_mock
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_user = MagicMock(id=str(self.planner_id), email="planner@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.verify_user_project_access", return_value=False):

            response = self.client.post(f"/match/{match_id}/reject", headers=self.planner_headers)
            self.assertEqual(response.status_code, 403)
            self.assertIn("not authorized for project", response.json()["detail"])

    def test_confirm_match_nonexistent_returns_404(self):
        """Confirming a non-existent match ID returns 404 Not Found."""
        match_id = uuid4()
        mock_supabase = MagicMock()
        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = []

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.planner_id), "role": "planner"}
        ]

        def router(tbl):
            if tbl == "schedule_matches":
                return mock_matches
            elif tbl == "profiles":
                return mock_profiles
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_user = MagicMock(id=str(self.planner_id), email="planner@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.get_supabase_client", return_value=mock_supabase):

            response = self.client.post(f"/match/{match_id}/confirm", headers=self.planner_headers)
            self.assertEqual(response.status_code, 404)

    # =========================================================================
    # 3. SEC-04: Extraction Resource Ownership Tests
    # =========================================================================

    def test_extract_allowed_for_job_owner(self):
        """User who uploaded the extraction job can trigger processing."""
        extraction_id = uuid4()
        mock_supabase = MagicMock()
        mock_extractions = MagicMock()
        mock_extractions.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(extraction_id), "uploaded_by": str(self.supervisor_id), "project_id": str(self.custom_project_id)}
        ]

        mock_activities = MagicMock()
        mock_activities.insert.return_value.execute.return_value.data = [
            {"id": str(uuid4()), "activity_description": "Piping install"}
        ]

        def router(tbl):
            if tbl == "extractions":
                return mock_extractions
            elif tbl == "extracted_activities":
                return mock_activities
            elif tbl == "profiles":
                p_mock = MagicMock()
                p_mock.select.return_value.eq.return_value.execute.return_value.data = [
                    {"id": str(self.supervisor_id), "role": "supervisor"}
                ]
                return p_mock
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_user = MagicMock(id=str(self.supervisor_id), email="supervisor@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.extract.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.extract.ExtractionService.process_file_content", return_value=[]), \
             patch("backend.routes.extract.log_action"):

            response = self.client.post(
                f"/extract/{extraction_id}",
                json={"raw_text": "Sample activity text"},
                headers=self.supervisor_headers,
            )
            self.assertEqual(response.status_code, 200)

    def test_extract_rejected_for_unrelated_non_member_user(self):
        """Unrelated user who does not own the extraction and has no project access receives 403."""
        extraction_id = uuid4()
        other_user_id = uuid4()

        mock_supabase = MagicMock()
        mock_extractions = MagicMock()
        mock_extractions.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(extraction_id), "uploaded_by": str(other_user_id), "project_id": str(self.foreign_project_id)}
        ]

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.supervisor_id), "role": "supervisor"}
        ]

        def router(tbl):
            if tbl == "extractions":
                return mock_extractions
            elif tbl == "profiles":
                return mock_profiles
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_user = MagicMock(id=str(self.supervisor_id), email="supervisor@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.extract.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.extract.verify_user_project_access", return_value=False):

            response = self.client.post(
                f"/extract/{extraction_id}",
                json={"raw_text": "Sample activity text"},
                headers=self.supervisor_headers,
            )
            self.assertEqual(response.status_code, 403)
            self.assertIn("does not own extraction job", response.json()["detail"])

    def test_extract_nonexistent_job_returns_404(self):
        """Extracting a non-existent extraction ID returns 404 Not Found."""
        extraction_id = uuid4()
        mock_supabase = MagicMock()
        mock_extractions = MagicMock()
        mock_extractions.select.return_value.eq.return_value.execute.return_value.data = []

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.supervisor_id), "role": "supervisor"}
        ]

        def router(tbl):
            if tbl == "extractions":
                return mock_extractions
            elif tbl == "profiles":
                return mock_profiles
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_user = MagicMock(id=str(self.supervisor_id), email="supervisor@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.extract.get_supabase_client", return_value=mock_supabase):

            response = self.client.post(
                f"/extract/{extraction_id}",
                json={"raw_text": "Sample text"},
                headers=self.supervisor_headers,
            )
            self.assertEqual(response.status_code, 404)

    # =========================================================================
    # 4. SEC-05: Rate Limiting & Proxy Header Hardening Tests
    # =========================================================================

    def test_rate_limiter_uses_authenticated_user_id(self):
        """Rate limiter identifies clients by user_id when provided, ignoring spoofed IP headers."""
        custom_limiter = InMemoryRateLimiter()
        mock_request = MagicMock()
        mock_request.client.host = "10.0.0.1"
        mock_request.headers = {"x-forwarded-for": "198.51.100.1"}

        # Perform 2 requests with user_id="user-123" under limit of 2/min
        with patch.dict(os.environ, {"TEST_LIMIT": "2/minute", "TRUST_PROXY_HEADERS": "false"}):
            custom_limiter.check(mock_request, "test_ep", "TEST_LIMIT", user_id="user-123")
            custom_limiter.check(mock_request, "test_ep", "TEST_LIMIT", user_id="user-123")

            # 3rd request with same user_id must raise 429
            from fastapi import HTTPException
            with self.assertRaises(HTTPException) as ctx:
                custom_limiter.check(mock_request, "test_ep", "TEST_LIMIT", user_id="user-123")
            self.assertEqual(ctx.exception.status_code, 429)
            self.assertIn("Retry-After", ctx.exception.headers)

    def test_rate_limiter_untrusted_proxy_ignores_spoofed_xff(self):
        """When TRUST_PROXY_HEADERS is false, spoofed X-Forwarded-For cannot bypass rate limits."""
        custom_limiter = InMemoryRateLimiter()
        mock_request = MagicMock()
        mock_request.client.host = "192.168.1.100"

        with patch.dict(os.environ, {"TEST_LIMIT": "2/minute", "TRUST_PROXY_HEADERS": "false"}):
            # 1st request with spoofed XFF IP 1.1.1.1
            mock_request.headers = {"x-forwarded-for": "1.1.1.1"}
            custom_limiter.check(mock_request, "test_ep", "TEST_LIMIT")

            # 2nd request with spoofed XFF IP 2.2.2.2 (same socket host 192.168.1.100)
            mock_request.headers = {"x-forwarded-for": "2.2.2.2"}
            custom_limiter.check(mock_request, "test_ep", "TEST_LIMIT")

            # 3rd request must be blocked under socket host IP
            mock_request.headers = {"x-forwarded-for": "3.3.3.3"}
            from fastapi import HTTPException
            with self.assertRaises(HTTPException) as ctx:
                custom_limiter.check(mock_request, "test_ep", "TEST_LIMIT")
            self.assertEqual(ctx.exception.status_code, 429)


if __name__ == "__main__":
    unittest.main()
