/*
  # Add content-hash deduplication and merge tracking

  ## Summary
  Adds infrastructure for detecting duplicate uploads at both the file level and
  row level, and for recording merge events when overlapping data is reconciled.

  ## Changes
  1. New column `incidents.row_hash` (text). Holds a deterministic content hash
     of the normalized critical fields for each incident. Indexed for fast lookup.
  2. New table `upload_files`. Tracks each uploaded file's sha256 hash, byte size,
     row count, and a sample of row hashes. Used to flag exact re-uploads before
     parsing the workbook a second time.
  3. New table `dataset_merges`. Records each merge event (which batch absorbed
     which, how many duplicate rows were removed, how many unique rows kept,
     who performed the merge, and when).

  ## Security
  - Both new tables enable RLS.
  - Read/write restricted to members of `app_users`. Delete on `dataset_merges`
    is admin-only.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incidents' AND column_name = 'row_hash'
  ) THEN
    ALTER TABLE incidents ADD COLUMN row_hash text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS incidents_row_hash_idx ON incidents (row_hash);

CREATE TABLE IF NOT EXISTS upload_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_hash text UNIQUE NOT NULL,
  filename text NOT NULL DEFAULT '',
  byte_size bigint NOT NULL DEFAULT 0,
  row_count integer NOT NULL DEFAULT 0,
  row_hashes text[] NOT NULL DEFAULT '{}',
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  batch_id uuid REFERENCES upload_batches(id) ON DELETE SET NULL
);

ALTER TABLE upload_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App users can read upload_files" ON upload_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can insert upload_files" ON upload_files FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can update upload_files" ON upload_files FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "Admins can delete upload_files" ON upload_files FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid() AND is_admin = true));

CREATE TABLE IF NOT EXISTS dataset_merges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_batch_id uuid REFERENCES upload_batches(id) ON DELETE SET NULL,
  target_batch_id uuid REFERENCES upload_batches(id) ON DELETE SET NULL,
  duplicate_rows_removed integer NOT NULL DEFAULT 0,
  unique_rows_kept integer NOT NULL DEFAULT 0,
  new_rows_added integer NOT NULL DEFAULT 0,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz DEFAULT now(),
  note text DEFAULT ''
);

ALTER TABLE dataset_merges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App users can read dataset_merges" ON dataset_merges FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "App users can insert dataset_merges" ON dataset_merges FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid()));
CREATE POLICY "Admins can delete dataset_merges" ON dataset_merges FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM app_users WHERE app_users.id = auth.uid() AND is_admin = true));
