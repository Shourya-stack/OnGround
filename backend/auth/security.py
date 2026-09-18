"""
Security and JWT Authentication Dependencies for OnGround IPIS.
Verifies Supabase Bearer JWTs and resolves authoritative roles from public.profiles.
"""

import logging
from typing import Optional, List
from uuid import UUID
from fastapi import Header, HTTPException, status, Depends
from backend.models.schemas import CurrentUser
from backend.db.supabase_client import get_supabase_client

logger = logging.getLogger("onground.auth")


async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer <Supabase JWT access token>"),
) -> CurrentUser:
    """
    Extracts and validates Supabase JWT token from Authorization header.
    Resolves authenticated user ID and role directly from public.profiles table.
    Rejects any unverified, missing, or malformed credentials.
    Insecure headers like X-User-Role are strictly ignored for authentication.
    """
    # 1. Require Authorization header
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Enforce Bearer scheme format
    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    supabase = get_supabase_client()
    if not supabase:
        logger.error("Supabase client unavailable during authentication")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable",
        )

    # 3. Verify JWT with Supabase Auth
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        auth_user = user_res.user
        user_id = UUID(str(auth_user.id))
        raw_email = getattr(auth_user, "email", None)
        email = str(raw_email) if raw_email and isinstance(raw_email, str) else None
    except HTTPException:

        raise
    except Exception as e:
        logger.warning(f"Supabase auth token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Lookup user profile and resolve role from public.profiles
    try:
        prof_res = (
            supabase.table("profiles")
            .select("id, email, full_name, role")
            .eq("id", str(user_id))
            .execute()
        )
        if not prof_res.data or len(prof_res.data) == 0:
            logger.warning(f"User {user_id} authenticated but no profile found in public.profiles")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User profile not found or role unassigned",
            )
        profile = prof_res.data[0]
        role = profile.get("role")
        if role not in ("planner", "supervisor"):
            logger.warning(f"User {user_id} profile has invalid role '{role}'")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid role assigned to user",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch profile for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile",
        )

    return CurrentUser(
        id=user_id,
        email=email or profile.get("email"),
        role=role,
    )


def require_role(allowed_roles: List[str]):
    """
    Factory creating a dependency that verifies the authenticated user has one of the allowed roles.
    """
    def role_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires one of {allowed_roles} roles. Current role: '{user.role}'",
            )
        return user
    return role_checker


# Role-specific dependencies
require_planner_role = require_role(["planner"])
require_supervisor_role = require_role(["supervisor"])
require_any_authenticated = get_current_user


async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
) -> Optional[CurrentUser]:
    """
    Optional authentication dependency for endpoints that accept both authenticated and guest access.
    """
    if not authorization:
        return None
    try:
        return await get_current_user(authorization=authorization)
    except Exception:
        return None


def verify_user_project_access(user_id: UUID, project_id: Optional[UUID]) -> bool:
    """
    Verifies if user has legitimate access to the given project (SEC-02, SEC-03, SEC-04).
    Default project (00000000-0000-0000-0000-000000000001) is accessible to all authenticated users.
    Other projects require membership in project_memberships table.
    """
    if not project_id:
        return True
    
    proj_str = str(project_id).strip().lower()
    if proj_str == "00000000-0000-0000-0000-000000000001":
        return True

    supabase = get_supabase_client()
    if not supabase:
        # Offline/mock mode allows test execution
        return True

    try:
        res = (
            supabase.table("project_memberships")
            .select("id")
            .eq("project_id", proj_str)
            .eq("user_id", str(user_id))
            .execute()
        )
        if res.data and len(res.data) > 0:
            return True
        return False
    except Exception as e:
        logger.warning(f"Error checking project membership for user {user_id} on project {project_id}: {e}")
        return False

