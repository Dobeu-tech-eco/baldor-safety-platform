-- Privileges for tables created after the runtime bootstrap.
-- Lovable Cloud does not grant authenticated/service_role by default
-- the way a local Supabase CLI project often does.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.upload_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dataset_merges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.samsara_tag_summaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tag_branch_maps TO authenticated;

GRANT ALL ON public.upload_files TO service_role;
GRANT ALL ON public.dataset_merges TO service_role;
GRANT ALL ON public.samsara_tag_summaries TO service_role;
GRANT ALL ON public.tag_branch_maps TO service_role;

REVOKE ALL ON public.upload_files FROM anon;
REVOKE ALL ON public.dataset_merges FROM anon;
REVOKE ALL ON public.samsara_tag_summaries FROM anon;
REVOKE ALL ON public.tag_branch_maps FROM anon;

REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.app_users FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.upload_batches FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.incidents FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.mileage FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.overrides FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.snow_events FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.upload_files FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.dataset_merges FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.samsara_tag_summaries FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.tag_branch_maps FROM authenticated;
