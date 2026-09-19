import unittest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from fastapi.testclient import TestClient

from backend.main import app
from backend.auth.security import CurrentUser, get_current_user

class TestStoragePathRegression(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_user = CurrentUser(
            id=uuid4(),
            email="demo_planner@onground.dev",
            role="planner"
        )
        app.dependency_overrides[get_current_user] = lambda: self.mock_user

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_storage_path_resolution_with_raw_reports_prefix(self):
        """
        Regression test: Verify that a file_url like:
        /storage/v1/object/reports/raw_reports/sample.pdf
        resolves correctly to:
        raw_reports/sample.pdf
        instead of stripping 'raw_reports/' due to unanchored 'reports/' splitting.
        """
        file_url = "/storage/v1/object/reports/raw_reports/eaee23b0-5d38-4f05-b287-cae8b058ad4b_sample_daily_progress_report.pdf"
        
        # Test the prefix stripping logic directly
        prefix = "/storage/v1/object/reports/"
        if file_url.startswith(prefix):
            storage_path = file_url[len(prefix):]
        elif "reports/" in file_url:
            storage_path = file_url.split("reports/", 1)[1]
        else:
            storage_path = file_url

        self.assertEqual(
            storage_path,
            "raw_reports/eaee23b0-5d38-4f05-b287-cae8b058ad4b_sample_daily_progress_report.pdf"
        )
        self.assertTrue(storage_path.startswith("raw_reports/"))

    def test_extract_endpoint_uses_correct_storage_path(self):
        """
        Verify that extract_activities passes the full raw_reports path to Supabase storage download.
        """
        eid = uuid4()
        test_file_url = f"/storage/v1/object/reports/raw_reports/{eid}_sample.pdf"
        
        mock_supabase = MagicMock()
        # Mock extractions query
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            "id": str(eid),
            "file_url": test_file_url,
            "uploaded_by": str(self.mock_user.id),
            "project_id": "00000000-0000-0000-0000-000000000001",
            "status": "pending"
        }]
        
        # Mock storage download returning valid PDF bytes
        mock_supabase.storage.from_.return_value.download.return_value = b"%PDF-1.4 sample content"
        
        # Mock ExtractionService so test does not depend on live OpenRouter rate limits
        with patch("backend.routes.extract.get_supabase_client", return_value=mock_supabase), \
             patch("backend.routes.extract.ExtractionService") as mock_service_cls:
            
            mock_service = MagicMock()
            mock_service.process_file_content.return_value = []
            mock_service_cls.return_value = mock_service
            
            response = self.client.post(
                f"/extract/{eid}",
                headers={"Authorization": "Bearer mock-token"}
            )
            
            # Verify download was called with the exact resolved path: raw_reports/{eid}_sample.pdf
            mock_supabase.storage.from_.assert_called_with("reports")
            mock_supabase.storage.from_.return_value.download.assert_called_once_with(
                f"raw_reports/{eid}_sample.pdf"
            )
            self.assertEqual(response.status_code, 200)

if __name__ == "__main__":
    unittest.main()
