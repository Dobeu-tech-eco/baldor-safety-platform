# Baldor Safety Insights

Internal safety analytics app for Baldor Specialty Foods: upload incident exports, review/classify preventability, and explore 10 charts of vehicle/injury trends across branches.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/baldor-safety run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Replit Auth (openid-client, session cookie `sid`)
- DB: Replit built-in PostgreSQL + Drizzle ORM
- Web: React + Vite + Tailwind + Recharts (artifacts/baldor-safety)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- DB schema: `lib/db/src/schema/` (`auth.ts` = Replit Auth sessions/users; `safety.ts` = incidents, mileage, overrides, snow_events, upload_batches/files, dataset_merges, app_users)
- API contract: `lib/api-spec/openapi.yaml` → generated into `lib/api-zod` and `lib/api-client-react`
- API routes: `artifacts/api-server/src/routes/` (`auth.ts`, `safety.ts`); ingestion pipeline: `artifacts/api-server/src/lib/ingest.ts`; role guards: `src/lib/appUsers.ts`
- Web data layer: `artifacts/baldor-safety/src/lib/api.ts` (fetch wrapper + types), `lib/auth.tsx` (auth context), `lib/ingest.ts` (browser file parsing only)

## Architecture decisions

- All data access goes through authenticated `/api/*` routes — no direct browser-to-database access. Every safety route requires an allowlisted user; user management requires admin.
- Auth: Replit Auth (OIDC). First user to log in becomes admin + allowlisted; everyone else sees "Access pending" until an admin grants access in Settings. `app_users` is keyed by the auth user id, with pre-allowlisting by email supported.
- File parsing (XLSX) stays in the browser; the ingestion pipeline (follow-on dedup, classification restore, overrides, upsert by occurrence_number) runs server-side. Preview and commit both re-run the pipeline server-side from the parsed rows so the server stays authoritative.
- Preventability edits write an `overrides` row and update the incident, so re-uploads preserve the classification.

## Product

- Login-gated dashboard with YTD KPIs, chart request bar (rules-based parser), 10 charts + preventability pie, data table with preventability edits, mileage entry (APMM), upload flow with duplicate-file detection and removed/restored counts, Settings for overrides, snow events, and user/allowlist management (admin).
- Seeded: overrides 2026000622→Yes, 2026000606→No; three 2026 snow events.
- Every page shows the "CONFIDENTIAL — Internal Use Only" footer. Brand colors #006838 / #8DC63F; branch order BNY, BMA, BPA, BDC.

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, run codegen before typechecking; inline request bodies whose generated zod const name matches a type name break the build — hoist them to named component schemas.
- Bulk incident upserts must be deduped by occurrence_number first (follow-on rows share the base occurrence; one INSERT ... ON CONFLICT can't touch a row twice).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
