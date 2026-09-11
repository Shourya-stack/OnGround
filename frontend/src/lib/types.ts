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

export interface CandidateMatch {
  plan_activity_id: string;
  activity_code: string;
  activity_description: string;
  score: number; // 0.0 to 1.0
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

// API Responses
export interface UploadResponse {
  extraction_id: string;
  file_url: string;
  status: 'pending';
}

export interface ExtractionResponse {
  extraction_id: string;
  activities_count: number;
  activities: ExtractedActivity[];
  status: string;
}

export interface MatchResponse {
  status: 'auto_linked' | 'pending_review' | 'unmatched';
  extracted_activity_id: string;
  match_id?: string;
  plan_activity_id?: string;
  confidence_score?: number;
  candidates?: CandidateMatch[];
}
