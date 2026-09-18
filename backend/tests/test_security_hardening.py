"""
Unit and integration tests for Step 6.2 Security Hardening:
- F-01: Authentication on Ingestion/Matching mutation endpoints (/upload, /extract/{id}, /match/{id})
- F-02: Magic-byte and file signature validation
- F-03: Rate limiting on expensive endpoints
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
        self.auth_headers = {"Authorization": "Bearer valid.security.token"}

        # Mock authenticated user with 'supervisor' role
        self.mock_supabase = MagicMock()
        mock_user = MagicMock()
        mock_user.id = str(self.user_id)
        mock_user.email = "supervisor@onground.build"
        self.mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)
        self.mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(self.user_id), "email": "supervisor@onground.build", "role": "supervisor"}
        ]

    def tearDown(self):
        limiter.reset()

    # =========================================================================
    # F-01: Authentication Tests
    # =========================================================================
    def test_upload_without_auth_returns_401(self):
        file = io.BytesIO(b"Daily site report")
        response = self.client.post("/upload", files={"file": ("report.txt", file, "text/plain")})
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
                headers={"Authorization": "Bearer invalid.expired.token"},
            )
            self.assertEqual(response.status_code, 401)

    def test_upload_with_valid_auth_succeeds(self):
        file = io.BytesIO(b"Daily site report text")
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("report.txt", file, "text/plain")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 200)
            self.assertIn("extraction_id", response.json())

    def test_extract_without_auth_returns_401(self):
        eid = uuid4()
        response = self.client.post(f"/extract/{eid}", json={"raw_text": "Sample activity"})
        self.assertEqual(response.status_code, 401)

    def test_extract_with_valid_auth_succeeds(self):
        eid = uuid4()
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            with patch("backend.routes.extract.get_supabase_client", return_value=self.mock_supabase):
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
            self.assertEqual(response.status_code, 200)

    # =========================================================================
    # F-02: File Signature / Magic-Byte Validation Tests
    # =========================================================================
    def test_pdf_valid_magic_bytes_accepted(self):
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        file = io.BytesIO(pdf_content)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("report.pdf", file, "application/pdf")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 200)

    def test_pdf_fake_signature_rejected(self):
        fake_pdf = b"MZ\x90\x00\x03\x00\x00\x00Windows Executable disguised as PDF"
        file = io.BytesIO(fake_pdf)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("malicious.pdf", file, "application/pdf")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("Invalid PDF file", response.json()["detail"])

    def test_xlsx_valid_zip_container_accepted(self):
        # ZIP magic bytes: PK\x03\x04
        xlsx_content = b"PK\x03\x04\x14\x00\x06\x00Mock Excel OpenXML spreadsheet stream"
        file = io.BytesIO(xlsx_content)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("progress.xlsx", file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 200)

    def test_xlsx_invalid_container_rejected(self):
        fake_xlsx = b"Not a real ZIP container for excel"
        file = io.BytesIO(fake_xlsx)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("fake.xlsx", file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("Invalid XLSX file", response.json()["detail"])

    def test_xls_valid_ole_signature_accepted(self):
        # OLE Compound File: D0 CF 11 E0 A1 B1 1A E1
        ole_header = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1" + b"\x00" * 32
        file = io.BytesIO(ole_header)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("legacy.xls", file, "application/vnd.ms-excel")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 200)

    def test_xls_invalid_signature_rejected(self):
        fake_xls = b"Plain text renamed to legacy excel format"
        file = io.BytesIO(fake_xls)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("corrupt.xls", file, "application/vnd.ms-excel")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("Invalid XLS file", response.json()["detail"])

    def test_txt_and_csv_plausible_text_accepted(self):
        text_content = b"WBS,Activity Description,Discipline\nPIP-101,Fit-up of cooling line,piping\n"
        file = io.BytesIO(text_content)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("data.csv", file, "text/csv")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 200)

    def test_txt_binary_null_bytes_rejected(self):
        binary_disguised_as_txt = b"Some initial text\x00\x00\xff\xfe\x00binary executable blob"
        file = io.BytesIO(binary_disguised_as_txt)
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("fake_notes.txt", file, "text/plain")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("Binary null bytes detected", response.json()["detail"])

    def test_empty_file_rejected(self):
        empty_file = io.BytesIO(b"")
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("empty.txt", empty_file, "text/plain")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("empty", response.json()["detail"].lower())

    def test_oversized_file_returns_413(self):
        # Create oversized payload > 10MB
        oversized = io.BytesIO(b"A" * (10 * 1024 * 1024 + 1024))
        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase):
            response = self.client.post(
                "/upload",
                files={"file": ("huge_report.txt", oversized, "text/plain")},
                headers=self.auth_headers,
            )
            self.assertEqual(response.status_code, 413)
            self.assertIn("File exceeds max allowed size", response.json()["detail"])

    # =========================================================================
    # F-03: Rate Limiting Tests
    # =========================================================================
    def test_rate_limiting_upload_triggers_429(self):
        limiter.reset()
        file_content = b"Daily report text sample"

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch.dict(os.environ, {"RATE_LIMIT_UPLOAD": "3/minute"}):

            # Send 3 requests (within limit)
            for _ in range(3):
                f = io.BytesIO(file_content)
                resp = self.client.post("/upload", files={"file": ("report.txt", f, "text/plain")}, headers=self.auth_headers)
                self.assertEqual(resp.status_code, 200)

            # 4th request must exceed limit and return 429
            f = io.BytesIO(file_content)
            resp4 = self.client.post("/upload", files={"file": ("report.txt", f, "text/plain")}, headers=self.auth_headers)
            self.assertEqual(resp4.status_code, 429)
            self.assertIn("Rate limit exceeded", resp4.json()["detail"])
            self.assertIn("Retry-After", resp4.headers)

    def test_rate_limiting_extraction_triggers_429(self):
        limiter.reset()
        eid = uuid4()

        with patch("backend.auth.security.get_supabase_client", return_value=self.mock_supabase), \
             patch("backend.routes.extract.get_supabase_client", return_value=self.mock_supabase), \
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
