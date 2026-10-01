/**
 * Canonical Typed API Client for OnGround FastAPI Backend.
 * Handles Supabase Bearer JWT authentication, typed requests/responses,
 * and structured error handling.
 */

import { supabase } from './supabaseClient';
import {
  SchedulePlanItem,
  ExtractedActivity,
  ScheduleMatch,
  MatchResult,
  UnmatchedActivity,
  AuditTrailEntry,
  AnalyticsOut,
  ConfirmResponse,
  RejectResponse,
  ReassignResponse,
  Project,
  ReportItem,
  TeamMember,
  ExtendedRole,
  ProjectNotification,
  FieldUpdateRecord,
} from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

function requireProjectId(projectId?: string): string {
  if (!projectId) throw new ApiError(400, 'A project must be selected before loading project data.');
  return projectId;
}

function mapProject(row: any): Project {
  const stats = row.stats || {};
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    client: row.client || '',
    location: row.location || '',
    contract_type: row.contract_type || '',
    budget: row.budget == null ? '' : `${row.currency || 'INR'} ${row.budget}`,
    status: row.status,
    progress: stats.progress || 0,
    start_date: row.start_date || '',
    end_date: row.end_date || '',
    created_at: row.created_at || '',
    reports_count: stats.reports_count || 0,
    activities_count: stats.activities_count || 0,
    matched_count: stats.matched_count || 0,
    review_count: stats.review_count || 0,
    unmatched_count: stats.unmatched_count || 0,
    team_size: stats.team_size || 0,
  };
}

function mapReport(row: any): ReportItem {
  const fileName = row.display_name || row.file_name || 'Untitled report';
  const fileSize = row.file_size_bytes == null ? '' : `${row.file_size_bytes} bytes`;
  const fileType = String(row.file_extension || '').replace(/^\\./, '').toLowerCase();
  return {
    id: row.id,
    project_id: row.project_id,
    file_name: fileName,
    display_name: row.display_name || null,
    file_size: fileSize,
    file_size_bytes: row.file_size_bytes ?? null,
    file_extension: row.file_extension || null,
    file_type: fileType as ReportItem['file_type'],
    status: row.status,
    uploaded_by: row.uploaded_by || 'Unknown',
    uploaded_at: row.created_at || '',
    activities_count: row.activities_count || 0,
    matched_count: row.matched_count || 0,
    review_count: row.review_count || 0,
    unmatched_count: row.unmatched_count || 0,
    error_message: row.error_message || undefined,
    archived_at: row.archived_at || undefined,
  };
}


export class ApiError extends Error {
  status: number;
  data: any;
  retryAfter?: number;

  constructor(status: number, message: string, data?: any, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.retryAfter = retryAfter;
  }
}

/**
 * Maps any error or HTTP status code to a clean, user-facing error message.
 * Formats rate limit (429) Retry-After intervals and sanitizes server errors.
 */
export function formatApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      if (err.retryAfter && err.retryAfter > 0) {
        return `Too many requests. Please try again in ${err.retryAfter} seconds.`;
      }
      return 'Too many requests. Please try again shortly.';
    }
    if (err.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }
    if (err.status === 403) {
      return "You don't have permission to perform this action.";
    }
    if (err.status === 404) {
      return 'The requested item could not be found.';
    }
    if (err.status === 413) {
      return 'The uploaded file is too large. Maximum size is 10 MB.';
    }
    if (err.status === 400 || err.status === 422) {
      return err.message || 'Your request could not be completed. Please check the information and try again.';
    }
    if (err.status === 0 || err.status >= 500) {
      return 'Something went wrong while contacting the server. Please try again.';
    }
    return err.message || 'An unexpected error occurred. Please try again.';
  }

  if (err instanceof Error) {
    return err.message || 'An unexpected error occurred. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Callback handler type for unauthorized (401) responses.
 */
export type UnauthorizedHandler = (error: ApiError) => void | Promise<void>;

let onUnauthorizedCallback: UnauthorizedHandler | null = null;
let isHandling401 = false;
let last401Timestamp = 0;

/**
 * Register a centralized 401 handler (e.g. from AuthProvider).
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorizedCallback = handler;
}

/**
 * Centralized resilience trigger when backend returns HTTP 401.
 * Throttled to prevent storm/loop on multiple concurrent failing requests.
 */
export async function trigger401Handling(error: ApiError): Promise<void> {
  const now = Date.now();
  if (isHandling401 || (now - last401Timestamp < 3000)) {
    return;
  }
  isHandling401 = true;
  last401Timestamp = now;

  try {
    if (onUnauthorizedCallback) {
      await onUnauthorizedCallback(error);
    } else {
      // Default resilience: clear stale session and redirect to login
      try {
        await supabase.auth.signOut();
      } catch {
        // Safe swallow
      }
      if (typeof window !== 'undefined' && window.location) {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/signup') && currentPath !== '/') {
          window.location.href = '/login?expired=true';
        }
      }
    }
  } catch (handlerErr) {
    console.error('[Auth Resilience] Error in 401 handler:', handlerErr);
  } finally {
    setTimeout(() => {
      isHandling401 = false;
    }, 3000);
  }
}

