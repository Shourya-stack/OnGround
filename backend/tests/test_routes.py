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


if __name__ == "__main__":
    unittest.main()
