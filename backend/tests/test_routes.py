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


class TestRoutes(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["version"], "1.0.0")

    def test_upload_endpoint_valid_file(self):
        file_content = b"Daily report: fit-up of 12-inch pipe in unit 100."
        file = io.BytesIO(file_content)
        response = self.client.post(
            "/upload",
            files={"file": ("report.txt", file, "text/plain")},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("extraction_id", data)
        self.assertEqual(data["status"], "pending")

    def test_upload_endpoint_invalid_extension(self):
        file = io.BytesIO(b"Fake executable")
        response = self.client.post(
            "/upload",
            files={"file": ("malicious.exe", file, "application/octet-stream")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file format", response.json()["detail"])

    def test_extract_endpoint_direct_text(self):
        eid = uuid4()
        response = self.client.post(
            f"/extract/{eid}",
            json={"raw_text": "Fit-up and root welding of water piping in Unit 200 (08:00 to 16:00). Discipline: Piping."},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["extraction_id"], str(eid))
        self.assertIn(data["status"], ["complete", "extracted"])
        self.assertGreaterEqual(data["activities_count"], 1)

    def test_match_endpoint(self):
        eid = uuid4()
        response = self.client.post(f"/match/{eid}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["extracted_activity_id"], str(eid))
        self.assertIn(data["status"], ("auto_linked", "pending_review", "unmatched"))

    def test_review_confirm_role_enforcement(self):
        match_id = uuid4()

        # 1. Planner user role should succeed (200 OK)
        planner_resp = self.client.post(
            f"/match/{match_id}/confirm",
            headers={"X-User-Role": "planner"},
        )
        self.assertEqual(planner_resp.status_code, 200)
        self.assertEqual(planner_resp.json()["status"], "confirmed")

        # 2. Supervisor user role should be forbidden (403 Forbidden)
        supervisor_resp = self.client.post(
            f"/match/{match_id}/confirm",
            headers={"X-User-Role": "supervisor"},
        )
        self.assertEqual(supervisor_resp.status_code, 403)
        self.assertIn("Forbidden", supervisor_resp.json()["detail"])

    def test_review_reject_role_enforcement(self):
        match_id = uuid4()

        # 1. Planner user role should succeed (200 OK)
        planner_resp = self.client.post(
            f"/match/{match_id}/reject",
            headers={"X-User-Role": "planner"},
            json={"reason": "Incorrect work breakdown assignment"},
        )
        self.assertEqual(planner_resp.status_code, 200)
        self.assertEqual(planner_resp.json()["status"], "rejected")

        # 2. Supervisor user role should be forbidden (403 Forbidden)
        supervisor_resp = self.client.post(
            f"/match/{match_id}/reject",
            headers={"X-User-Role": "supervisor"},
            json={"reason": "Supervisor attempt"},
        )
        self.assertEqual(supervisor_resp.status_code, 403)

    # =========================================================================
    # Step 5.1 Read / Query Endpoint Tests
    # =========================================================================

    def test_get_schedule_endpoint(self):
        response = self.client.get("/schedule")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_schedule_with_filters(self):
        pid = uuid4()
        response = self.client.get(f"/schedule?project_id={pid}&discipline=piping&limit=10&offset=0")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_reports_endpoint(self):
        response = self.client.get("/reports")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_reports_with_filters(self):
        pid = uuid4()
        response = self.client.get(f"/reports?project_id={pid}&status=complete&limit=5&offset=0")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_matches_endpoint(self):
        response = self.client.get("/matches")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_matches_with_filters(self):
        pid = uuid4()
        response = self.client.get(f"/matches?project_id={pid}&status=pending_review&discipline=piping&limit=10&offset=0")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_unmatched_endpoint(self):
        response = self.client.get("/unmatched")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_unmatched_with_filters(self):
        response = self.client.get("/unmatched?resolution=unresolved&limit=10&offset=0")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_audit_endpoint(self):
        response = self.client.get("/audit")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_audit_with_filters(self):
        actor_id = uuid4()
        response = self.client.get(f"/audit?action=confirmed&actor={actor_id}&limit=10&offset=0")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_get_analytics_endpoint(self):
        response = self.client.get("/analytics")
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
        response = self.client.get(f"/analytics?project_id={pid}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_planned_activities", data)
        self.assertIsInstance(data["total_planned_activities"], int)


if __name__ == "__main__":
    unittest.main()

