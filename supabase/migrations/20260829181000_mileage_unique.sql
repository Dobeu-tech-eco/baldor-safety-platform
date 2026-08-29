DO $$ BEGIN
  ALTER TABLE mileage ADD CONSTRAINT mileage_branch_year_month_key UNIQUE (branch, year, month);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
