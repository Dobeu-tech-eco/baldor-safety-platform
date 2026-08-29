ALTER TABLE upload_batches ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'incidents';

CREATE TABLE IF NOT EXISTS samsara_tag_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text NOT NULL,
  tag_path text NOT NULL DEFAULT '',
  period_start date NOT NULL,
  period_end date NOT NULL,
  safety_score numeric,
  drive_time_seconds integer,
  total_distance_mi numeric,
  total_events integer,
  total_behaviors integer,
  mobile_usage integer NOT NULL DEFAULT 0,
  inattentive_driving integer NOT NULL DEFAULT 0,
  drowsy integer NOT NULL DEFAULT 0,
  harsh_brake integer NOT NULL DEFAULT 0,
  harsh_turn integer NOT NULL DEFAULT 0,
  harsh_accel integer NOT NULL DEFAULT 0,
  rolling_stop integer NOT NULL DEFAULT 0,
  no_seat_belt integer NOT NULL DEFAULT 0,
  upload_batch_id uuid REFERENCES upload_batches(id) ON DELETE SET NULL,
  UNIQUE (tag, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS tag_branch_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_pattern text UNIQUE NOT NULL,
  branch text NOT NULL
);

INSERT INTO tag_branch_maps (tag_pattern, branch) VALUES
  ('new york', 'BNY'),
  ('boston', 'BMA'),
  ('philadelphia', 'BPA'),
  ('philly', 'BPA'),
  ('dc', 'BDC')
ON CONFLICT (tag_pattern) DO NOTHING;

ALTER TABLE samsara_tag_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_branch_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App users can read samsara_tag_summaries" ON samsara_tag_summaries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can insert samsara_tag_summaries" ON samsara_tag_summaries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can update samsara_tag_summaries" ON samsara_tag_summaries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "Admins can delete samsara_tag_summaries" ON samsara_tag_summaries FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid() AND is_admin = true));

CREATE POLICY "App users can read tag_branch_maps" ON tag_branch_maps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can insert tag_branch_maps" ON tag_branch_maps FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can update tag_branch_maps" ON tag_branch_maps FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "Admins can delete tag_branch_maps" ON tag_branch_maps FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid() AND is_admin = true));
