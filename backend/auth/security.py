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

# Roles recognised by public.profiles / public.project_memberships.
VALID_ROLES = ("planner", "supervisor", "manager", "engineer")


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
        if role not in VALID_ROLES:
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
    Optional authentication dependency for endpoints that accept guest access.

    Only *authentication* failures degrade to None. Server-side failures (5xx)
    are re-raised so a broken database does not masquerade as "not logged in".
    """
    if not authorization:
        return None
    try:
        return await get_current_user(authorization=authorization)
    except HTTPException as exc:
        if exc.status_code >= 500:
            raise
        return None


def verify_user_project_access(user_id: UUID, project_id: Optional[UUID]) -> bool:
    """
    Verify the user is a member of the given project (SEC-02, SEC-03, SEC-04).

    Access requires an explicit row in project_memberships. There is deliberately
    NO sentinel/"default project" bypass and NO offline bypass: earlier revisions
    returned True for project 00000000-0000-0000-0000-000000000001 for every
    authenticated user, and True whenever the Supabase client was unconfigured,
    both of which silently defeated multi-tenant isolation.
    """
    if not project_id:
        return False

    supabase = get_supabase_client()
    if not supabase:
        logger.error(
            "Cannot verify project access for user %s: database unavailable. Denying.",
            user_id,
        )
        return False

    try:
        res = (
            supabase.table("project_memberships")
            .select("id")
            .eq("project_id", str(project_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        return bool(res.data)
    except Exception as e:
        logger.warning(
            f"Error checking project membership for user {user_id} on project {project_id}: {e}"
        )
        return False


def get_user_project_role(user_id: UUID, project_id: UUID) -> Optional[str]:
    """
    Return the user's role within a specific project, or None if not a member.
    Project-scoped role takes precedence over the global profiles.role.
    """
    supabase = get_supabase_client()
    if not supabase:
        return None

    try:
        res = (
            supabase.table("project_memberships")
            .select("role")
            .eq("project_id", str(project_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        if res.data:
            return res.data[0].get("role")
        return None
    except Exception as e:
        logger.warning(
            f"Error resolving project role for user {user_id} on project {project_id}: {e}"
        )
        return None


def require_project_access(user: CurrentUser, project_id: Optional[UUID]) -> UUID:
    """
    Assert the user may access `project_id`, raising the appropriate HTTPException.

    Returns the validated project_id so callers can use it directly.
    """
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="project_id is required.",
        )

    if not verify_user_project_access(user.id, project_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User not authorized for project {project_id}",
        )

    return project_id


def require_project_planner(user: CurrentUser, project_id: Optional[UUID]) -> UUID:
    """
    Assert the user is a planner on `project_id`.

    Falls back to the global profile role only when the membership row carries no
    explicit role, so existing single-role deployments keep working.
    """
    validated = require_project_access(user, project_id)

    project_role = get_user_project_role(user.id, validated)
    effective_role = project_role or user.role

    if effective_role != "planner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Forbidden: Action requires the 'planner' role on project {validated}. "
                f"Current role: '{effective_role}'"
            ),
        )

    return validated

