-- Unique (branch, year, month) for mileage upserts.
-- Skips adding the constraint when duplicate keys already exist.
-- Operator must dedupe conflicting (branch, year, month) rows before re-running;
-- this migration does not delete or merge duplicates.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM mileage
    GROUP BY branch, year, month
    HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'mileage unique constraint skipped: duplicate (branch, year, month) rows exist — dedupe first';
    RETURN;
  END IF;

  BEGIN
    ALTER TABLE mileage ADD CONSTRAINT mileage_branch_year_month_key UNIQUE (branch, year, month);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
