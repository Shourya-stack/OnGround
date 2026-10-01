"""
Projects route: CRUD for the multi-project backbone.

All endpoints are authenticated and project-scoped via project_memberships.
Derived statistics come from public.project_stats, not stored counters.
"""

import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends

from backend.models.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectOut,
    ProjectStatsOut,
    ProjectMutationResponse,
    FieldUpdateOut,
    CurrentUser,
)
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_write
from backend.services.audit_service import log_action
from backend.auth.security import require_any_authenticated, require_project_access, require_project_planner
from backend.auth.rate_limiter import rate_limit_api

router = APIRouter(prefix="", tags=["Projects"], dependencies=[Depends(rate_limit_api)])
logger = logging.getLogger("onground.projects")


def _project_out_from_row(row: dict, user_id: UUID) -> ProjectOut:
    stats_raw = row.get("project_stats")
    if isinstance(stats_raw, list):
        stats_raw = stats_raw[0] if stats_raw else None
    stats = ProjectStatsOut(**stats_raw) if isinstance(stats_raw, dict) else ProjectStatsOut()

    return ProjectOut(
        id=row["id"],
        name=row["name"],
        code=row["code"],
        client=row.get("client"),
        location=row.get("location"),
        contract_type=row.get("contract_type"),
        budget=row.get("budget"),
        currency=row.get("currency") or "INR",
        status=row.get("status") or "active",
        start_date=row.get("start_date"),
        end_date=row.get("end_date"),
        created_by=row.get("created_by"),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
        archived_at=row.get("archived_at"),
        my_role=row.get("membership_role"),
        stats=stats,
    )


@router.get("/projects", response_model=List[ProjectOut])
async def list_projects(
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """List projects the current user is a member of, with derived stats."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    try:
        rows = execute_read(
            supabase.table("projects")
            .select("*, project_memberships!inner(role), project_stats(*)")
            .eq("project_memberships.user_id", str(current_user.id))
            .order("created_at", desc=True),
            table="projects",
            operation="projects.list",
        )
    except PersistenceError as exc:
        logger.error("Failed to list projects: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    projects = []
    for row in rows:
        membership = row.get("project_memberships")
        if isinstance(membership, list):
            membership = membership[0] if membership else {}
        elif not isinstance(membership, dict):
            membership = {}
        row["membership_role"] = membership.get("role") if membership else None
        projects.append(_project_out_from_row(row, current_user.id))
    return projects


@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: UUID,
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """Get a single project by id, including derived stats."""
    require_project_access(current_user, project_id)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    try:
        rows = execute_read(
            supabase.table("projects")
            .select("*, project_memberships!inner(role), project_stats(*)")
            .eq("id", str(project_id))
            .eq("project_memberships.user_id", str(current_user.id))
            .limit(1),
            table="projects",
            operation="projects.get",
        )
    except PersistenceError as exc:
        logger.error("Failed to get project %s: %s", project_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found",
        )

    row = rows[0]
    membership = row.get("project_memberships")
    if isinstance(membership, list):
        membership = membership[0] if membership else {}
    elif not isinstance(membership, dict):
        membership = {}
    row["membership_role"] = membership.get("role")
    return _project_out_from_row(row, current_user.id)


@router.post("/projects", response_model=ProjectMutationResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """Create a new project. The creator is automatically added as a planner."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    project_row = {
        "name": payload.name,
        "code": payload.code,
        "client": payload.client,
        "location": payload.location,
        "contract_type": payload.contract_type,
        "budget": payload.budget,
        "currency": payload.currency.upper(),
        "start_date": payload.start_date.isoformat() if payload.start_date else None,
        "end_date": payload.end_date.isoformat() if payload.end_date else None,
        "created_by": str(current_user.id),
    }

    try:
        rows = execute_write(
            supabase.table("projects").insert(project_row).select("*"),
            table="projects",
            operation="projects.create",
        )
        project = rows[0]

        execute_write(
            supabase.table("project_memberships").insert({
                "project_id": str(project["id"]),
                "user_id": str(current_user.id),
                "role": "planner",
            }),
            table="project_memberships",
            operation="projects.create_membership",
        )
    except PersistenceError as exc:
        logger.error("Failed to create project: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    audit_row = log_action(
        entity_type="projects",
        entity_id=project["id"],
        action="project_created",
        project_id=project["id"],
        actor_id=current_user.id,
        actor_role=current_user.role,
        new_state=project_row,
    )

    return ProjectMutationResponse(
        project=_project_out_from_row({**project, "membership_role": "planner"}, current_user.id),
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )


