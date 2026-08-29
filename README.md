# Baldor Safety Insights

Internal fleet-safety analytics for Baldor Transportation Safety. Hosted on Lovable. Data and auth live on this project's Lovable Cloud database.

## Upload sources (AI-Inputs)

Drop these workbooks on **Upload** (detection is by columns, not filename):

1. Incidents export — Occurrence Number + Loss Date
2. Samsara Driver Safety Report by Tag Summary — Driver Tag + Mobile Usage / Inattentive Driving
3. Miles by Jurisdiction and Tag by Month — Asset Tag Name + Distance

## First-time setup

The first account created on Login becomes admin. Keep this flow private.

## Charts

Five presentation families (type stack, APMM, YoY monthly, YoY matrix, distracted) with branch/range controls and PNG export.

## Local env

Copy `.env.example`. Values are Lovable Cloud client credentials, not a self-serve database project.

## Lovable Cloud schema

The Cloud database also holds a prior Excel-import archive (`import_*` tables and reporting views). Leave that archive in place. The SPA uses a separate runtime schema:

`app_users`, `incidents`, `mileage`, `overrides`, `snow_events`, `upload_batches`, `upload_files`, `dataset_merges`, `samsara_tag_summaries`, `tag_branch_maps`.

Apply `supabase/migrations/` in filename order on this project's Lovable Cloud (SQL editor / `query_database`). The first file creates the missing runtime tables; later files add RLS, upload dedup, Samsara summaries, and the mileage unique key.

The Lovable editor sandbox is a different codebase (placeholder shell). GitHub (`Dobeu-tech-eco/baldor-safety-platform`) is the application source of truth. Point that build at this project's Cloud client env.
