"""
Unit tests for Pydantic validation schemas in backend/models/schemas.py.
"""

import unittest
from uuid import uuid4
from pydantic import ValidationError
from backend.models.schemas import (
    HealthResponse,
    CurrentUser,
    ExtractedActivityRaw,
    ExtractedActivityCreate,
    CandidateMatch,
    MatchResult,
    ConfirmResponse,
    RejectRequest,
    RejectResponse,
    ReassignRequest,
    ReassignResponse,
    SchedulePlanItemOut,
    ReportItemOut,
    ExtractedActivityContext,
    SchedulePlanContext,
    ScheduleMatchOut,
    UnmatchedActivityOut,
    AuditTrailOut,
    AnalyticsOut,
)
from datetime import date, datetime, timezone



class TestSchemas(unittest.TestCase):
    def test_health_response(self):
        resp = HealthResponse()
        self.assertEqual(resp.status, "ok")
        self.assertEqual(resp.version, "1.0.0")

    def test_discipline_normalization(self):
        # Valid discipline casing
        raw1 = ExtractedActivityRaw(
            activity_description="Welding 12in pipe",
            discipline="Piping",
        )
        self.assertEqual(raw1.discipline, "piping")

        # Multi-word discipline normalization
        raw2 = ExtractedActivityRaw(
            activity_description="Compressor alignment",
            discipline="Static Rotating Equipment",
        )
        self.assertEqual(raw2.discipline, "static_rotating_equipment")

        # Unknown discipline mapping
        raw3 = ExtractedActivityRaw(
            activity_description="Random miscellaneous task",
            discipline="Painting",
        )
        self.assertEqual(raw3.discipline, "unknown")

    def test_extracted_activity_create_validation(self):
        eid = uuid4()
        model = ExtractedActivityCreate(
            extraction_id=eid,
            activity_description="Civil foundation concrete pour",
            discipline="civil",
            extraction_confidence=0.85,
        )
        self.assertEqual(model.extraction_confidence, 0.85)
        self.assertEqual(model.discipline, "civil")

        # Confidence must be between 0.0 and 1.0
        with self.assertRaises(ValidationError):
            ExtractedActivityCreate(
                extraction_id=eid,
                activity_description="Invalid confidence",
                extraction_confidence=1.5,
            )

    def test_candidate_match_schema(self):
        cid = uuid4()
        candidate = CandidateMatch(
            plan_activity_id=cid,
            activity_code="PIP-101",
            activity_description="Pipe fabrication",
            score=0.92,
        )
        self.assertEqual(candidate.score, 0.92)
        self.assertEqual(candidate.activity_code, "PIP-101")

    def test_schedule_plan_item_out_schema(self):
        item = SchedulePlanItemOut(
            id=uuid4(),
            project_id=uuid4(),
            activity_code="CIV-101",
            activity_description="Foundation work",
            discipline="civil",
            planned_start=date(2026, 1, 1),
            planned_end=date(2026, 1, 15),
        )
        self.assertEqual(item.activity_code, "CIV-101")
        self.assertEqual(item.discipline, "civil")

    def test_report_item_out_schema(self):
        report = ReportItemOut(
            id=uuid4(),
            project_id=uuid4(),
            file_url="/storage/v1/object/reports/sample.pdf",
            file_type="daily_report",
            status="complete",
        )
        self.assertEqual(report.status, "complete")
        self.assertEqual(report.file_type, "daily_report")

    def test_schedule_match_out_schema(self):
        extracted_id = uuid4()
        plan_id = uuid4()
        match_out = ScheduleMatchOut(
            id=uuid4(),
            extracted_activity_id=extracted_id,
            plan_activity_id=plan_id,
            confidence_score=0.88,
            status="auto_linked",
            extracted_activity=ExtractedActivityContext(
                id=extracted_id,
                activity_description="Extracted pipe work",
                discipline="piping",
                extraction_confidence=0.9,
            ),
            schedule_plan=SchedulePlanContext(
                id=plan_id,
                project_id=uuid4(),
                activity_code="PIP-200",
                activity_description="Piping spool fitup",
                discipline="piping",
                planned_start=date(2026, 2, 1),
                planned_end=date(2026, 2, 10),
            ),
        )
        self.assertEqual(match_out.confidence_score, 0.88)
        self.assertIsNotNone(match_out.extracted_activity)
        self.assertIsNotNone(match_out.schedule_plan)

    def test_unmatched_activity_out_schema(self):
        unmatched = UnmatchedActivityOut(
            id=uuid4(),
            extracted_activity_id=uuid4(),
            best_score=0.45,
            resolution="unresolved",
        )
        self.assertEqual(unmatched.resolution, "unresolved")
        self.assertEqual(unmatched.best_score, 0.45)

    def test_audit_trail_out_schema(self):
        audit = AuditTrailOut(
            id=uuid4(),
            action="confirmed",
            confidence_score=0.95,
            created_at=datetime.now(timezone.utc),
        )
        self.assertEqual(audit.action, "confirmed")

    def test_analytics_out_schema(self):
        analytics = AnalyticsOut(
            total_planned_activities=42,
            total_extractions=5,
            total_extracted_activities=30,
            total_matches=25,
            total_unmatched=5,
            total_audit_events=100,
            average_match_confidence=0.87,
        )
        self.assertEqual(analytics.total_planned_activities, 42)
        self.assertEqual(analytics.matches_by_status.auto_linked, 0)

    def test_reassign_request_schema(self):
        pid = uuid4()
        req = ReassignRequest(target_plan_activity_id=pid, reason="Wrong activity matched")
        self.assertEqual(req.target_plan_activity_id, pid)
        self.assertEqual(req.reason, "Wrong activity matched")

    def test_reassign_response_schema(self):
        mid = uuid4()
        pid = uuid4()
        user_id = uuid4()
        res = ReassignResponse(match_id=mid, plan_activity_id=pid, status="confirmed", resolved_by=user_id)
        self.assertEqual(res.match_id, mid)
        self.assertEqual(res.plan_activity_id, pid)
        self.assertEqual(res.status, "confirmed")
        self.assertEqual(res.resolved_by, user_id)


if __name__ == "__main__":
    unittest.main()


