"""
Database Seeder Script for TrueLine IPIS.
Populates the baseline schedule from data/baseline_schedule.csv into Supabase.
"""

import sys
import csv
from uuid import uuid4
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.db.supabase_client import get_supabase_client


def seed_database():
    print("Starting database seeding for TrueLine IPIS...")
    csv_path = ROOT_DIR / "data" / "baseline_schedule.csv"

    if not csv_path.exists():
        print(f"Error: {csv_path} not found.")
        return

    supabase = get_supabase_client()
    if not supabase:
        print("Warning: Supabase credentials not set or client unavailable. Database seeding skipped.")
        return

    activities = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            activities.append({
                "id": str(uuid4()),
                "project_id": "00000000-0000-0000-0000-000000000001",
                "activity_code": row["activity_code"],
                "activity_description": row["activity_description"],
                "discipline": row["discipline"],
                "planned_start": row["planned_start"],
                "planned_end": row["planned_end"],
            })

    try:
        res = supabase.table("schedule_plan").upsert(activities, on_conflict="activity_code").execute()
        print(f"Successfully seeded {len(activities)} baseline schedule activities into Supabase.")
    except Exception as e:
        print(f"Seeding error: {e}")


if __name__ == "__main__":
    seed_database()
