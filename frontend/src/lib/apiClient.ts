/**
 * Typed API Client for FastAPI backend.
 * Handles JWT injection, error handling, and request typing.
 */

import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

async function getAuthHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const demoRole = localStorage.getItem('trueline_demo_role') || 'planner';
  const headers: HeadersInit = {
    'X-User-Role': demoRole,
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}


export const apiClient = {
  async getHealth(): Promise<{ status: string; version: string }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) {
      throw new ApiError(res.status, 'Backend health check failed');
    }
    return res.json();
  },

  async uploadReport(file: File, projectId: string, fileType: string): Promise<any> {
    const authHeaders = await getAuthHeader();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    formData.append('file_type', fileType);

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || err.detail || 'Upload failed', err);
    }
    return res.json();
  },

  async triggerExtraction(extractionId: string): Promise<any> {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/extract/${extractionId}`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || err.detail || 'Extraction failed', err);
    }
    return res.json();
  },

  async triggerMatch(extractedActivityId: string): Promise<any> {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/match/${extractedActivityId}`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || err.detail || 'Matching failed', err);
    }
    return res.json();
  },

  async confirmMatch(matchId: string): Promise<any> {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/match/${matchId}/confirm`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || err.detail || 'Confirm failed', err);
    }
    return res.json();
  },

  async rejectMatch(matchId: string, reason?: string): Promise<any> {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/match/${matchId}/reject`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: reason || 'Rejected by planner' }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || err.detail || 'Reject failed', err);
    }
    return res.json();
  },
};
