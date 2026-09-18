"""
Unit and integration tests for backend JWT authentication in backend/auth/security.py.
Covers token parsing, Supabase token verification, profile lookup, role resolution,
rejection of legacy header overrides (X-User-Role), and actor ID extraction.
"""

import unittest
from unittest.mock import patch, MagicMock
from uuid import uuid4, UUID
from fastapi import FastAPI, Depends, status
from fastapi.testclient import TestClient

from backend.models.schemas import CurrentUser
from backend.auth.security import (
    get_current_user,
    require_planner_role,
    require_supervisor_role,
)

# App with protected test routes
auth_test_app = FastAPI()

@auth_test_app.get("/test/protected")
async def protected_route(user: CurrentUser = Depends(get_current_user)):
    return {"user_id": str(user.id), "role": user.role, "email": user.email}

@auth_test_app.get("/test/planner-only")
async def planner_only_route(user: CurrentUser = Depends(require_planner_role)):
    return {"user_id": str(user.id), "role": user.role}

@auth_test_app.get("/test/supervisor-only")
async def supervisor_only_route(user: CurrentUser = Depends(require_supervisor_role)):
    return {"user_id": str(user.id), "role": user.role}


class TestBackendJWTAuth(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(auth_test_app)


    def test_missing_authorization_header_returns_401(self):
        response = self.client.get("/test/protected")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Missing Authorization header", response.json()["detail"])

    def test_malformed_authorization_header_returns_401(self):
        # 1. No Bearer prefix
        resp1 = self.client.get("/test/protected", headers={"Authorization": "Basic invalidcredentials"})
        self.assertEqual(resp1.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Invalid Authorization header format", resp1.json()["detail"])

        # 2. Only Bearer without token
        resp2 = self.client.get("/test/protected", headers={"Authorization": "Bearer"})
        self.assertEqual(resp2.status_code, status.HTTP_401_UNAUTHORIZED)

        # 3. Extra segments
        resp3 = self.client.get("/test/protected", headers={"Authorization": "Bearer token extra"})
        self.assertEqual(resp3.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_jwt_token_returns_401(self):
        mock_supabase = MagicMock()
        mock_supabase.auth.get_user.side_effect = Exception("Invalid JWT signature")

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            response = self.client.get("/test/protected", headers={"Authorization": "Bearer invalid.jwt.token"})
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            self.assertIn("Invalid or expired authentication credentials", response.json()["detail"])

    def test_valid_jwt_planner_profile_authenticates_successfully(self):
        user_id = uuid4()
        mock_supabase = MagicMock()

        # Mock Auth User
        mock_user = MagicMock()
        mock_user.id = str(user_id)
        mock_user.email = "planner@onground.build"
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        # Mock Profiles table query
        mock_profile_query = MagicMock()
        mock_profile_query.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(user_id), "email": "planner@onground.build", "full_name": "Chief Planner", "role": "planner"}
        ]
        mock_supabase.table.return_value = mock_profile_query

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            # Test general protected route
            resp = self.client.get("/test/protected", headers={"Authorization": "Bearer valid.planner.token"})
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["user_id"], str(user_id))
            self.assertEqual(data["role"], "planner")
            self.assertEqual(data["email"], "planner@onground.build")

            # Test planner-only route
            planner_resp = self.client.get("/test/planner-only", headers={"Authorization": "Bearer valid.planner.token"})
            self.assertEqual(planner_resp.status_code, 200)
            self.assertEqual(planner_resp.json()["role"], "planner")

    def test_valid_jwt_supervisor_profile_rejected_by_planner_only(self):
        user_id = uuid4()
        mock_supabase = MagicMock()

        # Mock Auth User
        mock_user = MagicMock()
        mock_user.id = str(user_id)
        mock_user.email = "supervisor@onground.build"
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        # Mock Profiles table query for supervisor
        mock_profile_query = MagicMock()
        mock_profile_query.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(user_id), "email": "supervisor@onground.build", "full_name": "Field Supervisor", "role": "supervisor"}
        ]
        mock_supabase.table.return_value = mock_profile_query

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            # General protected route allows supervisor
            resp = self.client.get("/test/protected", headers={"Authorization": "Bearer valid.supervisor.token"})
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.json()["role"], "supervisor")

            # Planner-only route returns 403 Forbidden
            planner_resp = self.client.get("/test/planner-only", headers={"Authorization": "Bearer valid.supervisor.token"})
            self.assertEqual(planner_resp.status_code, status.HTTP_403_FORBIDDEN)
            self.assertIn("Forbidden", planner_resp.json()["detail"])

    def test_valid_jwt_missing_profiles_row_returns_403(self):
        user_id = uuid4()
        mock_supabase = MagicMock()

        # Mock Auth User
        mock_user = MagicMock()
        mock_user.id = str(user_id)
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)

        # Mock empty Profiles table
        mock_profile_query = MagicMock()
        mock_profile_query.select.return_value.eq.return_value.execute.return_value.data = []
        mock_supabase.table.return_value = mock_profile_query

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            response = self.client.get("/test/protected", headers={"Authorization": "Bearer valid.orphan.token"})
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertIn("profile not found", response.json()["detail"])

    def test_legacy_x_user_role_cannot_bypass_missing_jwt(self):
        # Sending X-User-Role: planner without Bearer token must receive 401
        response = self.client.get("/test/planner-only", headers={"X-User-Role": "planner"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Missing Authorization header", response.json()["detail"])

    def test_legacy_x_user_role_cannot_override_verified_jwt(self):
        user_id = uuid4()
        mock_supabase = MagicMock()

        mock_user = MagicMock()
        mock_user.id = str(user_id)
        mock_user.email = "sup@onground.build"
        mock_supabase.auth.get_user.return_value = MagicMock(user=mock_user)


        # DB has role = "supervisor"
        mock_profile_query = MagicMock()
        mock_profile_query.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(user_id), "role": "supervisor"}
        ]
        mock_supabase.table.return_value = mock_profile_query

        with patch("backend.auth.security.get_supabase_client", return_value=mock_supabase):
            # Attacker sends X-User-Role: planner to elevate privileges
            response = self.client.get(
                "/test/planner-only",
                headers={
                    "Authorization": "Bearer valid.supervisor.token",
                    "X-User-Role": "planner",
                },
            )
            # Must remain 403 Forbidden because JWT user profile has supervisor role
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


if __name__ == "__main__":
    unittest.main()
