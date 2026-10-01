"""
Unit & integration tests for Step 6.3 P2 Security & Reliability Hardening:
- F-04: Reassign project consistency verification
- F-05: Authenticate GET /audit endpoint
- F-06: Extraction failure recovery and state transitions
"""

import unittest
from uuid import uuid4
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import ExtractedActivityCreate
from backend.auth.rate_limiter import limiter
from backend.tests.helpers import fake_db


class TestP2SecurityHardening(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        limiter.reset()
        self.planner_id = uuid4()
        self.supervisor_id = uuid4()
        self.project_id = uuid4()
        self.planner_headers = {"Authorization": "Bearer valid.planner.jwt"}
        self.supervisor_headers = {"Authorization": "Bearer valid.supervisor.jwt"}

        # Planner mock Supabase Auth
        self.mock_planner_supabase = MagicMock()
        mock_planner_user = MagicMock()
        mock_planner_user.id = str(self.planner_id)
        mock_planner_user.email = "planner@onground.build"
        self.mock_planner_supabase.auth.get_user.return_value = MagicMock(user=mock_planner_user)
        self.mock_planner_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.planner_id), "email": "planner@onground.build", "role": "planner"}
        ]

        # Supervisor mock Supabase Auth
        self.mock_supervisor_supabase = MagicMock()
        mock_supervisor_user = MagicMock()
        mock_supervisor_user.id = str(self.supervisor_id)
        mock_supervisor_user.email = "supervisor@onground.build"
        self.mock_supervisor_supabase.auth.get_user.return_value = MagicMock(user=mock_supervisor_user)
        self.mock_supervisor_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.supervisor_id), "email": "supervisor@onground.build", "role": "supervisor"}
        ]

    # =========================================================================
    # F-04: Reassign Project Consistency Tests
    # =========================================================================

    def test_reassign_same_project_succeeds(self):
        match_id = uuid4()
        current_plan_id = uuid4()
        target_plan_id = uuid4()
        project_id = uuid4()

        mock_supabase = MagicMock()
        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(match_id), "plan_activity_id": str(current_plan_id), "confidence_score": 0.85}
        ]
        mock_matches.update.return_value.eq.return_value.execute.return_value = MagicMock()

        mock_plan = MagicMock()
        # Returns current plan with project_id, then target plan with same project_id
        mock_plan.select.return_value.eq.return_value.execute.side_effect = [
            MagicMock(data=[{"id": str(target_plan_id), "project_id": str(project_id)}]),  # target plan
            MagicMock(data=[{"id": str(current_plan_id), "project_id": str(project_id)}]), # source plan
        ]

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.planner_id), "role": "planner"}
        ]

        mock_memberships = MagicMock()
        mock_memberships.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(uuid4()), "project_id": str(project_id), "user_id": str(self.planner_id)}
        ]

        def router(tbl):
            if tbl == "schedule_matches":
                return mock_matches
            elif tbl == "schedule_plan":
                return mock_plan
            elif tbl == "profiles":
                return mock_profiles
            elif tbl == "project_memberships":
                return mock_memberships
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_planner_user = MagicMock(id=str(self.planner_id), email="planner@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_planner_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            with patch("backend.routes.review.get_supabase_client", return_value=mock_supabase):
                with patch("backend.routes.review.log_action") as mock_log:
                    response = self.client.post(
                        f"/match/{match_id}/reassign",
                        headers=self.planner_headers,
                        json={"target_plan_activity_id": str(target_plan_id), "reason": "Valid reassignment"},
                    )
                    self.assertEqual(response.status_code, 200)
                    mock_matches.update.assert_called_once()
                    mock_log.assert_called_once()

    def test_reassign_cross_project_mismatch_rejected(self):
        match_id = uuid4()
        current_plan_id = uuid4()
        target_plan_id = uuid4()
        project_a = uuid4()
        project_b = uuid4()

        mock_supabase = MagicMock()
        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(match_id), "plan_activity_id": str(current_plan_id), "confidence_score": 0.85}
        ]
        mock_matches.update.return_value.eq.return_value.execute.return_value = MagicMock()

        mock_plan = MagicMock()
        # Target plan is in project_b, source plan is in project_a
        mock_plan.select.return_value.eq.return_value.execute.side_effect = [
            MagicMock(data=[{"id": str(target_plan_id), "project_id": str(project_b)}]),
            MagicMock(data=[{"id": str(current_plan_id), "project_id": str(project_a)}]),
        ]

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.planner_id), "role": "planner"}
        ]

        def router(tbl):
            if tbl == "schedule_matches":
                return mock_matches
            elif tbl == "schedule_plan":
                return mock_plan
            elif tbl == "profiles":
                return mock_profiles
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_planner_user = MagicMock(id=str(self.planner_id), email="planner@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_planner_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            with patch("backend.routes.review.get_supabase_client", return_value=mock_supabase):
                with patch("backend.routes.review.log_action") as mock_log:
                    response = self.client.post(
                        f"/match/{match_id}/reassign",
                        headers=self.planner_headers,
                        json={"target_plan_activity_id": str(target_plan_id), "reason": "Cross project test"},
                    )
                    self.assertEqual(response.status_code, 400)
                    self.assertIn("different projects", response.json()["detail"])
                    # Match must NOT be updated
                    mock_matches.update.assert_not_called()
                    # Audit log must NOT be created
                    mock_log.assert_not_called()

    def test_reassign_target_plan_not_found_returns_404(self):
        match_id = uuid4()
        target_plan_id = uuid4()

        mock_supabase = MagicMock()
        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(match_id), "confidence_score": 0.85}
        ]

        mock_plan = MagicMock()
        mock_plan.select.return_value.eq.return_value.execute.return_value.data = []

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.planner_id), "role": "planner"}
        ]

        def router(tbl):
            if tbl == "schedule_matches":
                return mock_matches
            elif tbl == "schedule_plan":
                return mock_plan
            elif tbl == "profiles":
                return mock_profiles
            return MagicMock()

        mock_supabase.table.side_effect = router
        mock_planner_user = MagicMock(id=str(self.planner_id), email="planner@onground.build")
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_planner_user)

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            with patch("backend.routes.review.get_supabase_client", return_value=mock_supabase):
                response = self.client.post(
                    f"/match/{match_id}/reassign",
                    headers=self.planner_headers,
                    json={"target_plan_activity_id": str(target_plan_id)},
                )
                self.assertEqual(response.status_code, 404)

    def test_reassign_non_planner_role_forbidden(self):
        match_id = uuid4()
        target_plan_id = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supervisor_supabase):
            response = self.client.post(
                f"/match/{match_id}/reassign",
                headers=self.supervisor_headers,
                json={"target_plan_activity_id": str(target_plan_id)},
            )
            self.assertEqual(response.status_code, 403)

    # =========================================================================
    # F-05: Authenticate Audit Query Tests
    # =========================================================================

    def test_get_audit_without_token_returns_401(self):
        response = self.client.get("/audit")
        self.assertEqual(response.status_code, 401)

    def test_get_audit_with_invalid_token_returns_401(self):
        mock_auth = MagicMock()
        mock_auth.auth.get_user.side_effect = Exception("Invalid token")
        with patch("backend.auth.security.get_supabase_client", return_value=mock_auth):
            response = self.client.get("/audit", headers={"Authorization": "Bearer invalid.token"})
            self.assertEqual(response.status_code, 401)

    def test_get_audit_without_project_id_returns_422(self):
        """Audit is project-scoped; project_id may not be omitted."""
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            response = self.client.get("/audit", headers=self.planner_headers)
            self.assertEqual(response.status_code, 422)

    def test_get_audit_with_planner_token_allowed(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase), \
             patch("backend.routes.audit.get_supabase_client", return_value=fake_db()):
            response = self.client.get(f"/audit?project_id={self.project_id}", headers=self.planner_headers)
            self.assertEqual(response.status_code, 200)
            self.assertIsInstance(response.json(), list)

    def test_get_audit_with_supervisor_token_allowed(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supervisor_supabase), \
             patch("backend.routes.audit.get_supabase_client", return_value=fake_db()):
            response = self.client.get(f"/audit?project_id={self.project_id}", headers=self.supervisor_headers)
            self.assertEqual(response.status_code, 200)
            self.assertIsInstance(response.json(), list)

    def test_get_audit_preserves_query_filters(self):
        actor_id = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase), \
             patch("backend.routes.audit.get_supabase_client", return_value=fake_db()):
            response = self.client.get(
                f"/audit?project_id={self.project_id}&action=confirmed&actor={actor_id}&limit=10&offset=5",
                headers=self.planner_headers,
            )
            self.assertEqual(response.status_code, 200)

    # =========================================================================
    # F-06: Extraction Failure Recovery & Status Transition Tests
    # =========================================================================

    def _assert_status_update(self, mock_table, expected_status):
        """
        Assert some `update()` call carried the expected status.

        Status updates now also carry `error_message`, so an exact-dict
        assert_any_call no longer expresses the intent.
        """
        seen = []
        for call in mock_table.update.call_args_list:
            payload = call.args[0] if call.args else {}
            if isinstance(payload, dict):
                seen.append(payload.get("status"))
        self.assertIn(
            expected_status,
            seen,
            f"No update() call set status={expected_status!r}; saw {seen!r}",
        )

    def test_extraction_service_failure_marks_status_failed(self):
        extraction_id = uuid4()
        project_id = uuid4()
        mock_supabase = MagicMock()
        mock_extractions = MagicMock()
        # Record exists
        mock_extractions.select.return_value.eq.return_value.execute.return_value.data = [
            {
                "id": str(extraction_id),
                "project_id": str(project_id),
                "uploaded_by": str(self.planner_id),
                "status": "pending",
                "file_url": "reports/report.txt",
            }
        ]
        mock_supabase.table.return_value = mock_extractions

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            with patch("backend.routes.extract.get_supabase_client", return_value=mock_supabase):
                with patch("backend.routes.extract.ExtractionService.process_file_content", side_effect=ValueError("Corrupted report syntax")):
                    response = self.client.post(
                        f"/extract/{extraction_id}",
                        headers=self.planner_headers,
                        json={"raw_text": "corrupt data"},
                    )
                    self.assertEqual(response.status_code, 500)
                    # Verify status was updated to 'failed'
                    self._assert_status_update(mock_extractions, "failed")

    def test_extraction_db_insert_failure_marks_status_failed(self):
        extraction_id = uuid4()
        project_id = uuid4()
        mock_supabase = MagicMock()
        mock_extractions = MagicMock()
        mock_extractions.select.return_value.eq.return_value.execute.return_value.data = [
            {
                "id": str(extraction_id),
                "project_id": str(project_id),
                "uploaded_by": str(self.planner_id),
                "status": "pending",
            }
        ]

        mock_activities = MagicMock()
        mock_activities.insert.return_value.execute.side_effect = Exception("DB insert conflict")

        def table_router(tbl):
            if tbl == "extractions":
                return mock_extractions
            elif tbl == "extracted_activities":
                return mock_activities
            return MagicMock()

        mock_supabase.table.side_effect = table_router

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            with patch("backend.routes.extract.get_supabase_client", return_value=mock_supabase):
                response = self.client.post(
                    f"/extract/{extraction_id}",
                    headers=self.planner_headers,
                    json={"raw_text": "Civil excavation complete (08:00 to 16:00). Discipline: Civil."},
                )
                self.assertEqual(response.status_code, 500)
                self._assert_status_update(mock_extractions, "failed")

    def test_extraction_missing_record_returns_404_without_updating_failed(self):
        extraction_id = uuid4()
        mock_supabase = MagicMock()
        mock_extractions = MagicMock()
        # Record does not exist
        mock_extractions.select.return_value.eq.return_value.execute.return_value.data = []
        mock_supabase.table.return_value = mock_extractions

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            with patch("backend.routes.extract.get_supabase_client", return_value=mock_supabase):
                response = self.client.post(
                    f"/extract/{extraction_id}",
                    headers=self.planner_headers,
                    json={"raw_text": "sample text"},
                )
                self.assertEqual(response.status_code, 404)
                mock_extractions.update.assert_not_called()

    def test_extraction_without_project_id_is_data_integrity_error(self):
        """
        project_id is NOT NULL in the schema. A record missing it is corrupt data
        and must surface as 500, not be silently treated as accessible.
        """
        extraction_id = uuid4()
        mock_supabase = MagicMock()
        mock_extractions = MagicMock()
        mock_extractions.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(extraction_id), "status": "pending"}
        ]
        mock_supabase.table.return_value = mock_extractions

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            with patch("backend.routes.extract.get_supabase_client", return_value=mock_supabase):
                response = self.client.post(
                    f"/extract/{extraction_id}",
                    headers=self.planner_headers,
                    json={"raw_text": "sample text"},
                )
                self.assertEqual(response.status_code, 500)
                self.assertIn("project", response.json()["detail"].lower())

    def test_extraction_success_marks_complete(self):
        extraction_id = uuid4()
        project_id = uuid4()
        mock_supabase = MagicMock()
        mock_extractions = MagicMock()
        mock_extractions.select.return_value.eq.return_value.execute.return_value.data = [
            {
                "id": str(extraction_id),
                "project_id": str(project_id),
                "uploaded_by": str(self.planner_id),
                "status": "pending",
            }
        ]
        mock_activities = MagicMock()
        mock_activities.insert.return_value.execute.return_value.data = [
            {"id": str(uuid4()), "activity_description": "Piping fitup"}
        ]

        def table_router(tbl):
            if tbl == "extractions":
                return mock_extractions
            elif tbl == "extracted_activities":
                return mock_activities
            return MagicMock()

        mock_supabase.table.side_effect = table_router
        mock_extracted_data = [
            ExtractedActivityCreate(
                extraction_id=extraction_id,
                activity_description="Piping fitup",
                discipline="piping",
                extraction_confidence=0.95,
            )
        ]

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_planner_supabase):
            with patch("backend.routes.extract.get_supabase_client", return_value=mock_supabase):
                with patch("backend.services.extraction_service.ExtractionService.process_file_content", return_value=mock_extracted_data):
                    with patch("backend.routes.extract.log_action"):
                        response = self.client.post(
                            f"/extract/{extraction_id}",
                            headers=self.planner_headers,
                            json={"raw_text": "Fit-up of 12-inch pipe in Unit 200 (08:00 to 14:00). Discipline: Piping."},
                        )
                        self.assertEqual(response.status_code, 200)
                        self._assert_status_update(mock_extractions, "processing")
                        self._assert_status_update(mock_extractions, "complete")


if __name__ == "__main__":
    unittest.main()
