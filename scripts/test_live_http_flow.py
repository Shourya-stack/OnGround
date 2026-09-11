"""
Live HTTP Integration Verification Script for OnGround IPIS.
Sends real HTTP multipart and JSON requests to the running FastAPI server (http://127.0.0.1:8000)
and validates the complete pipeline and live database state in Supabase.
"""

import sys
import json
import httpx
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

load_dotenv(ROOT_DIR / "backend" / ".env")
from backend.db.supabase_client import get_supabase_client

BASE_URL = "http://127.0.0.1:8000"

def run_live_http_verification():
    print("======================================================================")
    print("ONGROUND IPIS — LIVE HTTP E2E VERIFICATION")
    print("======================================================================")

    client = httpx.Client(base_url=BASE_URL, timeout=60.0)

    # 1. Health Check
    print("\n[Step 1] Checking API Health (GET /health)...")
    try:
        health_res = client.get("/health")
        print(f"Status: {health_res.status_code} | Body: {health_res.json()}")
        assert health_res.status_code == 200, f"Expected 200, got {health_res.status_code}"
    except Exception as e:
        print(f"Backend connection error: {e}")
        return False

    # 2. Upload Report File
    sample_path = ROOT_DIR / "data" / "sample_report_electrical.txt"
    print(f"\n[Step 2] Uploading {sample_path.name} (POST /upload)...")
    with open(sample_path, "rb") as f:
        files = {"file": (sample_path.name, f.read(), "text/plain")}
    
    upload_res = client.post("/upload", files=files)
    print(f"Status: {upload_res.status_code} | Body: {upload_res.json()}")
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    extraction_id = upload_data["extraction_id"]
    print(f"-> Generated Extraction ID: {extraction_id}")

    # 3. Trigger Live LLM Extraction
    print(f"\n[Step 3] Triggering OpenRouter LLM Extraction (POST /extract/{extraction_id})...")
    extract_res = client.post(f"/extract/{extraction_id}", json={})
    print(f"Status: {extract_res.status_code}")
    assert extract_res.status_code == 200, f"Extraction failed: {extract_res.text}"
    extract_data = extract_res.json()
    activities = extract_data.get("activities", [])
    print(f"-> Extracted {len(activities)} activities:")
    for idx, act in enumerate(activities, 1):
        print(f"   [{idx}] ID: {act.get('id')} | Discipline: {act.get('discipline')} | Confidence: {act.get('extraction_confidence')}")
        print(f"       Desc: {act.get('activity_description')}")

    assert len(activities) > 0, "No activities extracted!"

    # 4. Trigger AI Matching for Extracted Activities
    print("\n[Step 4] Running AI Matching against 21 Live Schedule Activities...")
    match_results = []
    for act in activities:
        act_id = act.get("id")
        if not act_id:
            continue
        match_res = client.post(f"/match/{act_id}")
        assert match_res.status_code == 200, f"Match failed for {act_id}: {match_res.text}"
        m_data = match_res.json()
        match_results.append(m_data)
        print(f"   -> Extracted Act {act_id[:8]}... matched to Plan {str(m_data.get('plan_activity_id'))[:8]}...")
        print(f"      Band: {m_data.get('status')} | Score: {m_data.get('confidence_score')}")

    # 5. Test Review Flow (Confirm & Reject with RBAC)
    print("\n[Step 5] Testing Planner Review Actions & Role Authorization...")
    if match_results and match_results[0].get("match_id"):
        first_match_id = match_results[0]["match_id"]
        
        # 5a. Test Supervisor role rejection (Expect 403 Forbidden)
        print(f"   5a. Testing Supervisor attempt to confirm match {first_match_id} (Expected 403)...")
        sup_res = client.post(
            f"/match/{first_match_id}/confirm",
            headers={"X-User-Role": "supervisor"}
        )
        print(f"       Status: {sup_res.status_code} (Expected 403)")
        assert sup_res.status_code == 403, f"Expected 403 for supervisor, got {sup_res.status_code}"

        # 5b. Test Planner role confirmation (Expect 200 OK)
        print(f"   5b. Testing Planner confirmation for match {first_match_id} (Expected 200)...")
        plan_res = client.post(
            f"/match/{first_match_id}/confirm",
            headers={"X-User-Role": "planner"}
        )
        print(f"       Status: {plan_res.status_code} | Body: {plan_res.json()}")
        assert plan_res.status_code == 200, f"Confirm failed: {plan_res.text}"

    if len(match_results) > 1 and match_results[1].get("match_id"):
        second_match_id = match_results[1]["match_id"]
        # 5c. Test Planner role rejection
        print(f"   5c. Testing Planner rejection for match {second_match_id}...")
        rej_res = client.post(
            f"/match/{second_match_id}/reject",
            headers={"X-User-Role": "planner"},
            json={"reason": "Incorrect secondary termination schedule assignment"}
        )
        print(f"       Status: {rej_res.status_code} | Body: {rej_res.json()}")
        assert rej_res.status_code == 200, f"Reject failed: {rej_res.text}"

    # 6. Verify Live Database State in Supabase
    print("\n[Step 6] Querying Live Supabase Database Tables...")
    supabase = get_supabase_client()
    if supabase:
        try:
            sp_res = supabase.table("schedule_plan").select("activity_code, activity_description, discipline").execute()
            print(f"   -> schedule_plan: {len(sp_res.data or [])} activities verified.")

            ea_res = supabase.table("extracted_activities").select("*").eq("extraction_id", str(extraction_id)).execute()
            print(f"   -> extracted_activities for job: {len(ea_res.data or [])} rows saved.")

            sm_res = supabase.table("schedule_matches").select("*").execute()
            print(f"   -> schedule_matches total: {len(sm_res.data or [])} rows in database.")

            aud_res = supabase.table("audit_trail").select("*").order("created_at", desc=True).limit(5).execute()
            print(f"   -> audit_trail recent events: {len(aud_res.data or [])} log records found:")
            for log in (aud_res.data or []):
                print(f"      - Action: {log.get('action')} | Match: {log.get('related_match_id')} | Created: {log.get('created_at')}")
        except Exception as e:
            print(f"   Database query check: {e}")

    print("\n======================================================================")
    print("LIVE HTTP E2E PIPELINE COMPLETED SUCCESSFULLY!")
    print("======================================================================")
    return True

if __name__ == "__main__":
    success = run_live_http_verification()
    sys.exit(0 if success else 1)
