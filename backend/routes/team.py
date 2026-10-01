"""
Team route: list / invite / remove project members.

If an invited email already has an account, a project_memberships row is created
immediately. Otherwise a project_invites row is created and the handle_new_user
trigger will convert it into a membership on signup.
"""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, status, Depends

from backend.models.schemas import (
    TeamMemberOut,
    InviteMemberRequest,
    InviteMemberResponse,
    CurrentUser,
)
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_write
from backend.services.audit_service import log_action
from backend.auth.security import require_project_planner, require_any_authenticated, require_project_access
from backend.auth.rate_limiter import rate_limit_api

router = APIRouter(prefix="", tags=["Team"], dependencies=[Depends(rate_limit_api)])
logger = logging.getLogger("onground.team")


def _user_lookup(supabase, email: str):
    """Return an auth user id for an email, if one exists."""
    try:
        # Supabase auth admin API supports list_users; search is not exact, so we filter.
        page = supabase.auth.admin.list_users()
        users = page.users if hasattr(page, "users") else (page or [])
        for u in users:
            if getattr(u, "email", "").lower() == email.lower():
                return u.id
    except Exception as exc:
        logger.warning("Could not look up user by email %s: %s", email, exc)
    return None


@router.get("/projects/{project_id}/team", response_model=List[TeamMemberOut])
async def get_team(
    project_id: UUID,
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """List active members and pending invites for a project."""
    require_project_access(current_user, project_id)
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    members: List[TeamMemberOut] = []

    try:
        membership_rows = execute_read(
            supabase.table("project_memberships")
            .select("id, user_id, role, created_at, profiles(id, email, full_name)")
            .eq("project_id", str(project_id)),
            table="project_memberships",
            operation="team.list_members",
        )
    except PersistenceError as exc:
        logger.error("Failed to list team members: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    for row in membership_rows:
        profile = row.get("profiles") or {}
        if isinstance(profile, list):
            profile = profile[0] if profile else {}
        members.append(
            TeamMemberOut(
                id=row["id"],
                user_id=row.get("user_id"),
                project_id=project_id,
                email=profile.get("email"),
                full_name=profile.get("full_name"),
                role=row.get("role") or "supervisor",
                status="active",
                created_at=row.get("created_at"),
            )
        )

    try:
        invite_rows = execute_read(
            supabase.table("project_invites")
            .select("id, email, full_name, role, created_at")
            .eq("project_id", str(project_id))
            .is_("accepted_at", "null"),
            table="project_invites",
            operation="team.list_invites",
        )
    except PersistenceError as exc:
        logger.error("Failed to list team invites: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    for row in invite_rows:
        members.append(
            TeamMemberOut(
                id=row["id"],
                user_id=None,
                project_id=project_id,
                email=row.get("email"),
                full_name=row.get("full_name"),
                role=row.get("role") or "supervisor",
                status="invited",
                created_at=row.get("created_at"),
            )
        )

    return members


@router.post("/projects/{project_id}/team", response_model=InviteMemberResponse)
async def invite_member(
    project_id: UUID,
    payload: InviteMemberRequest,
    current_user: CurrentUser = Depends(require_project_planner),
):
    """Invite a member to the project."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    existing_user_id = _user_lookup(supabase, payload.email)
    already_registered = existing_user_id is not None

    try:
        if already_registered:
            # Idempotent membership upsert.
            rows = execute_write(
                supabase.table("project_memberships").upsert(
                    {
                        "project_id": str(project_id),
                        "user_id": str(existing_user_id),
                        "role": payload.role,
                    }
                ),
                table="project_memberships",
                operation="team.upsert_member",
            )
            member_row = rows[0]
            member = TeamMemberOut(
                id=member_row["id"],
                user_id=existing_user_id,
                project_id=project_id,
                email=payload.email,
                full_name=payload.full_name,
                role=payload.role,
                status="active",
                created_at=member_row.get("created_at"),
            )
        else:
            rows = execute_write(
                supabase.table("project_invites").upsert(
                    {
                        "project_id": str(project_id),
                        "email": payload.email,
                        "full_name": payload.full_name,
                        "role": payload.role,
                        "invited_by": str(current_user.id),
                    }
                ),
                table="project_invites",
                operation="team.upsert_invite",
            )
            invite_row = rows[0]
            member = TeamMemberOut(
                id=invite_row["id"],
                user_id=None,
                project_id=project_id,
                email=payload.email,
                full_name=payload.full_name,
                role=payload.role,
                status="invited",
                created_at=invite_row.get("created_at"),
            )
    except PersistenceError as exc:
        logger.error("Failed to invite member %s: %s", payload.email, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    audit_row = log_action(
        entity_type="project_memberships",
        entity_id=member.id,
        action="member_invited",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        new_state={
            "email": payload.email,
            "full_name": payload.full_name,
            "role": payload.role,
            "registered": already_registered,
        },
    )

    return InviteMemberResponse(
        member=member,
        already_registered=already_registered,
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )


@router.delete("/projects/{project_id}/team/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: UUID,
    member_id: UUID,
    current_user: CurrentUser = Depends(require_project_planner),
):
    """Remove a project member. Prevent removing the last planner."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    try:
        membership_rows = execute_read(
            supabase.table("project_memberships")
            .select("id, role, user_id")
            .eq("id", str(member_id))
            .eq("project_id", str(project_id))
            .limit(1),
            table="project_memberships",
            operation="team.load_member",
        )
    except PersistenceError as exc:
        logger.error("Failed to load member %s: %s", member_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not membership_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member '{member_id}' not found in project.",
        )

    target = membership_rows[0]

    if target.get("role") == "planner":
        planner_count_rows = execute_read(
            supabase.table("project_memberships")
            .select("id", count="exact")
            .eq("project_id", str(project_id))
            .eq("role", "planner"),
            table="project_memberships",
            operation="team.count_planners",
        )
        # execute_read returns list when count is requested; fall back to len.
        planner_count = len(planner_count_rows)
        if planner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last planner from a project.",
            )

    try:
        execute_write(
            supabase.table("project_memberships").delete().eq("id", str(member_id)),
            table="project_memberships",
            operation="team.remove_member",
        )
    except PersistenceError as exc:
        logger.error("Failed to remove member %s: %s", member_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    log_action(
        entity_type="project_memberships",
        entity_id=member_id,
        action="member_removed",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        previous_state=target,
    )

    return None
