"""
Integration / Route unit tests for FastAPI endpoints:
- GET /health
- POST /upload
- POST /extract/{id}
- POST /match/{id}
- POST /match/{id}/confirm (planner: 200, supervisor: 403)
- POST /match/{id}/reject (planner: 200, supervisor: 403)
"""

import io
import unittest
from uuid import uuid4
from fastapi.testclient import TestClient
from backend.main import app
from backend.tests.helpers import fake_db


from unittest.mock import patch, MagicMock
from backend.auth.rate_limiter import limiter


class TestRoutes(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        limiter.reset()
        self.user_id = uuid4()
        self.project_id = uuid4()
        self.auth_headers = {"Authorization": "Bearer valid.auth.token"}
        self.upload_form = {"project_id": str(self.project_id)}

        # Standard mock supabase client for authentication
        self.mock_auth_supabase = MagicMock()
        mock_user = MagicMock()
        mock_user.id = str(self.user_id)
        mock_user.email = "supervisor@onground.build"
        self.mock_auth_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
        self.mock_auth_supabase.table.side_effect = self._table_router

    def _table_router(self, name):
        """Per-table mocks: auth profile, project membership, extraction records."""
        m = MagicMock()

        if name == "profiles":
            m.select.return_value.eq.return_value.execute.return_value.data = [
                {"id": str(self.user_id), "email": "supervisor@onground.build", "role": "supervisor"}
            ]
        elif name == "project_memberships":
            m.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
                {"id": str(uuid4()), "role": "supervisor"}
            ]
        elif name == "extractions":
            record = {
                "id": str(uuid4()),
                "project_id": str(self.project_id),
                "uploaded_by": str(self.user_id),
                "file_url": "",
                "file_name": "report.txt",
                "status": "pending",
            }
            m.select.return_value.eq.return_value.execute.return_value.data = [record]
            m.insert.return_value.execute.return_value.data = [record]
            m.update.return_value.eq.return_value.execute.return_value.data = [record]
        elif name == "extracted_activities":
            m.insert.return_value.execute.return_value.data = [
                {"id": str(uuid4()), "activity_description": "sample"}
            ]
        elif name == "audit_trail":
            m.select.return_value.eq.return_value.execute.return_value.data = []
            m.insert.return_value.execute.return_value.data = [{}]

        return m

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["version"], "1.0.0")

    def test_upload_endpoint_valid_file(self):
        file_content = b"Daily report: fit-up of 12-inch pipe in unit 100."
        file = io.BytesIO(file_content)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.upload.get_supabase_client", return_value=self.mock_auth_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("report.txt", file, "text/plain")},
                data=self.upload_form,
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("extraction_id", data)
            self.assertEqual(data["status"], "pending")
            self.assertEqual(data["project_id"], str(self.project_id))

    def test_upload_endpoint_invalid_extension(self):
        file = io.BytesIO(b"Fake executable")
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("malicious.exe", file, "application/octet-stream")},
                data=self.upload_form,
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("Unsupported file format", response.json()["detail"])

    def test_extract_endpoint_direct_text(self):
        eid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase):
            with patch("backend.routes.extract.get_supabase_client", return_value=self.mock_auth_supabase):
                response = self.client.post(
                    f"/extract/{eid}",
                    json={"raw_text": "Fit-up and root welding of water piping in Unit 200 (08:00 to 16:00). Discipline: Piping."},
                    headers=self.auth_headers,
                )
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data["extraction_id"], str(eid))
                self.assertIn(data["status"], ["complete", "extracted"])
                self.assertGreaterEqual(data["activities_count"], 1)

    def test_match_endpoint_unknown_activity_returns_404(self):
        """
        An unknown activity id must 404. It previously returned 200 with a
        hardcoded "Piping fit-up ... Unit 200" activity invented by the route.
        """
        eid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.match.get_supabase_client", return_value=fake_db()):
            response = self.client.post(f"/match/{eid}", headers=self.auth_headers)
            self.assertEqual(response.status_code, 404)

    def test_match_endpoint_known_activity(self):
        eid = uuid4()
        activity_row = {
            "id": str(eid),
            "activity_description": "Piping fit-up and spool fabrication area 1",
            "discipline": "piping",
            "extraction_confidence": 0.9,
            "extractions": {"project_id": str(self.project_id)},
        }
        route_db = fake_db(table_rows={"extracted_activities": [activity_row]})

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.match.get_supabase_client", return_value=route_db), \
             patch("backend.services.matching_service.get_supabase_client", return_value=None):
            response = self.client.post(f"/match/{eid}", headers=self.auth_headers)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["extracted_activity_id"], str(eid))
            self.assertIn(data["status"], ("auto_linked", "pending_review", "unmatched"))

    def _review_mock(self, user_id, match_id, plan_id, project_id, role="planner",
                     match_extra=None, target_plan_id=None):
        """
        Build a Supabase mock wired for the review routes.

        Review now resolves the owning project before authorizing, so the match
        must carry a plan_activity_id and the plan must carry a project_id.
        """
        mock_supabase = MagicMock()
        mock_supabase.auth.get_user.return_value = MagicMock(
            user=MagicMock(id=str(user_id), email="planner@onground.build")
        )

        match_row = {
            "id": str(match_id),
            "plan_activity_id": str(plan_id),
            "extracted_activity_id": str(uuid4()),
            "confidence_score": 0.90,
            "status": "pending_review",
        }
        if match_extra:
            match_row.update(match_extra)

        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = [match_row]
        mock_matches.update.return_value.eq.return_value.execute.return_value.data = [match_row]

        plan_rows = [{"id": str(plan_id), "project_id": str(project_id), "activity_code": "CIV-101"}]
        if target_plan_id:
            plan_rows = [{"id": str(target_plan_id), "project_id": str(project_id), "activity_code": "CIV-101"}]

        mock_plan = MagicMock()
        mock_plan.select.return_value.eq.return_value.execute.return_value.data = plan_rows

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(user_id), "role": role}
        ]

        mock_unmatched = MagicMock()
        mock_unmatched.upsert.return_value.execute.return_value.data = [{"id": str(uuid4())}]

        def table_router(name):
            return {
                "schedule_matches": mock_matches,
                "schedule_plan": mock_plan,
                "profiles": mock_profiles,
                "unmatched_activities": mock_unmatched,
            }.get(name, MagicMock())

        mock_supabase.table.side_effect = table_router
        return mock_supabase, mock_matches

    def test_review_confirm_role_enforcement(self):
        match_id = uuid4()
        plan_id = uuid4()
        planner_id = uuid4()
        supervisor_id = uuid4()
        project_id = uuid4()

        # 1. Unauthenticated request must receive 401 Unauthorized
        unauth_resp = self.client.post(f"/match/{match_id}/confirm")
        self.assertEqual(unauth_resp.status_code, 401)

        # 2. Planner user role should succeed (200 OK)
        mock_planner, _ = self._review_mock(planner_id, match_id, plan_id, project_id)
        with patch("backend.auth.security.get_supabase_client", return_value=mock_planner), \
             patch("backend.routes.review.get_supabase_client", return_value=mock_planner), \
             patch("backend.auth.security.verify_user_project_access", return_value=True), \
             patch("backend.auth.security.get_user_project_role", return_value="planner"):
            planner_resp = self.client.post(
                f"/match/{match_id}/confirm",
                headers={"Authorization": "Bearer valid.planner.token"},
            )
            self.assertEqual(planner_resp.status_code, 200)
            self.assertEqual(planner_resp.json()["status"], "confirmed")

        # 3. Supervisor user role should be forbidden (403 Forbidden)
        mock_supervisor = MagicMock()
        mock_supervisor.auth.get_user.return_value = MagicMock(user=MagicMock(id=str(supervisor_id), email="supervisor@onground.build"))
        mock_supervisor.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(supervisor_id), "role": "supervisor"}
        ]
        with patch("backend.auth.security.get_supabase_client", return_value=mock_supervisor):
            supervisor_resp = self.client.post(
                f"/match/{match_id}/confirm",
                headers={"Authorization": "Bearer valid.supervisor.token"},
            )
            self.assertEqual(supervisor_resp.status_code, 403)
            self.assertIn("Forbidden", supervisor_resp.json()["detail"])

    def test_review_reject_role_enforcement(self):
        match_id = uuid4()
        plan_id = uuid4()
        planner_id = uuid4()
        supervisor_id = uuid4()
        project_id = uuid4()

        # 1. Unauthenticated request must receive 401 Unauthorized
        unauth_resp = self.client.post(f"/match/{match_id}/reject", json={"reason": "Test"})
        self.assertEqual(unauth_resp.status_code, 401)

        # 2. Planner user role should succeed (200 OK)
        mock_planner, _ = self._review_mock(planner_id, match_id, plan_id, project_id)
        with patch("backend.auth.security.get_supabase_client", return_value=mock_planner), \
             patch("backend.routes.review.get_supabase_client", return_value=mock_planner), \
             patch("backend.auth.security.verify_user_project_access", return_value=True), \
             patch("backend.auth.security.get_user_project_role", return_value="planner"):
            planner_resp = self.client.post(
                f"/match/{match_id}/reject",
                headers={"Authorization": "Bearer valid.planner.token"},
                json={"reason": "Incorrect work breakdown assignment"},
            )
            self.assertEqual(planner_resp.status_code, 200)
            body = planner_resp.json()
            self.assertEqual(body["status"], "rejected")
            # A rejected match returns the field evidence to the unmatched queue
            # instead of discarding it.
            self.assertIsNotNone(body["unmatched_id"])

        # 3. Supervisor user role should be forbidden (403 Forbidden)
        mock_supervisor = MagicMock()
        mock_supervisor.auth.get_user.return_value = MagicMock(user=MagicMock(id=str(supervisor_id), email="supervisor@onground.build"))
        mock_supervisor.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(supervisor_id), "role": "supervisor"}
        ]
        with patch("backend.auth.security.get_supabase_client", return_value=mock_supervisor):
            supervisor_resp = self.client.post(
                f"/match/{match_id}/reject",
                headers={"Authorization": "Bearer valid.supervisor.token"},
                json={"reason": "Supervisor attempt"},
            )
            self.assertEqual(supervisor_resp.status_code, 403)

    # =========================================================================
    # Step 5.2 Review Reassignment Tests
    # =========================================================================

    def test_reassign_endpoint_success(self):
        match_id = uuid4()
        plan_id = uuid4()
        target_plan_id = uuid4()
        planner_id = uuid4()
        project_id = uuid4()

        mock_supabase, _ = self._review_mock(
            planner_id, match_id, plan_id, project_id, target_plan_id=target_plan_id
        )

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.get_supabase_client", return_value=mock_supabase), \
             patch("backend.auth.security.verify_user_project_access", return_value=True), \
             patch("backend.auth.security.get_user_project_role", return_value="planner"):
            response = self.client.post(
                f"/match/{match_id}/reassign",
                headers={"Authorization": "Bearer valid.planner.token"},
                json={
                    "target_plan_activity_id": str(target_plan_id),
                    "reason": "Reassigning to correct civil foundation activity",
                },
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["match_id"], str(match_id))
            self.assertEqual(data["plan_activity_id"], str(target_plan_id))
            self.assertEqual(data["status"], "confirmed")
            self.assertEqual(data["resolved_by"], str(planner_id))

    def test_reassign_endpoint_rejects_cross_project_target(self):
        """A target activity in another project must not be linkable (F-04)."""
        match_id = uuid4()
        plan_id = uuid4()
        target_plan_id = uuid4()
        planner_id = uuid4()
        source_project_id = uuid4()
        other_project_id = uuid4()

        mock_supabase = MagicMock()
        mock_supabase.auth.get_user.return_value = MagicMock(
            user=MagicMock(id=str(planner_id), email="planner@onground.build")
        )

        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = [
            {
                "id": str(match_id),
                "plan_activity_id": str(plan_id),
                "extracted_activity_id": str(uuid4()),
                "confidence_score": 0.9,
                "status": "pending_review",
            }
        ]

        mock_plan = MagicMock()

        def plan_by_id(column, value):
            stub = MagicMock()
            if value == str(target_plan_id):
                stub.execute.return_value.data = [
                    {"id": str(target_plan_id), "project_id": str(other_project_id)}
                ]
            else:
                stub.execute.return_value.data = [
                    {"id": str(plan_id), "project_id": str(source_project_id)}
                ]
            return stub

        mock_plan.select.return_value.eq.side_effect = plan_by_id

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(planner_id), "role": "planner"}
        ]

        mock_supabase.table.side_effect = lambda name: {
            "schedule_matches": mock_matches,
            "schedule_plan": mock_plan,
            "profiles": mock_profiles,
        }.get(name, MagicMock())

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.get_supabase_client", return_value=mock_supabase), \
             patch("backend.auth.security.verify_user_project_access", return_value=True), \
             patch("backend.auth.security.get_user_project_role", return_value="planner"):
            response = self.client.post(
                f"/match/{match_id}/reassign",
                headers={"Authorization": "Bearer valid.planner.token"},
                json={"target_plan_activity_id": str(target_plan_id)},
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("Cross-project", response.json()["detail"])
            mock_matches.update.assert_not_called()


    def test_reassign_endpoint_role_enforcement(self):
        from unittest.mock import patch, MagicMock

        match_id = uuid4()
        target_plan_id = uuid4()
        supervisor_id = uuid4()

        # 1. Unauthenticated request must receive 401
        unauth_resp = self.client.post(
            f"/match/{match_id}/reassign",
            json={"target_plan_activity_id": str(target_plan_id)},
        )
        self.assertEqual(unauth_resp.status_code, 401)

        # 2. Supervisor must be forbidden (403)
        mock_supabase = MagicMock()
        mock_supabase.auth.get_user.return_value = MagicMock(user=MagicMock(id=str(supervisor_id), email="sup@onground.build"))
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(supervisor_id), "role": "supervisor"}
        ]

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            supervisor_resp = self.client.post(
                f"/match/{match_id}/reassign",
                headers={"Authorization": "Bearer valid.supervisor.token"},
                json={"target_plan_activity_id": str(target_plan_id)},
            )
            self.assertEqual(supervisor_resp.status_code, 403)
            self.assertIn("Forbidden", supervisor_resp.json()["detail"])

    def test_reassign_endpoint_invalid_body(self):
        from unittest.mock import patch, MagicMock

        match_id = uuid4()
        planner_id = uuid4()

        mock_supabase = MagicMock()
        mock_supabase.auth.get_user.return_value = MagicMock(user=MagicMock(id=str(planner_id), email="planner@onground.build"))
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(planner_id), "role": "planner"}
        ]

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            # 1. Missing target_plan_activity_id
            resp1 = self.client.post(
                f"/match/{match_id}/reassign",
                headers={"Authorization": "Bearer valid.planner.token"},
                json={"reason": "No target provided"},
            )
            self.assertEqual(resp1.status_code, 422)

            # 2. Malformed UUID
            resp2 = self.client.post(
                f"/match/{match_id}/reassign",
                headers={"Authorization": "Bearer valid.planner.token"},
                json={"target_plan_activity_id": "not-a-valid-uuid"},
            )
            self.assertEqual(resp2.status_code, 422)

    def test_reassign_endpoint_match_not_found_mock(self):
        from unittest.mock import patch, MagicMock

        match_id = uuid4()
        target_plan_id = uuid4()
        planner_id = uuid4()

        mock_supabase = MagicMock()
        mock_supabase.auth.get_user.return_value = MagicMock(user=MagicMock(id=str(planner_id), email="planner@onground.build"))

        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = []

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(planner_id), "role": "planner"}
        ]

        def table_router(table_name):
            if table_name == "profiles":
                return mock_profiles
            return mock_matches

        mock_supabase.table.side_effect = table_router

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            with patch("backend.routes.review.get_supabase_client", return_value=mock_supabase):
                response = self.client.post(
                    f"/match/{match_id}/reassign",
                    headers={"Authorization": "Bearer valid.planner.token"},
                    json={"target_plan_activity_id": str(target_plan_id)},
                )
                self.assertEqual(response.status_code, 404)
                self.assertIn("not found", response.json()["detail"])

    def test_reassign_endpoint_target_plan_not_found_mock(self):
        from unittest.mock import patch, MagicMock

        match_id = uuid4()
        target_plan_id = uuid4()
        planner_id = uuid4()

        mock_supabase = MagicMock()
        mock_supabase.auth.get_user.return_value = MagicMock(user=MagicMock(id=str(planner_id), email="planner@onground.build"))

        mock_matches = MagicMock()
        mock_matches.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(match_id), "confidence_score": 0.85, "status": "pending_review"}
        ]

        mock_plan = MagicMock()
        mock_plan.select.return_value.eq.return_value.execute.return_value.data = []

        mock_profiles = MagicMock()
        mock_profiles.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(planner_id), "role": "planner"}
        ]

        def table_router(table_name):
            if table_name == "schedule_matches":
                return mock_matches
            elif table_name == "schedule_plan":
                return mock_plan
            elif table_name == "profiles":
                return mock_profiles
            return MagicMock()

        mock_supabase.table.side_effect = table_router

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            with patch("backend.routes.review.get_supabase_client", return_value=mock_supabase):
                response = self.client.post(
                    f"/match/{match_id}/reassign",
                    headers={"Authorization": "Bearer valid.planner.token"},
                    json={"target_plan_activity_id": str(target_plan_id)},
                )
                self.assertEqual(response.status_code, 404)
                self.assertIn("Target schedule plan activity", response.json()["detail"])

    def test_reassign_endpoint_updates_match_and_logs_audit_mock(self):
        match_id = uuid4()
        plan_id = uuid4()
        target_plan_id = uuid4()
        planner_id = uuid4()
        project_id = uuid4()

        mock_supabase, mock_matches_table = self._review_mock(
            planner_id,
            match_id,
            plan_id,
            project_id,
            target_plan_id=target_plan_id,
            match_extra={"confidence_score": 0.82},
        )

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.review.get_supabase_client", return_value=mock_supabase), \
             patch("backend.auth.security.verify_user_project_access", return_value=True), \
             patch("backend.auth.security.get_user_project_role", return_value="planner"), \
             patch("backend.routes.review.log_action") as mock_log:
            response = self.client.post(
                f"/match/{match_id}/reassign",
                headers={"Authorization": "Bearer valid.planner.token"},
                json={
                    "target_plan_activity_id": str(target_plan_id),
                    "reason": "Correct assignment verified",
                },
            )
            self.assertEqual(response.status_code, 200)

            # Verify UPDATE was called on schedule_matches, NOT insert
            mock_matches_table.update.assert_called_once()
            update_payload = mock_matches_table.update.call_args[0][0]
            self.assertEqual(update_payload["plan_activity_id"], str(target_plan_id))
            self.assertEqual(update_payload["status"], "confirmed")
            self.assertEqual(update_payload["resolved_by"], str(planner_id))

            # Verify audit logging
            mock_log.assert_called_once()
            log_kwargs = mock_log.call_args[1]
            self.assertEqual(log_kwargs["action"], "manually_linked")
            self.assertEqual(log_kwargs["entity_type"], "schedule_matches")
            self.assertEqual(log_kwargs["entity_id"], match_id)
            self.assertEqual(log_kwargs["actor_id"], planner_id)
            self.assertEqual(log_kwargs["project_id"], project_id)
            self.assertEqual(log_kwargs["confidence_score"], 0.82)

    # =========================================================================
    # Step 5.1 Read / Query Endpoint Tests
    # =========================================================================

    def test_get_schedule_endpoint(self):
        pid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase):
            response = self.client.get(f"/schedule?project_id={pid}", headers=self.auth_headers)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_schedule_with_filters(self):
        pid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase):
            response = self.client.get(f"/schedule?project_id={pid}&discipline=piping&limit=10&offset=0", headers=self.auth_headers)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_reports_endpoint(self):
        pid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase):
            response = self.client.get(f"/reports?project_id={pid}", headers=self.auth_headers)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_reports_with_filters(self):
        pid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase):
            response = self.client.get(f"/reports?project_id={pid}&status=complete&limit=5&offset=0", headers=self.auth_headers)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_matches_endpoint(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.match.get_supabase_client", return_value=fake_db()):
            response = self.client.get(
                f"/matches?project_id={self.project_id}", headers=self.auth_headers
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_matches_requires_project_id(self):
        """project_id is mandatory: omitting it must not return every project's data."""
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase):
            response = self.client.get("/matches", headers=self.auth_headers)
            self.assertEqual(response.status_code, 422)

    def test_get_matches_with_filters(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.match.get_supabase_client", return_value=fake_db()):
            response = self.client.get(
                f"/matches?project_id={self.project_id}&status=pending_review&discipline=piping&limit=10&offset=0",
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_unmatched_endpoint(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.match.get_supabase_client", return_value=fake_db()):
            response = self.client.get(
                f"/unmatched?project_id={self.project_id}", headers=self.auth_headers
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_unmatched_with_filters(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.match.get_supabase_client", return_value=fake_db()):
            response = self.client.get(
                f"/unmatched?project_id={self.project_id}&resolution=unresolved&limit=10&offset=0",
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_audit_endpoint(self):
        pid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.audit.get_supabase_client", return_value=fake_db()):
            response = self.client.get(f"/audit?project_id={pid}", headers=self.auth_headers)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_audit_with_filters(self):
        pid = uuid4()
        actor_id = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.audit.get_supabase_client", return_value=fake_db()):
            response = self.client.get(f"/audit?project_id={pid}&action=confirmed&actor={actor_id}&limit=10&offset=0", headers=self.auth_headers)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIsInstance(data, list)

    def test_get_analytics_endpoint(self):
        pid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.analytics.get_supabase_client", return_value=fake_db()):
            response = self.client.get(f"/analytics?project_id={pid}", headers=self.auth_headers)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("total_planned_activities", data)
            self.assertIn("total_extractions", data)
            self.assertIn("total_extracted_activities", data)
            self.assertIn("total_matches", data)
            self.assertIn("matches_by_status", data)
            self.assertIn("total_unmatched", data)
            self.assertIn("unmatched_by_resolution", data)
            self.assertIn("total_audit_events", data)
            self.assertIn("auto_linked", data["matches_by_status"])
            self.assertIn("pending_review", data["matches_by_status"])
            self.assertIn("confirmed", data["matches_by_status"])
            self.assertIn("rejected", data["matches_by_status"])
            self.assertIn("unresolved", data["unmatched_by_resolution"])

    def test_get_analytics_with_project_filter(self):
        pid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_auth_supabase), \
             patch("backend.routes.analytics.get_supabase_client", return_value=fake_db()):
            response = self.client.get(f"/analytics?project_id={pid}", headers=self.auth_headers)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("total_planned_activities", data)
            self.assertIsInstance(data["total_planned_activities"], int)


if __name__ == "__main__":
    unittest.main()