/**
 * Retrieves Supabase Auth access token from active browser session.
 * Never uses insecure headers or localStorage role fakes.
 */
async function getAuthHeader(requireAuth = true): Promise<HeadersInit> {
  const headers: Record<string, string> = {};

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else if (requireAuth) {
      const err = new ApiError(401, 'Authentication required. Please sign in to proceed.');
      trigger401Handling(err);
      throw err;
    }
  } catch (err) {
    if (requireAuth) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(401, 'Unable to verify your session. Please sign in again.', err);
    }
  }

  return headers;
}

/**
 * Core generic request helper handling error classification and response parsing.
 */
async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> {
  const authHeaders = await getAuthHeader(requireAuth);
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...(authHeaders as Record<string, string>),
  };

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData) && options.body) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string> || {}),
      },
    });
  } catch (err: any) {
    console.error(`[API Network Error] ${options.method || 'GET'} ${url}:`, err);
    throw new ApiError(0, 'Unable to connect to backend service. Please check your network connection.');
  }

  if (!res.ok) {
    let errorData: any = {};
    let rawErrorMessage = '';

    try {
      errorData = await res.json();
      rawErrorMessage = errorData.detail || errorData.message || '';
    } catch {
      // Non-JSON error body (e.g. 502/504 Bad Gateway from reverse proxy)
    }

    // Extract Retry-After header if present (e.g. on 429)
    let retryAfter: number | undefined;
    const retryHeader = res.headers.get('Retry-After') || res.headers.get('retry-after');
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10);
      if (!isNaN(parsed) && parsed > 0) {
        retryAfter = parsed;
      }
    }

    let defaultMessage: string;
    switch (res.status) {
      case 401: {
        defaultMessage = rawErrorMessage || 'Your session has expired. Please sign in again.';
        const err = new ApiError(401, defaultMessage, errorData);
        trigger401Handling(err);
        throw err;
      }
      case 429: {
        defaultMessage = retryAfter
          ? `Too many requests. Please try again in ${retryAfter} seconds.`
          : (rawErrorMessage || 'Too many requests. Please try again shortly.');
        throw new ApiError(429, defaultMessage, errorData, retryAfter);
      }
      case 403:
        defaultMessage = rawErrorMessage || "You don't have permission to perform this action.";
        throw new ApiError(403, defaultMessage, errorData);
      case 404:
        defaultMessage = rawErrorMessage || 'The requested item could not be found.';
        throw new ApiError(404, defaultMessage, errorData);
      case 413:
        defaultMessage = rawErrorMessage || 'The uploaded file is too large. Maximum size is 10 MB.';
        throw new ApiError(413, defaultMessage, errorData);
      case 400:
      case 422:
        defaultMessage = rawErrorMessage || 'Your request could not be completed. Please check the information and try again.';
        throw new ApiError(res.status, defaultMessage, errorData);
      default:
        if (res.status >= 500) {
          defaultMessage = 'Something went wrong while contacting the server. Please try again.';
        } else {
          defaultMessage = rawErrorMessage || `Request failed with status ${res.status}`;
        }
        throw new ApiError(res.status, defaultMessage, errorData);
    }
  }

  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

/**
 * Canonical Frontend API Client
 */
