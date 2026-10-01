"""
Database Seeder Script for OnGround IPIS.

Creates real demo users (planner + supervisor) via the Supabase Admin API, a
sample project, project memberships, and seeds the baseline schedule.

Idempotent: running it twice only updates passwords and prints the same
credentials.

Usage:
    python scripts/seed_database.py

Required environment (loaded from backend/.env):
    SUPABASE_URL
    SUPABASE_SERVICE_KEY   # service_role key; used to create auth users
"""

import sys
import csv
import os
from uuid import uuid4
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.db.supabase_client import get_supabase_client


DEMO_USERS = [
    {
        "email": "planner@onground.build",
        "password": "OngroundDemo2026!",
        "full_name": "Priya Sharma",
        "company": "OnGround Demo",
        "role": "planner",
    },
    {
        "email": "supervisor@onground.build",
        "password": "OngroundDemo2026!",
        "full_name": "Amit Verma",
        "company": "OnGround Demo",
        "role": "supervisor",
    },
]


def get_admin_client():
    """Return a Supabase client that uses the service_role key with a long timeout."""
    from supabase import create_client
    from supabase.lib.client_options import SyncClientOptions

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env")
    options = SyncClientOptions(
        postgrest_client_timeout=60,
        storage_client_timeout=60,
        function_client_timeout=60,
        auto_refresh_token=False,
        persist_session=False,
    )
    return create_client(url, key, options=options)


def ensure_user(admin, user_spec):
    """Create or update an auth user and return its id."""
    email = user_spec["email"]
    password = user_spec["password"]

    # Search by email via admin.list_users (page 1, max 1000)
    existing = admin.auth.admin.list_users()
    found = None
    for u in existing.users if hasattr(existing, "users") else (existing or []):
        if getattr(u, "email", "").lower() == email.lower():
            found = u
            break

    if found:
        user_id = found.id
        admin.auth.admin.update_user_by_id(
            user_id,
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": user_spec["full_name"],
                    "company": user_spec["company"],
                },
            },
        )
        print(f"  Updated existing user: {email} ({user_id})")
    else:
        resp = admin.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": user_spec["full_name"],
                    "company": user_spec["company"],
                },
            }
        )
        user_id = resp.user.id
        print(f"  Created user: {email} ({user_id})")

    return user_id


def seed_database():
    print("Starting database seeding for OnGround IPIS...")

    supabase = get_supabase_client()
    if not supabase:
        print("Warning: Supabase credentials not set or client unavailable. Database seeding skipped.")
        return

    admin = get_admin_client()

    # 1. Ensure demo users exist.
    print("\n1. Ensuring demo users exist...")
    user_ids = {}
    for spec in DEMO_USERS:
        uid = ensure_user(admin, spec)
        user_ids[spec["email"]] = uid

        # The trigger forces 'supervisor' on signup. We must explicitly set the
        # planner user's role from the service side.
        update_payload = {
            "full_name": spec["full_name"],
            "role": spec["role"],
        }
        if spec.get("company"):
            update_payload["company"] = spec["company"]

        try:
            supabase.table("profiles").update(update_payload).eq("id", uid).execute()
        except Exception as exc:
            raw = str(exc).lower()
            if "company" in raw and "schema cache" in raw:
                # Profiles table predates the company column; skip that field.
                update_payload.pop("company", None)
                supabase.table("profiles").update(update_payload).eq("id", uid).execute()
            else:
                raise
        print(f"    profile role set to '{spec['role']}'")

    # 2. Ensure a demo project exists.
    print("\n2. Ensuring demo project exists...")
    planner_id = user_ids[DEMO_USERS[0]["email"]]
    project_rows = (
        supabase.table("projects")
        .select("id")
        .eq("created_by", planner_id)
        .eq("code", "DEMO-001")
        .execute()
    )

    if project_rows.data:
        project_id = project_rows.data[0]["id"]
        print(f"  Found existing project {project_id}")
    else:
        project_id = str(uuid4())
        supabase.table("projects").insert(
            {
                "id": project_id,
                "name": "Line 247 — EPC Package 3",
                "code": "DEMO-001",
                "client": "ONGC Petro-additions",
                "location": "Dahej, Gujarat",
                "contract_type": "EPC",
                "currency": "INR",
                "status": "active",
            }
        ).execute()
        print(f"  Created project {project_id}")

    # 3. Ensure memberships exist.
    print("\n3. Ensuring project memberships exist...")
    for spec in DEMO_USERS:
        uid = user_ids[spec["email"]]
        supabase.table("project_memberships").upsert(
            {
                "project_id": project_id,
                "user_id": uid,
                "role": spec["role"],
            }
        ).execute()
        print(f"  Membership: {spec['email']} as {spec['role']}")

    # 4. Seed baseline schedule.
    print("\n4. Seeding baseline schedule...")
    csv_path = ROOT_DIR / "data" / "baseline_schedule.csv"
    if not csv_path.exists():
        print(f"  Warning: {csv_path} not found. Skipping schedule seed.")
    else:
        activities = []
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                activities.append(
                    {
                        "id": str(uuid4()),
                        "project_id": project_id,
                        "activity_code": row["activity_code"],
                        "activity_description": row["activity_description"],
                        "discipline": row["discipline"],
                        "planned_start": row["planned_start"],
                        "planned_end": row["planned_end"],
                    }
                )

        existing = (
            supabase.table("schedule_plan")
            .select("activity_code")
            .eq("project_id", project_id)
            .execute()
        )
        existing_codes = {row["activity_code"] for row in (existing.data or [])}
        to_insert = [act for act in activities if act["activity_code"] not in existing_codes]

        if to_insert:
            supabase.table("schedule_plan").insert(to_insert).execute()
            print(f"  Inserted {len(to_insert)} new schedule activities.")
        else:
            print("  All schedule activities already exist.")

        verify = (
            supabase.table("schedule_plan")
            .select("activity_code, activity_description, discipline")
            .eq("project_id", project_id)
            .execute()
        )
        print(f"  Project schedule now contains {len(verify.data or [])} activities.")

    print("\n✅ Seeding complete.")
    print("\nDemo credentials:")
    for spec in DEMO_USERS:
        print(f"  {spec['role']:10s}  {spec['email']}  /  {spec['password']}")
    print(f"\nDemo project id: {project_id}")


if __name__ == "__main__":
    seed_database()
