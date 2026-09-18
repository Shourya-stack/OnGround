/**
 * OnGround — Core TypeScript Data Types
 * Matches the Supabase PostgreSQL Schema and FastAPI API models.
 */

export type UserRole = 'planner' | 'supervisor';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type DisciplineType =
  | 'civil'
  | 'piping'
  | 'electrical'
  | 'instrumentation'
  | 'static_rotating_equipment'
  | 'hse'
  | 'unknown';

export interface SchedulePlanItem {
  id: string;
  project_id: string;
  activity_code: string;
  activity_description: string;
  discipline: DisciplineType;
  planned_start: string; // YYYY-MM-DD
  planned_end: string;   // YYYY-MM-DD
  planned_progress?: number; // 0 - 100
  actual_progress?: number;  // 0 - 100
  status?: 'ON_TRACK' | 'ATTENTION' | 'DELAYED' | 'COMPLETED' | 'REVIEW';
  created_at: string;
}

export type ExtractionStatus = 'pending' | 'processing' | 'complete' | 'failed';
export type FileType = 'daily_report' | 'spreadsheet' | 'voice_transcript';

export interface ExtractionRecord {
  id: string;
  project_id: string;
  file_url: string;
  file_type: FileType | null;
  status: ExtractionStatus;
  uploaded_by: string | null;
  created_at: string;
}

export interface ExtractedActivity {
  id: string;
  extraction_id: string;
  activity_description: string;
  discipline: DisciplineType;
  start_time: string | null;
  end_time: string | null;
  location_reference: string | null;
  extraction_confidence: number; // 0.0 to 1.0 (server calculated)
  created_at: string;
}

export type MatchStatus = 'auto_linked' | 'pending_review' | 'confirmed' | 'rejected';
export type MatchResultStatus = 'auto_linked' | 'pending_review' | 'unmatched';

export interface MatchResult {
  status: MatchResultStatus;
  extracted_activity_id: string;
  match_id?: string | null;
  plan_activity_id?: string | null;
  confidence_score?: number | null;
  candidates?: CandidateMatch[] | null;
}

export interface CandidateMatch {
  plan_activity_id: string;
  activity_code: string;
  activity_description: string;
  score: number; // 0.0 to 1.0 (similarity score)
  reasons?: string[]; // Match justifications (e.g. 'Discipline match', 'Location match')
  planned_progress?: number; // 0 - 100
  actual_progress?: number;  // 0 - 100
}

export interface ScheduleMatch {
  id: string;
  extracted_activity_id: string;
  plan_activity_id: string;
  confidence_score: number;
  status: MatchStatus;
  resolved_by: string | null;
  candidates: CandidateMatch[] | null;
  created_at: string;
  // Joins
  extracted_activity?: ExtractedActivity;
  schedule_plan?: SchedulePlanItem;
}

export type UnmatchedResolution = 'unresolved' | 'marked_new_activity' | 'manually_linked';

export interface UnmatchedActivity {
  id: string;
  extracted_activity_id: string;
  best_score: number | null;
  resolution: UnmatchedResolution;
  created_at: string;
  // Joins
  extracted_activity?: ExtractedActivity;
}

export type AuditAction =
  | 'extracted'
  | 'auto_linked'
  | 'flagged'
  | 'confirmed'
  | 'rejected'
  | 'manually_linked';

export interface AuditTrailEntry {
  id: string;
  related_match_id: string | null;
  related_unmatched_id: string | null;
  action: AuditAction;
  confidence_score: number | null;
  actor: string | null; // null = system
  created_at: string;
  actor_profile?: UserProfile;
}

export interface ConfirmResponse {
  match_id: string;
  status: 'confirmed';
}

export interface RejectResponse {
  match_id: string;
  status: 'rejected';
}

export interface ReassignResponse {
  match_id: string;
  plan_activity_id: string;
  status: 'confirmed';
  resolved_by: string | null;
}

export interface MatchesBreakdown {
  auto_linked: number;
  pending_review: number;
  confirmed: number;
  rejected: number;
}

export interface UnmatchedBreakdown {
  unresolved: number;
  marked_new_activity: number;
  manually_linked: number;
}

export interface AnalyticsOut {
  total_planned_activities: number;
  total_extractions: number;
  total_extracted_activities: number;
  total_matches: number;
  matches_by_status: MatchesBreakdown;
  total_unmatched: number;
  unmatched_by_resolution: UnmatchedBreakdown;
  total_audit_events: number;
  average_match_confidence: number | null;
}


// =============================================================================
// Project, Report, Team & Analytics Models (Phase 1)
// =============================================================================

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  location: string;
  contract_type: string;
  budget: string;
  status: ProjectStatus;
  progress: number; // 0 - 100
  start_date: string;
  end_date: string;
  created_at: string;
  reports_count: number;
  activities_count: number;
  matched_count: number;
  review_count: number;
  unmatched_count: number;
  team_size: number;
}

export type ReportStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export interface ReportItem {
  id: string;
  project_id: string;
  file_name: string;
  file_size: string;
  file_type: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'txt';
  status: ReportStatus;
  uploaded_by: string;
  uploaded_at: string;
  activities_count: number;
  matched_count: number;
  review_count: number;
  unmatched_count: number;
  error_message?: string;
}

export type ExtendedRole = 'planner' | 'supervisor' | 'manager' | 'engineer';

export interface TeamMember {
  id: string;
  project_id: string;
  name: string;
  email: string;
  role: ExtendedRole;
  status: 'active' | 'invited';
  last_active: string;
  avatar?: string;
}

export interface ProjectAnalytics {
  project_id: string;
  reports_processed: number;
  activities_extracted: number;
  matched_count: number;
  review_count: number;
  unmatched_count: number;
  match_rate: number; // percentage
  review_rate: number; // percentage
  confidence_distribution: {
    high: number;    // >= 85%
    medium: number;  // 70-84%
    low: number;     // < 70%
  };
  ingestion_trends: {
    date: string;
    reports: number;
    activities: number;
  }[];
  discipline_breakdown: {
    discipline: DisciplineType;
    count: number;
    percentage: number;
  }[];
}

export interface ProjectNotification {
  id: string;
  type: 'review' | 'variance' | 'evidence' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  link?: string;
}

export interface FieldUpdateRecord {
  id: string;
  time: string;
  date: string;
  source: string;
  discipline: DisciplineType;
  location: string;
  text: string;
  linked_activity_id?: string | null;
  confidence: number;
  state: 'LINKED' | 'AWAITING_REVIEW' | 'REVIEW_REQUIRED' | 'REJECTED';
}

