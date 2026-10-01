"""
Unit and integration tests for Step 6.2 Security Hardening:
- F-01: Authentication on Ingestion/Matching mutation endpoints (/upload, /extract/{id}, /match/{id})
- F-02: Magic-byte and file signature validation
- F-03: Rate limiting on expensive endpoints

NOTE: /upload is now project-scoped — `project_id` is a required form field and is
authorized against project_memberships. Previously the route hardcoded
project_id='00000000-0000-0000-0000-000000000001' for every upload.
"""

import io
import os
import unittest
from unittest.mock import patch, MagicMock
from uuid import uuid4
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.rate_limiter import limiter


class TestSecurityHardening(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        limiter.reset()

        self.user_id = uuid4()
        self.project_id = uuid4()
        self.auth_headers = {"Authorization": "Bearer valid.security.token"}

        # Required form payload for project-scoped uploads
        self.upload_form = {"project_id": str(self.project_id)}

        # Mock authenticated user with 'supervisor' role
        self.mock_supabase = MagicMock()
        mock_user = MagicMock()
        mock_user.id = str(self.user_id)
        mock_user.email = "supervisor@onground.build"
        self.mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
        self.mock_supabase.table.side_effect = self._table_router

    def _table_router(self, name):
        """Return per-table mocks so auth, membership, and extraction all resolve."""
        m = MagicMock()

        if name == "profiles":
            m.select.return_value.eq.return_value.execute.return_value.data = [
                {
                    "id": str(self.user_id),
                    "email": "supervisor@onground.build",
                    "role": "supervisor",
                }
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

        return m

    def tearDown(self):
        limiter.reset()

    def _upload(self, filename, content, content_type):
        """Helper: authenticated, project-scoped upload."""
        return self.client.post(
            "/upload",
            files={"file": (filename, io.BytesIO(content), content_type)},
            data=self.upload_form,
            headers=self.auth_headers,
        )

    # =========================================================================
    # F-01: Authentication Tests
    # =========================================================================
    def test_upload_without_auth_returns_401(self):
        file = io.BytesIO(b"Daily site report")
        response = self.client.post(
            "/upload",
            files={"file": ("report.txt", file, "text/plain")},
            data=self.upload_form,
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("Missing Authorization header", response.json()["detail"])

    def test_upload_with_invalid_token_returns_401(self):
        file = io.BytesIO(b"Daily site report")
        mock_bad_supabase = MagicMock()
        mock_bad_supabase.auth.get_user.side_effect = Exception("Expired token")

        with patch("backend.auth.security.get_supabase_client", return_value=mock_bad_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("report.txt", file, "text/plain")},
                data=self.upload_form,
                headers={"Authorization": "Bearer invalid.expired.token"},
            )
            self.assertEqual(response.status_code, 401)

    def test_upload_without_project_id_returns_422(self):
        """project_id is mandatory: uploads must declare their target project."""
        file = io.BytesIO(b"Daily site report text")
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("report.txt", file, "text/plain")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 422)

    def test_upload_rejected_for_non_member_project(self):
        """A user with no membership row cannot upload into that project."""
        no_access = MagicMock()
        mock_user = MagicMock()
        mock_user.id = str(self.user_id)
        mock_user.email = "supervisor@onground.build"
        no_access.auth.get_user.return_value = MagicMock(user=mock_user)

        def router(name):
            m = MagicMock()
            if name == "profiles":
                m.select.return_value.eq.return_value.execute.return_value.data = [
                    {"id": str(self.user_id), "role": "supervisor"}
                ]
            elif name == "project_memberships":
                m.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
            return m

        no_access.table.side_effect = router

        with patch("backend.auth.security.get_supabase_client", return_value=no_access):
            response = self.client.post(
                "/upload",
                files={"file": ("report.txt", io.BytesIO(b"text"), "text/plain")},
                data=self.upload_form,
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 403)

    def test_upload_with_valid_auth_succeeds(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.upload.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("report.txt", b"Daily site report text", "text/plain")
            self.assertEqual(response.status_code, 200)
            self.assertIn("extraction_id", response.json())

    def test_upload_sanitizes_traversal_filename(self):
        """A path-traversal filename must not escape data/uploads."""
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.upload.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("../../../evil.txt", b"malicious payload", "text/plain")
            self.assertEqual(response.status_code, 200)
            body = response.json()
            self.assertNotIn("..", body["file_name"])
            self.assertNotIn("/", body["file_name"])
            self.assertEqual(body["file_name"], "evil.txt")

    def test_extract_without_auth_returns_401(self):
        eid = uuid4()
        response = self.client.post(f"/extract/{eid}", json={"raw_text": "Sample activity"})
        self.assertEqual(response.status_code, 401)

    def test_extract_with_valid_auth_succeeds(self):
        eid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.extract.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.extract.ExtractionService.process_file_content", return_value=[]):
            response = self.client.post(
                f"/extract/{eid}",
                json={"raw_text": "Welding of piping Unit 100."},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 200)

    def test_match_without_auth_returns_401(self):
        eid = uuid4()
        response = self.client.post(f"/match/{eid}")
        self.assertEqual(response.status_code, 401)

    def test_match_with_valid_auth_succeeds(self):
        eid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(f"/match/{eid}", headers=self.auth_headers)
            # Authentication passes; the activity itself does not resolve to a real
            # record, which is now an honest 404 instead of fabricated match data.
            self.assertIn(response.status_code, (200, 404))
            self.assertNotEqual(response.status_code, 401)

    # =========================================================================
    # F-02: File Signature / Magic-Byte Validation Tests
    # =========================================================================
    def test_pdf_valid_magic_bytes_accepted(self):
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.upload.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("report.pdf", pdf_content, "application/pdf")
            self.assertEqual(response.status_code, 200)

    def test_pdf_fake_signature_rejected(self):
        fake_pdf = b"MZ\x90\x00\x03\x00\x00\x00Windows Executable disguised as PDF"
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("malicious.pdf", fake_pdf, "application/pdf")
            self.assertEqual(response.status_code, 400)
            self.assertIn("Invalid PDF file", response.json()["detail"])

    def test_xlsx_valid_zip_container_accepted(self):
        # ZIP magic bytes: PK\x03\x04
        xlsx_content = b"PK\x03\x04\x14\x00\x06\x00Mock Excel OpenXML spreadsheet stream"
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.upload.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload(
                "progress.xlsx",
                xlsx_content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            self.assertEqual(response.status_code, 200)

    def test_xlsx_invalid_container_rejected(self):
        fake_xlsx = b"Not a real ZIP container for excel"
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload(
                "fake.xlsx",
                fake_xlsx,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("Invalid XLSX file", response.json()["detail"])

    def test_xls_valid_ole_signature_accepted(self):
        # OLE Compound File: D0 CF 11 E0 A1 B1 1A E1
        ole_header = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1" + b"\x00" * 32
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.upload.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("legacy.xls", ole_header, "application/vnd.ms-excel")
            self.assertEqual(response.status_code, 200)

    def test_xls_invalid_signature_rejected(self):
        fake_xls = b"Plain text renamed to legacy excel format"
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("corrupt.xls", fake_xls, "application/vnd.ms-excel")
            self.assertEqual(response.status_code, 400)
            self.assertIn("Invalid XLS file", response.json()["detail"])

    def test_txt_and_csv_plausible_text_accepted(self):
        text_content = b"WBS,Activity Description,Discipline\nPIP-101,Fit-up of cooling line,piping\n"
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.upload.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("data.csv", text_content, "text/csv")
            self.assertEqual(response.status_code, 200)

    def test_txt_binary_null_bytes_rejected(self):
        binary_disguised_as_txt = b"Some initial text\x00\x00\xff\xfe\x00binary executable blob"
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("fake_notes.txt", binary_disguised_as_txt, "text/plain")
            self.assertEqual(response.status_code, 400)
            self.assertIn("Binary null bytes detected", response.json()["detail"])

    def test_empty_file_rejected(self):
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("empty.txt", b"", "text/plain")
            self.assertEqual(response.status_code, 400)
            self.assertIn("empty", response.json()["detail"].lower())

    def test_oversized_file_returns_413(self):
        # Create oversized payload > 10MB
        oversized = b"A" * (10 * 1024 * 1024 + 1024)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self._upload("huge_report.txt", oversized, "text/plain")
            self.assertEqual(response.status_code, 413)
            self.assertIn("File exceeds max allowed size", response.json()["detail"])

    # =========================================================================
    # F-03: Rate Limiting Tests
    # =========================================================================
    def test_rate_limiting_upload_triggers_429(self):
        limiter.reset()
        file_content = b"Daily report text sample"

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.upload.get_supabase_client", return_value=self.mock_supabase), \
             patch.dict(os.environ, {"RATE_LIMIT_UPLOAD": "3/minute"}):

            # Send 3 requests (within limit)
            for _ in range(3):
                resp = self._upload("report.txt", file_content, "text/plain")
                self.assertEqual(resp.status_code, 200)

            # 4th request must exceed limit and return 429
            resp4 = self._upload("report.txt", file_content, "text/plain")
            self.assertEqual(resp4.status_code, 429)
            self.assertIn("Rate limit exceeded", resp4.json()["detail"])
            self.assertIn("Retry-After", resp4.headers)

    def test_rate_limiting_extraction_triggers_429(self):
        limiter.reset()
        eid = uuid4()

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.extract.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.extract.ExtractionService.process_file_content", return_value=[]), \
             patch.dict(os.environ, {"RATE_LIMIT_EXTRACTION": "2/minute"}):

            # 2 calls within limit
            resp1 = self.client.post(f"/extract/{eid}", json={"raw_text": "Sample 1"}, headers=self.auth_headers)
            self.assertEqual(resp1.status_code, 200)

            resp2 = self.client.post(f"/extract/{eid}", json={"raw_text": "Sample 2"}, headers=self.auth_headers)
            self.assertEqual(resp2.status_code, 200)

            # 3rd call exceeds limit
            resp3 = self.client.post(f"/extract/{eid}", json={"raw_text": "Sample 3"}, headers=self.auth_headers)
            self.assertEqual(resp3.status_code, 429)

    def test_health_endpoint_not_rate_limited(self):
        # Health endpoint should not be throttled even under burst traffic
        for _ in range(20):
            resp = self.client.get("/health")
            self.assertEqual(resp.status_code, 200)


if __name__ == "__main__":
    unittest.main()