@router.patch("/projects/{project_id}", response_model=ProjectMutationResponse)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """Update project metadata. Planner on the project required."""
    require_project_planner(current_user, project_id)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update.",
        )

    if "currency" in update_data and update_data["currency"]:
        update_data["currency"] = update_data["currency"].upper()
    for date_key in ("start_date", "end_date"):
        if date_key in update_data and update_data[date_key] is not None:
            update_data[date_key] = update_data[date_key].isoformat()

    try:
        existing_rows = execute_read(
            supabase.table("projects").select("*").eq("id", str(project_id)).limit(1),
            table="projects",
            operation="projects.update_load",
        )
        if not existing_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_id}' not found",
            )
        previous_state = existing_rows[0]

        rows = execute_write(
            supabase.table("projects").update(update_data).eq("id", str(project_id)).select("*"),
            table="projects",
            operation="projects.update",
        )
        project = rows[0]
    except PersistenceError as exc:
        logger.error("Failed to update project %s: %s", project_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    audit_row = log_action(
        entity_type="projects",
        entity_id=project_id,
        action="project_updated",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        previous_state=previous_state,
        new_state=project,
    )

    return ProjectMutationResponse(
        project=_project_out_from_row({**project, "membership_role": "planner"}, current_user.id),
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )


@router.post("/projects/{project_id}/archive", response_model=ProjectMutationResponse)
async def archive_project(
    project_id: UUID,
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """Mark a project as archived. Planner on the project required."""
    require_project_planner(current_user, project_id)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    update_data = {
        "status": "archived",
        "archived_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        rows = execute_write(
            supabase.table("projects").update(update_data).eq("id", str(project_id)).select("*"),
            table="projects",
            operation="projects.archive",
        )
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_id}' not found",
            )
        project = rows[0]
    except PersistenceError as exc:
        logger.error("Failed to archive project %s: %s", project_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    audit_row = log_action(
        entity_type="projects",
        entity_id=project_id,
        action="archived",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        new_state=update_data,
    )

    return ProjectMutationResponse(
        project=_project_out_from_row({**project, "membership_role": "planner"}, current_user.id),
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )


@router.get("/projects/{project_id}/field-updates", response_model=List[FieldUpdateOut])
async def list_field_updates(
    project_id: UUID,
    limit: int = 100,
    offset: int = 0,
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """Return field observations derived from extracted activities and matches."""
    require_project_access(current_user, project_id)
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    try:
        activities = execute_read(
            supabase.table("extracted_activities")
            .select("*, extractions!inner(project_id, created_at, file_name)")
            .eq("extractions.project_id", str(project_id))
            .order("created_at", desc=True)
            .range(offset, offset + min(max(limit, 1), 500) - 1),
            table="extracted_activities",
            operation="projects.field_updates",
        )
        matches = execute_read(
            supabase.table("schedule_matches")
            .select("id, extracted_activity_id, plan_activity_id, status, confidence_score, schedule_plan(activity_code)")
            .eq("schedule_plan.project_id", str(project_id)),
            table="schedule_matches",
            operation="projects.field_update_matches",
        )
        unmatched = execute_read(
            supabase.table("unmatched_activities")
            .select("extracted_activity_id, extracted_activities!inner(extractions!inner(project_id))")
            .eq("extracted_activities.extractions.project_id", str(project_id)),
            table="unmatched_activities",
            operation="projects.field_update_unmatched",
        )
    except PersistenceError as exc:
        logger.error("Failed to load field updates for project %s: %s", project_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    match_by_activity = {str(row.get("extracted_activity_id")): row for row in matches}
    unmatched_ids = {str(row.get("extracted_activity_id")) for row in unmatched}
    updates = []
    for activity in activities:
        match = match_by_activity.get(str(activity["id"]))
        match_status = match.get("status") if match else None
        if match_status in {"confirmed", "auto_linked"}:
            state = "LINKED"
        elif match_status == "pending_review":
            state = "REVIEW_REQUIRED"
        elif match_status == "rejected":
            state = "REJECTED"
        elif str(activity["id"]) in unmatched_ids:
            state = "UNPLANNED"
        else:
            state = "AWAITING_REVIEW"

        plan = (match or {}).get("schedule_plan") or {}
        if isinstance(plan, list):
            plan = plan[0] if plan else {}
        updates.append(FieldUpdateOut(
            id=activity["id"],
            extraction_id=activity["extraction_id"],
            date=activity.get("start_time"),
            time=activity.get("start_time"),
            text=activity.get("activity_description") or "",
            discipline=activity.get("discipline"),
            location=activity.get("location_reference"),
            confidence=activity.get("extraction_confidence") or 0,
            state=state,
            linked_activity_id=(match or {}).get("plan_activity_id") if state == "LINKED" else None,
            linked_activity_code=plan.get("activity_code") if state == "LINKED" else None,
            match_id=(match or {}).get("id"),
            match_confidence=(match or {}).get("confidence_score"),
            created_at=activity.get("created_at"),
        ))
    return updates

