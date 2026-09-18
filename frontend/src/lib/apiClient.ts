/**
 * Canonical Typed API Client for OnGround FastAPI Backend.
 * Handles Supabase Bearer JWT authentication, typed requests/responses,
 * and structured error handling.
 */

import { supabase } from './supabaseClient';
import {
  SchedulePlanItem,
  ExtractionRecord,
  ScheduleMatch,
  UnmatchedActivity,
  AuditTrailEntry,
  AnalyticsOut,
  ConfirmResponse,
  RejectResponse,
  ReassignResponse,
} from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Retrieves Supabase Auth access token from active browser session.
 * Never uses insecure headers or localStorage role fakes.
 */
async function getAuthHeader(requireAuth = false): Promise<HeadersInit> {
  const headers: Record<string, string> = {};

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else if (requireAuth) {
      throw new ApiError(401, 'Authentication required. Please sign in to proceed.');
    }
  } catch (err) {
    if (requireAuth && err instanceof ApiError) {
      throw err;
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
  requireAuth = false
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
    let errorMessage = `Request failed with status ${res.status}`;

    try {
      errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Non-JSON error body (e.g. 502/504 Bad Gateway from reverse proxy)
    }

    switch (res.status) {
      case 401:
        throw new ApiError(401, errorMessage || 'Authentication required or session expired.', errorData);
      case 403:
        throw new ApiError(403, errorMessage || 'Access denied. You do not have permission for this action.', errorData);
      case 404:
        throw new ApiError(404, errorMessage || 'Requested resource not found.', errorData);
      case 422:
        throw new ApiError(422, errorMessage || 'Invalid request payload.', errorData);
      default:
        if (res.status >= 500) {
          throw new ApiError(res.status, errorMessage || 'Backend server encountered an error.', errorData);
        }
        throw new ApiError(res.status, errorMessage, errorData);
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
    return apiRequest<{ status: string; version: string }>('/health');
  },

  // ---------------------------------------------------------------------------
  // Schedule
  // ---------------------------------------------------------------------------
  async getSchedule(params?: {
    project_id?: string;
    discipline?: string;
    limit?: number;
    offset?: number;
  }): Promise<SchedulePlanItem[]> {
    const query = new URLSearchParams();
    if (params?.project_id) query.append('project_id', params.project_id);
    if (params?.discipline && params.discipline !== 'all') query.append('discipline', params.discipline);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));

    const qs = query.toString();
    return apiRequest<SchedulePlanItem[]>(`/schedule${qs ? `?${qs}` : ''}`);
  },

  // ---------------------------------------------------------------------------
  // Reports / Extractions
  // ---------------------------------------------------------------------------
  async getReports(params?: {
    project_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExtractionRecord[]> {
    const query = new URLSearchParams();
    if (params?.project_id) query.append('project_id', params.project_id);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));

    const qs = query.toString();
    return apiRequest<ExtractionRecord[]>(`/reports${qs ? `?${qs}` : ''}`);
  },

  async uploadReport(
    file: File,
    projectId?: string,
    fileType?: string
  ): Promise<{ extraction_id: string; file_url: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('project_id', projectId);
    }
    if (fileType) {
      formData.append('file_type', fileType);
    }

    return apiRequest<{ extraction_id: string; file_url: string; status: string }>(
      '/upload',
      {
        method: 'POST',
        body: formData,
      }
    );
  },


  async triggerExtraction(
    extractionId: string,
    rawText?: string
  ): Promise<{ extraction_id: string; activities_count: number; activities: any[]; status: string }> {
    return apiRequest(
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
  async getMatches(params?: {
    project_id?: string;
    status?: string;
    discipline?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScheduleMatch[]> {
    const query = new URLSearchParams();
    if (params?.project_id) query.append('project_id', params.project_id);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.discipline && params.discipline !== 'all') query.append('discipline', params.discipline);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));

    const qs = query.toString();
    return apiRequest<ScheduleMatch[]>(`/matches${qs ? `?${qs}` : ''}`);
  },

  async getUnmatched(params?: {
    resolution?: string;
    limit?: number;
    offset?: number;
  }): Promise<UnmatchedActivity[]> {
    const query = new URLSearchParams();
    if (params?.resolution && params.resolution !== 'all') query.append('resolution', params.resolution);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));

    const qs = query.toString();
    return apiRequest<UnmatchedActivity[]>(`/unmatched${qs ? `?${qs}` : ''}`);
  },

  async triggerMatch(extractedActivityId: string): Promise<any> {
    return apiRequest(
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
  async getAudit(params?: {
    action?: string;
    actor?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditTrailEntry[]> {
    const query = new URLSearchParams();
    if (params?.action && params.action !== 'all') query.append('action', params.action);
    if (params?.actor) query.append('actor', params.actor);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));

    const qs = query.toString();
    return apiRequest<AuditTrailEntry[]>(`/audit${qs ? `?${qs}` : ''}`);
  },

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------
  async getAnalytics(params?: { project_id?: string }): Promise<AnalyticsOut> {
    const query = new URLSearchParams();
    if (params?.project_id) query.append('project_id', params.project_id);

    const qs = query.toString();
    return apiRequest<AnalyticsOut>(`/analytics${qs ? `?${qs}` : ''}`);
  },
};
