/*
  # Tighten RLS Policies

  ## Summary
  Replaces overly permissive policies (USING/WITH CHECK = true) on all five business
  tables with restrictive policies that require the calling user to exist in the
  `app_users` table. This keeps the application's single-tenant model intact while
  ensuring that arbitrary authenticated Supabase users (e.g., from other projects
  sharing the same auth instance) cannot read or write data.

  ## Tables affected
  - incidents
  - mileage
  - overrides
  - snow_events
  - upload_batches

  ## Changes
  1. Drops all policies that used `true` for USING or WITH CHECK.
  2. Recreates SELECT/INSERT/UPDATE/DELETE policies that gate access via
     `EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid())`.
  3. Admin-only operations (deletes on incidents, upload_batches) require
     `is_admin = true`.

  ## Security notes
  - All policies are restricted to the `authenticated` role.
  - Each policy includes a meaningful predicate; none use `USING (true)` or
    `WITH CHECK (true)`.
*/

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('incidents','mileage','overrides','snow_events','upload_batches')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage ENABLE ROW LEVEL SECURITY;
ALTER TABLE overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE snow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App users can read incidents" ON incidents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can insert incidents" ON incidents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can update incidents" ON incidents FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "Admins can delete incidents" ON incidents FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid() AND is_admin = true));

CREATE POLICY "App users can read mileage" ON mileage FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can insert mileage" ON mileage FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can update mileage" ON mileage FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can delete mileage" ON mileage FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));

CREATE POLICY "App users can read overrides" ON overrides FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can insert overrides" ON overrides FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can update overrides" ON overrides FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can delete overrides" ON overrides FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));

CREATE POLICY "App users can read snow_events" ON snow_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can insert snow_events" ON snow_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can update snow_events" ON snow_events FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can delete snow_events" ON snow_events FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));

CREATE POLICY "App users can read upload_batches" ON upload_batches FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can insert upload_batches" ON upload_batches FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can update upload_batches" ON upload_batches FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "Admins can delete upload_batches" ON upload_batches FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid() AND is_admin = true));
