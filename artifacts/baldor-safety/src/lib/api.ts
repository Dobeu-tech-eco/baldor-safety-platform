// Central API client for the Safety Insights backend.
// All data access goes through the authenticated Express API — no direct DB access.

export type Incident = {
  id: string;
  occurrence_number: string;
  record_id: string;
  base_occurrence: string;
  suffix: number | null;
  is_followon: boolean;
  incident_type: string;
  employee: string;
  employee_number: string;
  loss_date: string | null;
  report_date: string | null;
  location: string;
  branch: string;
  osha_recordable: string;
  dot_recordable: string;
  event_description: string;
  status: string;
  claim_number: string;
  preventable: string;
  injury_type_code: string;
  tenure_years: number | null;
  hire_date: string | null;
  tenure_days: number | null;
  tier: number | null;
  is_injury: boolean;
  row_hash?: string;
  upload_batch_id: string | null;
  created_at: string;
};

export type Mileage = { id: string; branch: string; year: number; month: number; miles: number };
export type SnowEvent = { id: string; year: number; month: number; attributable_count: number; note: string };
export type Override = { id: string; occurrence_number: string; preventable: string; note: string };
export type UploadBatch = { id: string; filename: string; uploaded_by: string | null; uploaded_at: string; row_count: number; follow_on_removed: number; classifications_restored: number; notes: string };
export type AppUser = { id: string; auth_user_id?: string | null; email: string; full_name: string; is_admin: boolean; allowlisted: boolean };
export type UploadFile = { id: string; file_hash: string; filename: string; byte_size: number; row_count: number; row_hashes: string[]; uploaded_by: string | null; uploaded_at: string; batch_id: string | null };
export type DatasetMerge = { id: string; source_batch_id: string | null; target_batch_id: string | null; duplicate_rows_removed: number; unique_rows_kept: number; new_rows_added: number; performed_by: string | null; performed_at: string; note: string };

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export function loginUrl(returnTo = '/'): string {
  return `${BASE}/api/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function logoutUrl(): string {
  return `${BASE}/api/logout`;
}

export type IncidentQuery = {
  from?: string;
  to?: string;
  branch?: string;
  includeFollowons?: boolean;
  isInjury?: boolean;
  limit?: number;
  order?: 'asc' | 'desc';
};

export function getIncidents(q: IncidentQuery = {}): Promise<Incident[]> {
  const params = new URLSearchParams();
  if (q.from) params.set('from', q.from);
  if (q.to) params.set('to', q.to);
  if (q.branch) params.set('branch', q.branch);
  if (q.includeFollowons) params.set('includeFollowons', 'true');
  if (q.isInjury !== undefined) params.set('isInjury', String(q.isInjury));
  if (q.limit) params.set('limit', String(q.limit));
  if (q.order) params.set('order', q.order);
  const qs = params.toString();
  return api<Incident[]>(`/incidents${qs ? `?${qs}` : ''}`);
}
