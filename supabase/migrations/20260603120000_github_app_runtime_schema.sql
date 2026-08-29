/*
  # GitHub app runtime schema (Lovable Cloud bootstrap)

  This project's Cloud database was provisioned for a prior Excel-import
  archive (`import_*` tables and reporting views). The GitHub SPA does not
  use those objects.

  This migration creates the operational tables the SPA reads and writes:
  app_users, upload_batches, incidents, mileage, overrides, snow_events.

  It does not drop or alter the import archive. Later migrations add
  row_hash / upload_files / dataset_merges, Samsara tables, and the
  mileage unique key.

  ## First-user bootstrap
  Authenticated users may insert their own `app_users` row. Only the first
  row may set `is_admin = true` (enforced here so a later signup cannot
  self-promote via the client). SELECT on `app_users` is open to
  authenticated users so the first-user count in the SPA is accurate.
*/

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.upload_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL DEFAULT '',
  uploaded_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  row_count integer NOT NULL DEFAULT 0,
  follow_on_removed integer NOT NULL DEFAULT 0,
  classifications_restored integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_number text NOT NULL UNIQUE,
  record_id text NOT NULL DEFAULT '',
  base_occurrence text NOT NULL DEFAULT '',
  suffix integer,
  is_followon boolean NOT NULL DEFAULT false,
  incident_type text NOT NULL DEFAULT '',
  employee text NOT NULL DEFAULT '',
  employee_number text NOT NULL DEFAULT '',
  loss_date date,
  report_date date,
  location text NOT NULL DEFAULT '',
  branch text NOT NULL DEFAULT '',
  osha_recordable text NOT NULL DEFAULT '',
  dot_recordable text NOT NULL DEFAULT '',
  event_description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  claim_number text NOT NULL DEFAULT '',
  preventable text NOT NULL DEFAULT '',
  injury_type_code text NOT NULL DEFAULT '',
  tenure_years numeric,
  hire_date date,
  tenure_days integer,
  tier integer,
  is_injury boolean NOT NULL DEFAULT false,
  upload_batch_id uuid REFERENCES public.upload_batches (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mileage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch text NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  miles numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_number text NOT NULL UNIQUE,
  preventable text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.snow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  attributable_count integer NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS incidents_loss_date_idx ON public.incidents (loss_date);
CREATE INDEX IF NOT EXISTS incidents_branch_idx ON public.incidents (branch);
CREATE INDEX IF NOT EXISTS incidents_auto_family_idx ON public.incidents (is_followon, is_injury);
CREATE INDEX IF NOT EXISTS mileage_year_month_idx ON public.mileage (year, month, branch);

CREATE OR REPLACE FUNCTION public.app_users_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.app_users;
$$;

CREATE OR REPLACE FUNCTION public.is_app_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND is_admin = true);
$$;

REVOKE ALL ON FUNCTION public.app_users_count() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_app_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_app_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_users_count() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_app_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated, service_role;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read app_users" ON public.app_users;
CREATE POLICY "Authenticated can read app_users" ON public.app_users
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own app_users row" ON public.app_users;
CREATE POLICY "Users can insert own app_users row" ON public.app_users
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND (is_admin = false OR public.app_users_count() = 0)
  );

DROP POLICY IF EXISTS "Admins can update app_users" ON public.app_users;
CREATE POLICY "Admins can update app_users" ON public.app_users
  FOR UPDATE TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can delete app_users" ON public.app_users;
CREATE POLICY "Admins can delete app_users" ON public.app_users
  FOR DELETE TO authenticated
  USING (public.is_app_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.upload_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mileage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.overrides TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snow_events TO authenticated;

GRANT ALL ON public.app_users TO service_role;
GRANT ALL ON public.upload_batches TO service_role;
GRANT ALL ON public.incidents TO service_role;
GRANT ALL ON public.mileage TO service_role;
GRANT ALL ON public.overrides TO service_role;
GRANT ALL ON public.snow_events TO service_role;

REVOKE ALL ON public.app_users FROM anon;
REVOKE ALL ON public.upload_batches FROM anon;
REVOKE ALL ON public.incidents FROM anon;
REVOKE ALL ON public.mileage FROM anon;
REVOKE ALL ON public.overrides FROM anon;
REVOKE ALL ON public.snow_events FROM anon;
