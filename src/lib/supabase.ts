import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) as string | undefined;

export function isCloudConfigured(): boolean {
  return Boolean(
    supabaseUrl?.trim() &&
    (String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim() ||
      String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim())
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: { persistSession: true, autoRefreshToken: true },
});

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
  upload_batch_id: string | null;
  created_at: string;
};

export type Mileage = { id: string; branch: string; year: number; month: number; miles: number; };
export type SnowEvent = { id: string; year: number; month: number; attributable_count: number; note: string; };
export type Override = { id: string; occurrence_number: string; preventable: string; note: string; };
export type UploadBatch = {
  id: string;
  filename: string;
  uploaded_by: string | null;
  uploaded_at: string;
  row_count: number;
  follow_on_removed: number;
  classifications_restored: number;
  notes: string;
  source_kind: 'incidents' | 'samsara' | 'mileage';
};

export type SamsaraTagSummary = {
  id: string;
  tag: string;
  tag_path: string;
  period_start: string;
  period_end: string;
  safety_score: number | null;
  drive_time_seconds: number | null;
  total_distance_mi: number | null;
  total_events: number | null;
  total_behaviors: number | null;
  mobile_usage: number;
  inattentive_driving: number;
  drowsy: number;
  harsh_brake: number;
  harsh_turn: number;
  harsh_accel: number;
  rolling_stop: number;
  no_seat_belt: number;
  upload_batch_id: string | null;
};

export type TagBranchMapRow = { id: string; tag_pattern: string; branch: string };
export type AppUser = { id: string; email: string; full_name: string; is_admin: boolean; };
export type UploadFile = { id: string; file_hash: string; filename: string; byte_size: number; row_count: number; row_hashes: string[]; uploaded_by: string | null; uploaded_at: string; batch_id: string | null; };
export type DatasetMerge = { id: string; source_batch_id: string | null; target_batch_id: string | null; duplicate_rows_removed: number; unique_rows_kept: number; new_rows_added: number; performed_by: string | null; performed_at: string; note: string; };
