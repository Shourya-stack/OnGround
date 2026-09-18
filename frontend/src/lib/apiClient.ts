/**
 * Canonical Typed API Client for OnGround FastAPI Backend.
 * Handles Supabase Bearer JWT authentication, typed requests/responses,
 * and structured error handling.
 */

import { supabase } from './supabaseClient';
import {
  SchedulePlanItem,
  ExtractionRecord,
  ExtractedActivity,
  ScheduleMatch,
  MatchResult,
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
async function getAuthHeader(requireAuth = false): Promise<HeadersInit> {
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
    _projectId?: string,
    _fileType?: string
  ): Promise<{ extraction_id: string; file_url: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);

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
