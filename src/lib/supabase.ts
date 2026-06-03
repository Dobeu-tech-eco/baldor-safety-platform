import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
export type UploadBatch = { id: string; filename: string; uploaded_by: string | null; uploaded_at: string; row_count: number; follow_on_removed: number; classifications_restored: number; notes: string; };
export type AppUser = { id: string; email: string; full_name: string; is_admin: boolean; };