export const apiClient = {
  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------
  async getHealth(): Promise<{ status: string; version: string }> {
    return apiRequest<{ status: string; version: string }>('/health', {}, false);
  },

  async getProjects(): Promise<Project[]> {
    const rows = await apiRequest<any[]>('/projects');
    return rows.map(mapProject);
  },

  async getProjectById(projectId: string): Promise<Project> {
    const row = await apiRequest<any>(`/projects/${encodeURIComponent(projectId)}`);
    return mapProject(row);
  },

  async createProject(project: Pick<Project, 'name' | 'code'> & Partial<Project>): Promise<Project> {
    const payload = {
      name: project.name,
      code: project.code,
      client: project.client || null,
      location: project.location || null,
      contract_type: project.contract_type || null,
      budget: project.budget ? Number(project.budget.replace(/[^0-9.]/g, '')) : null,
      currency: 'INR',
      start_date: project.start_date || null,
      end_date: project.end_date || null,
    };
    const response = await apiRequest<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapProject(response.project);
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const payload: Record<string, unknown> = { ...updates };
    if (typeof updates.budget === 'string') {
      payload.budget = updates.budget ? Number(updates.budget.replace(/[^0-9.]/g, '')) : null;
    }
    delete payload.id;
    delete payload.code;
    delete payload.progress;
    delete payload.created_at;
    delete payload.reports_count;
    delete payload.activities_count;
    delete payload.matched_count;
    delete payload.review_count;
    delete payload.unmatched_count;
    delete payload.team_size;
    const response = await apiRequest<{ project: any }>(`/projects/${encodeURIComponent(projectId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapProject(response.project);
  },

  async getTeam(projectId: string): Promise<TeamMember[]> {
    const rows = await apiRequest<any[]>(`/projects/${encodeURIComponent(requireProjectId(projectId))}/team`);
    return rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      name: row.full_name || row.email || 'Unnamed member',
      email: row.email || '',
      role: row.role,
      status: row.status,
      last_active: row.created_at || '',
    }));
  },

  async inviteTeamMember(projectId: string, member: { name: string; email: string; role: ExtendedRole }): Promise<TeamMember> {
    const response = await apiRequest<{ member: any }>(`/projects/${encodeURIComponent(requireProjectId(projectId))}/team`, {
      method: 'POST',
      body: JSON.stringify({ email: member.email, full_name: member.name, role: member.role }),
    });
    const row = response.member;
    return {
      id: row.id,
      project_id: row.project_id,
      name: row.full_name || row.email || member.name,
      email: row.email || member.email,
      role: row.role,
      status: row.status,
      last_active: row.created_at || '',
    };
  },

  async removeTeamMember(projectId: string, memberId: string): Promise<void> {
    await apiRequest<void>(`/projects/${encodeURIComponent(requireProjectId(projectId))}/team/${encodeURIComponent(memberId)}`, {
      method: 'DELETE',
    });
  },

  async archiveProject(projectId: string): Promise<Project> {
    const response = await apiRequest<{ project: any }>(`/projects/${encodeURIComponent(requireProjectId(projectId))}/archive`, {
      method: 'POST',
    });
    return mapProject(response.project);
  },

  async getFieldUpdates(projectId: string): Promise<FieldUpdateRecord[]> {
    const rows = await apiRequest<any[]>(`/projects/${encodeURIComponent(requireProjectId(projectId))}/field-updates`);
    return rows.map((row) => ({
      id: row.id,
      time: row.time || '',
      date: row.date || '',
      source: row.extraction_id,
      discipline: row.discipline || 'unknown',
      location: row.location || '',
      text: row.text,
      linked_activity_id: row.linked_activity_id,
      confidence: row.confidence,
      state: row.state,
    }));
  },

  async getActivities(projectId: string): Promise<ExtractedActivity[]> {
    const rows = await apiRequest<any[]>(`/projects/${encodeURIComponent(requireProjectId(projectId))}/field-updates`);
    return rows.map((row) => ({
      id: row.id,
      extraction_id: row.extraction_id,
      activity_description: row.text,
      discipline: row.discipline || 'unknown',
      start_time: row.time || null,
      end_time: null,
      location_reference: row.location || null,
      extraction_confidence: row.confidence,
      created_at: row.created_at || '',
    }));
  },

  // ---------------------------------------------------------------------------
  // Schedule
  // ---------------------------------------------------------------------------
  async getSchedule(params: {
    project_id: string;
    discipline?: string;
    limit?: number;
    offset?: number;
  }): Promise<SchedulePlanItem[]> {
    const query = new URLSearchParams({ project_id: requireProjectId(params.project_id) });
    if (params.discipline && params.discipline !== 'all') query.append('discipline', params.discipline);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    return apiRequest<SchedulePlanItem[]>(`/schedule?${query.toString()}`);
  },

  // ---------------------------------------------------------------------------
  // Reports / Extractions
  // ---------------------------------------------------------------------------
  async getReports(params: {
    project_id: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ReportItem[]> {
    const query = new URLSearchParams({ project_id: requireProjectId(params.project_id) });
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    const rows = await apiRequest<any[]>(`/reports?${query.toString()}`);
    return rows.map(mapReport);
  },

  async uploadReport(
    file: File,
    projectId: string,
    fileType?: string
  ): Promise<{ extraction_id: string; file_url: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', requireProjectId(projectId));
    if (fileType) formData.append('file_type', fileType);

    return apiRequest<{ extraction_id: string; file_url: string; status: string }>(
      '/upload',
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  async updateReport(reportId: string, updates: { display_name?: string; file_type?: string }): Promise<ReportItem> {
    const response = await apiRequest<{ report: any }>(`/reports/${encodeURIComponent(reportId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return mapReport(response.report);
  },

  async archiveReport(reportId: string): Promise<ReportItem> {
    const response = await apiRequest<{ report: any }>(`/reports/${encodeURIComponent(reportId)}/archive`, {
      method: 'POST',
    });
    return mapReport(response.report);
  },

  async triggerExtraction(
    extractionId: string,
    rawText?: string
  ): Promise<{ extraction_id: string; activities_count: number; activities: ExtractedActivity[]; status: string }> {
    return apiRequest<{ extraction_id: string; activities_count: number; activities: ExtractedActivity[]; status: string }>(
      `/extract/${extractionId}`,
      {
        method: 'POST',
        body: JSON.stringify(rawText ? { raw_text: rawText } : {}),
      }
    );
  },

  // ---------------------------------------------------------------------------
  // Matches & Unmatched
  // ---------------------------------------------------------------------------
  async getMatches(params: {
    project_id: string;
    status?: string;
    discipline?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScheduleMatch[]> {
    const query = new URLSearchParams({ project_id: requireProjectId(params.project_id) });
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.discipline && params.discipline !== 'all') query.append('discipline', params.discipline);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    return apiRequest<ScheduleMatch[]>(`/matches?${query.toString()}`);
  },

  async getUnmatched(params: {
    project_id: string;
    resolution?: string;
    limit?: number;
    offset?: number;
  }): Promise<UnmatchedActivity[]> {
    const query = new URLSearchParams({ project_id: requireProjectId(params.project_id) });
    if (params.resolution && params.resolution !== 'all') query.append('resolution', params.resolution);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    return apiRequest<UnmatchedActivity[]>(`/unmatched?${query.toString()}`);
  },

  async resolveUnmatched(unmatchedId: string, planActivityId: string, reason?: string): Promise<void> {
    await apiRequest(`/unmatched/${encodeURIComponent(unmatchedId)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ plan_activity_id: planActivityId, reason }),
    });
  },

  async triggerMatch(extractedActivityId: string): Promise<MatchResult> {
    return apiRequest<MatchResult>(
      `/match/${extractedActivityId}`,
      {
        method: 'POST',
      }
    );
  },

  // ---------------------------------------------------------------------------
  // Review Actions (Authenticated Planner Only)
  // ---------------------------------------------------------------------------
  async confirmMatch(matchId: string): Promise<ConfirmResponse> {
    return apiRequest<ConfirmResponse>(
      `/match/${matchId}/confirm`,
      {
        method: 'POST',
      },
      true // requires authentication
    );
  },

  async rejectMatch(matchId: string, reason?: string): Promise<RejectResponse> {
    return apiRequest<RejectResponse>(
      `/match/${matchId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify(reason ? { reason } : {}),
      },
      true // requires authentication
    );
  },

  async reassignMatch(
    matchId: string,
    targetPlanActivityId: string,
    reason?: string
  ): Promise<ReassignResponse> {
    return apiRequest<ReassignResponse>(
      `/match/${matchId}/reassign`,
      {
        method: 'POST',
        body: JSON.stringify({
          target_plan_activity_id: targetPlanActivityId,
          reason,
        }),
      },
      true // requires authentication
    );
  },

  // ---------------------------------------------------------------------------
  // Audit Trail
  // ---------------------------------------------------------------------------
  async getAudit(params: {
    project_id: string;
    action?: string;
    actor?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditTrailEntry[]> {
    const query = new URLSearchParams({ project_id: requireProjectId(params.project_id) });
    if (params.action && params.action !== 'all') query.append('action', params.action);
    if (params.actor) query.append('actor', params.actor);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));

    return apiRequest<AuditTrailEntry[]>(`/audit?${query.toString()}`);
  },

  async getNotifications(projectId: string): Promise<ProjectNotification[]> {
    const query = new URLSearchParams({ project_id: requireProjectId(projectId) });
    const rows = await apiRequest<any[]>(`/notifications?${query.toString()}`);
    return rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      type: row.type,
      title: row.title,
      message: row.message,
      timestamp: row.created_at,
      created_at: row.created_at,
      read_at: row.read_at,
      read: Boolean(row.read_at),
      link: row.link || undefined,
    }));
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    await apiRequest(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'POST' });
  },

  async markAllNotificationsRead(projectId: string): Promise<void> {
    const query = new URLSearchParams({ project_id: requireProjectId(projectId) });
    await apiRequest(`/notifications/read-all?${query.toString()}`, { method: 'POST' });
  },

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------
  async getAnalytics(projectId: string): Promise<AnalyticsOut> {
    const query = new URLSearchParams({ project_id: requireProjectId(projectId) });
    return apiRequest<AnalyticsOut>(`/analytics?${query.toString()}`);
  },

  async importSchedule(projectId: string, file: File): Promise<{ imported: number; updated: number; skipped: number; errors: { row: number; error: string }[] }> {
    const query = new URLSearchParams({ project_id: requireProjectId(projectId) });
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(`/schedule/import?${query.toString()}`, {
      method: 'POST',
      body: formData,
    });
  },
};
