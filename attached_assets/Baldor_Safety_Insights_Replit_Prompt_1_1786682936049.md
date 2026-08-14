# Replit Build Prompt — Baldor Transportation Safety Data & Charting Platform

> Paste everything below into Replit Agent (or pass it to the Replit connector's `create_app_from_prompt`). It is written to be built in one pass on Replit's stack and to encode Baldor's specific safety-tracking rules so the app behaves like an in-house safety-data analyst.

---

Build and deploy a secure, single-tenant full-stack web app called **"Baldor Safety Insights"** — a centralized repository and chart-generation tool for Baldor Specialty Foods' Transportation Safety team. An authenticated user uploads weekly incident exports, the app stores them in a database, and generates a standard set of safety charts on demand from a simple request interface. The app must already "know" Baldor's tracking rules so the user never re-explains them. Host it entirely on Replit.

## 1. Tech Stack (Replit-native)
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, Recharts for charting, `html-to-image` to export any chart as PNG.
- **Backend:** Node + Express (TypeScript) API in the same Repl (single full-stack project; Vite dev server proxied through Express, one deployment).
- **Database:** Replit's built-in PostgreSQL (provisioned via the Replit Database pane; connection string in the `DATABASE_URL` secret). Use **Drizzle ORM** for schema + migrations; run `drizzle-kit push` on setup to create tables, then a seed script.
- **Auth:** **Replit Auth** for login (internal tool — gate all pages behind it). Maintain an `app_users` table with a `role` column ('admin' | 'viewer'); the first user to log in is promoted to admin. Admin-only screen to allowlist which Replit-authenticated emails may access the app; everyone else sees "Access pending."
- **File parsing:** SheetJS (`xlsx`) in the browser to parse uploaded .xlsx/.csv before POSTing rows to the API.
- **Secrets:** use Replit Secrets for `DATABASE_URL`, session secret, and any keys. No external paid services.
- **Deployment:** configure a Replit **Autoscale Deployment** (build: `vite build` + server bundle; run: the Express server serving the built client). App must run and be reachable on its Replit URL.

## 2. Security (required)
- All routes except the login/callback are protected; unauthenticated users are redirected to Replit Auth login.
- Server-side authorization on every API route (never trust the client); reject requests from users not in the allowlist.
- Parameterized queries only (Drizzle). Data is confidential safety information.
- Add a visible "CONFIDENTIAL — Internal Use Only" footer on every page.

## 3. Branding (apply throughout)
- Primary dark green **#006838**, lime accent **#8DC63F**, purple accent **#7B2D8E**.
- Neutral chart background option **#F1EFEC** (cream) for "square" presentation charts.
- Fonts: clean sans-serif (Arial/Inter). Headers bold and dark.
- Logo placeholder top-left labeled "BALDOR — Transportation Safety."

## 4. Branches (canonical list)
Derive branch from the first 3 characters of the incident **Location** field, uppercased:
- **BNY** = Bronx HQ (largest fleet) · **BMA** = Chelsea/Boston (also shown as "BB") · **BPA** = Philadelphia · **BDC** = Lanham/DC · **BFS** = misc/other.
Always order branches BNY, BMA, BPA, BDC in outputs. Exclude any branch with zero records from a given chart rather than showing an empty bar.

## 5. Database Schema (Drizzle / PostgreSQL)
Create these tables:

**incidents** (one row per uploaded incident record)
- id (uuid, pk, default gen_random_uuid())
- occurrence_number (text)
- record_id (text)              -- raw "#" field, may contain a dash suffix like "2026000495-2"
- base_occurrence (text)        -- record_id with any trailing "-N" stripped
- suffix (int, nullable)        -- the N from a "-N" suffix, null if none
- is_followon (boolean)         -- true if this is a continuation record (see dedup rule)
- incident_type (text)
- employee (text)
- employee_number (text)
- loss_date (date)
- report_date (date)
- location (text)
- branch (text)                 -- derived, first 3 chars of location
- osha_recordable (text)
- dot_recordable (text)
- event_description (text)
- status (text)
- claim_number (text)
- preventable (text)            -- 'Yes' | 'No' | null/blank (pending)
- injury_type_code (text)
- tenure_years (numeric, nullable)
- hire_date (date, nullable)
- tenure_days (int, nullable)   -- computed = loss_date - hire_date
- tier (int, nullable)          -- severity 1=least … 3=most
- is_injury (boolean)           -- true if incident_type contains "Injured"
- upload_batch_id (uuid, fk)
- created_at (timestamptz, default now())

**mileage** (for accidents-per-million-miles)
- id, branch (text), year (int), month (int), miles (numeric), unique(branch, year, month)

**overrides** (manual preventability corrections, applied on import)
- id, occurrence_number (text, unique), preventable (text)  -- seed: 2026000622 → 'Yes'; 2026000606 → 'No'

**snow_events** (weather-attribution config)
- id, year (int), month (int), attributable_count (int), note (text)
- seed 2026: (2026,1,4,'Dec 26-27 storm residuals into early Jan'), (2026,2,12,'Blizzard Feb 22-23, 19.7" + aftermath'), (2026,3,3,'Feb cold-snap ice')

**upload_batches**
- id (uuid), filename (text), uploaded_by (text), uploaded_at (timestamptz), row_count (int), notes (text)

**app_users**
- id (uuid), email (text, unique), role (text default 'viewer'), allowlisted (boolean default false), created_at (timestamptz)

## 6. Data Ingestion & Cleaning Rules (this is the "expert knowledge" — implement exactly)
When a file is uploaded, parse it (header row may not be row 1 — detect the row containing "Occurrence Number"/"Loss Date"), map columns flexibly (column names vary slightly between exports), then apply this pipeline before inserting:

1. **Derive record_id** from the "#" column; compute base_occurrence (strip trailing "-N") and suffix.
2. **De-duplicate to ORIGINAL incidents only.** Group by base_occurrence. If a "clean" record exists (no dash suffix) keep that one and mark all dashed records is_followon=true. If NO clean record exists, keep the lowest-suffix record and mark the rest is_followon=true. **Charts and counts must only ever use rows where is_followon = false.** (This prevents continuation records like "-2/-3/-4" from inflating totals.)
3. **Branch** = uppercase first 3 chars of Location.
4. **is_injury** = incident_type contains "Injured" (case-insensitive).
5. **Restore classification:** if an incoming row's preventable is blank but a prior stored row with the same occurrence_number has 'Yes'/'No', carry the prior value forward (new exports often arrive unclassified).
6. **Apply overrides** table after restore (override wins).
7. **tenure_days** = loss_date − hire_date (when hire_date present).
8. On insert, upsert by occurrence_number so re-uploading an updated export refreshes classifications rather than duplicating.

**Preventability conventions for charting:**
- **Preventable (red):** preventable = 'Yes'. For charts that fold pending in, pending **vehicle** incidents count as preventable.
- **Non-Preventable (blue):** preventable = 'No'.
- **Pending injuries are treated as Non-Preventable** (i.e., never folded into preventable).
- **Injuries are excluded entirely from vehicle/accident charts**; they appear only in injury charts.
- Provide a per-chart toggle "Fold pending → preventable" (default ON for YoY/type charts; the new-hire chart should expose both confirmed-only and pending-folded denominators).

## 7. Chart Catalog (build each as a selectable, parameterized chart)
A request interface (see §8) maps user requests to these. Each chart: title, date-range params, branch filter where relevant, "Export PNG" button, and a small caption noting methodology (e.g., "Original incidents only; pending folded as preventable").

1. **Network Preventable YoY (Snow Attribution)** — line chart. Series: 2025 Actual (navy, full year), 2026 Target = 2025 × 0.85 (green dashed), 2026 Actual Total incl. snow (dark-red squares), 2026 Normal Ops = total − snow_events (red dotted diamonds), light-blue bars for snow-attributable count on affected months. Title line shows: "2025 Actual: [sum] | 2026 Target: [sum] | 2026 YTD Total: [sum] ([normal] Normal + [snow] Snow/Ice)". Shade future months grey.
2. **Network YoY — Preventable + Non-Preventable** — 2026 stacked bars (red preventable incl. pending + blue non-preventable) per month, with 2025 total-incident line overlaid for comparison. Weather included (nothing excluded).
3. **Per-Branch Weekly Accident** — square (1500×1500) stacked bars by week: red Preventable, blue Non-Preventable, gray Pending. One per branch; if a branch had zero incidents in range, show a celebratory "0 incidents" message instead of an empty chart.
4. **Per-Branch Injury** — square; blue bars by injury type with a red OSHA-recordable overlay rendered inside the bars.
5. **Network YTD Injuries** — blue bars by type + red OSHA overlay; caption with total and OSHA %.
6. **Incident Type Breakdown** — horizontal stacked bars, incident_type on Y, count on X; red Preventable + blue Non-Preventable; sorted by total descending; value labels + row totals. Date-range param (default trailing 30 days).
7. **New-Hire <60 Days Share of Preventables** — square bar chart, % of monthly preventables from drivers with tenure_days < 60; show "n/total" above each bar; bars ≥20% in red, else blue; caption "Tenure = incident date − hire date." Also support <90/<180/<365 day bands as a param.
8. **Branch 30-Day Trend (Arrows)** — square table; rows = branches, columns = Preventable / Non-Preventable / Injuries; show ONLY a direction symbol comparing the trailing 30 days vs the prior 30 days: ▲ green = improving (fewer), ▼ red = worsening (more), ■ gray = flat. No numbers in cells.
9. **Accidents Per Million Miles (APMM)** — uses mileage table; stacked Preventable+Non-Preventable bars with a Total APMM line; per-branch and all-company views. **Important methodology note in caption:** industry standard counts DOT-recordable accidents only; provide a toggle for "All accidents" vs "DOT-recordable only" so comparisons are apples-to-apples. Benchmark reference lines (optional): private-fleet ≈ 0.49/M, all-carrier ≈ 0.74/M.
10. **Unclassified Incidents Table** — filterable table of rows where preventable is blank (pending), with weekly and full-period views, exportable to CSV.

Square "presentation" charts (3, 4, 7, 8) use the cream #F1EFEC background and bold black title top-left to match the leadership-deck aesthetic. Standard analytical charts (1, 2, 6, 9) use white background.

## 8. Request / "Ask for a chart" Interface
Provide a prompt bar where the user types a request in plain language and the app maps it to a chart + params. No external LLM required — implement a rules-based parser (server-side) that recognizes intent keywords and date phrases, then renders the matching chart from §7. Examples it must handle:
- "weekly accident charts for each branch" → chart 3 for BNY/BMA/BPA/BDC for the most recent full week.
- "year over year preventable with snow" → chart 1.
- "incident types last 30 days" → chart 6, trailing 30 days.
- "new hire share of preventables" → chart 7.
- "branch 30 day trend" → chart 8.
- "network injuries ytd" → chart 5.
- "accidents per million miles by branch" → chart 9.
Also provide a normal dropdown/menu to pick any chart manually, with date pickers and branch filters. Parse date phrases like "last week", "trailing 30 days", "YTD", "4/18 to 5/18", and specific months.

## 9. Pages / Navigation
- **/login** — Replit Auth login screen (Baldor-branded wrapper).
- **/dashboard** — KPI summary cards (YTD preventable, YTD non-preventable, YTD injuries, OSHA %, vs target) + the "ask for a chart" bar + recent uploads.
- **/upload** — drag-and-drop xlsx/csv, preview parsed + cleaned rows (show how many follow-on duplicates were removed and how many classifications were restored), confirm to commit to DB.
- **/charts** — chart picker + rendered chart + Export PNG.
- **/data** — searchable/filterable table of all incidents; edit a single record's preventability (writes to overrides); CSV export.
- **/mileage** — enter/import monthly miles by branch for APMM.
- **/settings** — manage users + allowlist (admin), snow_events, overrides.

## 10. Acceptance Criteria
- App builds, runs on Replit, and is reachable at its deployment URL.
- Replit Auth gates all data; only allowlisted users get in; first user becomes admin.
- Uploading a real export inserts cleaned rows, removes follow-on duplicates (is_followon), restores prior classifications, and reports counts.
- Each of the 10 charts renders from stored data and exports a clean PNG.
- Re-uploading an updated export updates classifications without duplicating incidents.
- All counts exclude follow-on records and (for vehicle charts) injuries, per §6.
- Branding, confidential footer, and branch ordering applied throughout.

## 11. Build order (do this on Replit)
1. Scaffold the full-stack TS project (Vite React client + Express server, shared types).
2. Provision PostgreSQL, define Drizzle schema (§5), run `drizzle-kit push`, run the seed script (overrides + snow_events).
3. Wire Replit Auth + allowlist + role logic (§1/§2).
4. Build the ingestion pipeline (§6) with a unit test proving follow-on dedup and classification-restore.
5. Build the 10 chart endpoints + components (§7) and the request parser (§8).
6. Build pages/nav (§9), apply branding (§3), add the confidential footer.
7. Configure the Autoscale Deployment and verify acceptance criteria (§10).
