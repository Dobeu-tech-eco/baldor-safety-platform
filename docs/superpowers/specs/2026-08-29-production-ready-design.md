# Baldor Safety Insights — Production-Ready Design

**Date:** 2026-08-29  
**Status:** Approved for spec review  
**Codebase of record:** GitHub `Dobeu-tech-eco/baldor-safety-platform`  
**Host:** Lovable project `baldor-safety-insights` (Baldor Fleet Vision)  
**Database / auth:** Lovable Cloud (this project’s Cloud database — not a separately managed Supabase project)

---

## 1. Goal

Finish the original page-by-page Safety Insights spec, wire the three live `AI-Inputs` workbooks, and ship presentation-grade chart families that match the attached Baldor decks. Harden only after those pages and ingest paths work. Then publish from GitHub to Lovable.

This pass does **not** include claims financials, a free-form chart studio, or a rewrite of first-time-setup auth.

---

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| Host | Lovable. GitHub is the only codebase of record. Lovable publishes/syncs; we do not treat the Lovable sandbox as source. |
| Database | Lovable Cloud on `baldor-safety-insights`. Schema and RLS land on that Cloud database. The app may use a Supabase-compatible client library; staff-facing copy never says “set up Supabase.” |
| Auth | Keep first-time setup. First `app_users` row is admin. Open signup remains an accepted v1 risk. |
| Scope order | Spec pages + ingest first, then harden (typecheck, tests, docs, publish). |
| Claims | Placeholder only. No incurred/cost tables. |
| Chart crafting | Hybrid: five presentation-grade families + variant bar (scope, range, Export PNG). No free-form builder. |
| Sources of truth | The three files in Google Drive `AI-Inputs`, re-uploaded over time. |

---

## 3. Architecture

One Vite + React + TypeScript SPA in this repo. Lovable Cloud stores auth users, `app_users`, incidents, mileage, overrides, snow events, upload history, and new Samsara summaries.

```
AI-Inputs workbooks  →  /upload (source router)  →  Lovable Cloud tables
                                                      ↓
                                         pages + chart presets (slide chrome)
                                                      ↓
                                         Lovable publish (GitHub → host)
```

Primary nav follows the original spec routes. `/charts` (natural-language shortcut) stays as an optional power-user page and is not in the primary sidebar.

---

## 4. Source workbooks

Folder: Google Drive `AI-Inputs`. The operator re-uploads newer copies; filenames may change. Detection is by **headers**, not filename.

### 4.1 Incidents (`Incidents (8).xlsx` and successors)

Required signals: `Occurrence Number`, `Loss Date`.

Mapped columns: `#` / record id, Occurrence Number, Incident Type, Employee, Employee Number, Loss Date, Report Date, Location, OSHA Recordable, Event Description, Status, ClaimNumber, Preventable?, Injury Type Code, Tenure, Hire Date, DOT Recordable, Tier, Accident Postal, Accident City.

There is **no** “Police Report Received?” column. DOT v1 is a list of rows where `dot_recordable = Yes`.

### 4.2 Samsara (`Driver Safety Report by Tag Summary` and successors)

Required signals: `Driver Tag` plus `Mobile Usage` or `Inattentive Driving`.

Tag-level period summary (not individual events). Stored as `samsara_tag_summaries`. Used by Family 5.

### 4.3 Miles (`Miles by Jurisdiction and Tag by Month` and successors)

Required signals: `Asset Tag Name`, `Distance (mi)`.

Period miles by tag. Written to `mileage` after tag → branch mapping.

**Tag → branch**

| Tag contains | Branch |
|--------------|--------|
| New York | BNY |
| Boston | BMA |
| Philly or Philadelphia | BPA |
| DC | BDC |

Unmapped tags are stored on the Samsara/miles row when applicable, but **excluded** from branch-scoped charts until mapped in Settings.

---

## 5. Upload router

`/upload` classifies the first sheet:

1. Incidents if headers include Occurrence Number and Loss Date.
2. Else Samsara if headers include Mobile Usage or Inattentive Driving, and Driver Tag.
3. Else Miles if headers include Asset Tag Name and Distance (mi).
4. Else hard stop: “Unrecognized workbook” listing the three expected layouts. No rows written.

Existing file-hash, row-hash, conflict review, and merge history remain. Each commit records `source_kind`: `incidents` | `samsara` | `mileage`.

**Write keys**

| Source | Table | Natural key | Re-upload |
|--------|--------|-------------|-----------|
| Incidents | `incidents` | `occurrence_number` | upsert; exact row-hash skip; conflict overwrite only if accepted |
| Samsara | `samsara_tag_summaries` | `tag` + `period_start` + `period_end` | replace that period’s rows |
| Miles | `mileage` | `branch` + `year` + `month` | upsert `miles` |

Partial commit failure marks the batch failed and shows the Lovable Cloud error. No success toast.

---

## 6. Lovable Cloud schema additions

Apply on the project Cloud database (migrations in-repo for GitHub history; applied to Lovable Cloud).

### 6.1 `samsara_tag_summaries`

- `id` uuid pk  
- `tag` text not null  
- `tag_path` text  
- `period_start` date not null  
- `period_end` date not null  
- `safety_score` numeric  
- `drive_time_seconds` integer  
- `total_distance_mi` numeric  
- `total_events` integer  
- `total_behaviors` integer  
- Behavior counts as integers from the Samsara workbook, at minimum: `mobile_usage`, `inattentive_driving`, `drowsy`, `harsh_brake`, `harsh_turn`, `harsh_accel`, `rolling_stop`, `no_seat_belt`. Family 5 reads only these eight. Extra workbook columns may be stored but are unused in this pass.  
- `upload_batch_id` uuid nullable  
- unique (`tag`, `period_start`, `period_end`)

RLS: same pattern as other business tables — caller must exist in `app_users`. Delete is admin-only.

### 6.2 `upload_batches.source_kind`

Text, default `incidents`, values `incidents` | `samsara` | `mileage`.

### 6.3 Settings: tag maps

`tag_branch_maps` (`tag_pattern` text unique, `branch` text). Seed the four mappings in §4.3. Settings can add or edit rows so a new Samsara tag can be mapped without a code change.

No claims/financial tables. No police-report column.

---

## 7. Pages

| Route | Status | Contents |
|-------|--------|----------|
| `/login` | Keep | Sign-in + first-time setup |
| `/dashboard` | Rebuild | YTD KPI row: preventable count, non-preventable count, injuries, OSHA %. No invented “vs target” KPI (no target table in this pass). Quick links to spec pages. Three live minis: APMM, Injuries by Nature, Incidents by Type |
| `/apmm` | New page | Family 2: yearly and quarterly APMM stacked bars |
| `/incidents` | New page | Searchable/filterable table + Families 1, 3, 4 |
| `/injuries` | New page | Injury-only list + injuries-by-nature bars |
| `/new-hire` | New page | Under-90-day share of preventables |
| `/distracted` | New page | Family 5 |
| `/dot` | New page | Incidents with `dot_recordable = Yes` |
| `/unclassified` | New page | Pending preventability worklist |
| `/mileage` | Keep + extend | Manual grid + accept jurisdiction miles via Upload |
| `/claims` | Placeholder | Explicit “financial claims data is not in this release” copy |
| `/methodology` | New page | Rules in §9, written as staff documentation |
| `/settings` | Keep | Overrides, snow, users, tag→branch maps |
| `/upload` | Extend | Source router + history with `source_kind` |
| `/charts` | Keep, not primary nav | Optional NL chart shortcut |

Sidebar order: Dashboard, APMM, Incidents, Injuries, New-Hire, Distracted, DOT, Unclassified, Mileage, Claims, Methodology, Settings, Upload.

Every page keeps the footer: `CONFIDENTIAL — Internal Use Only` (app chrome) and chart slides additionally show `CONFIDENTIAL — Baldor Transportation Safety`.

---

## 8. Chart system (hybrid)

The product is a **slide factory**. Each family is a locked preset that reproduces the attached decks. No measure/dimension builder in this pass.

### 8.1 Slide chrome (all families)

- Background cream `#F1EFEC`
- Title, subtitle, range, `n=` (and preventable / non-preventable split when relevant)
- In-bar or end-of-bar labels
- Source footnote
- Confidential footer
- Variant bar: scope All Company / BNY / BMA / BPA / BDC; range YTD or custom from–to; Export PNG

### 8.2 Families

**Family 1 — Accidents by type (horizontal stacked)**  
Preventable (incl. pending/blank) vs non-preventable. Types from event description. Company total and per-branch (or a company+branch grid). Sorted by total descending.

**Family 2 — APMM**  
Yearly and quarterly stacked bars. Non-preventable lime `#8DC63F`, preventable purple `#7B2D8E`. Rate = `(accidents / miles) * 1,000,000`. Incomplete periods labeled QTD / thru date.

**Family 3 — Year-over-year monthly**  
Grouped stacked bars: prior year hatched/faded vs current year solid. Variants: preventable vs non-preventable, and expanded by accident type.

**Family 4 — YoY matrix**  
Heatmap table: accident type × month, cells `2025 → 2026`, red worse / green better, YTD and Δ columns.

**Family 5 — Distracted / coaching**  
(1) Share of accident-involved drivers with each coached behavior in accident week + prior week. (2) Per-driver stacked behavior bars with fleet median reference. Requires Samsara upload for that window plus Origami accidents. If Samsara is missing, empty state pointing to Upload — not zeros.

### 8.3 Colors (charts)

- Brand green `#006838`, lime `#8DC63F`, purple `#7B2D8E`, cream `#F1EFEC`
- Type-chart preventable: terracotta ~`#A63626` (pending/blank included)
- Type-chart non-preventable: medium gray ~`#99A0A3`
- APMM: lime non-preventable, purple preventable
- YoY current-year preventable: muted red; current-year non-preventable: navy; prior year: gray hatch

Existing dashboard KPI colors may stay; slide presets follow this section.

---

## 9. Classification rules (single module)

Implement in `src/lib/classify.ts`. `/methodology` documents the same rules. All auto families call this module.

1. **First record only.** Drop suffixed follow-ons (`record_id` matching `-##`). Existing ingest already marks `is_followon`.
2. **Injuries excluded** from Families 1–4 and APMM. Injuries use `/injuries` (`is_injury` from Origami incident type containing “injured”).
3. **Accident type** is classified from **event description** keywords, not Origami Incident Type. Canonical types: Backing, Sideswipe, Rear-End, Fixed Object, Parked Vehicle, Turning, Overhead/Clearance, Merge/Lane Change, Equipment/Cargo, Pedestrian/Cyclist, Other. Unmapped → Other (counted, not dropped).
4. **Preventable includes pending/blank** on Family 1 type charts (legend text: “Preventable (incl. pending/blank)”). Families that exclude pending (specific YoY preventability slides) state that in the footnote.
5. **APMM accidents** are auto-related classified types only, after rules 1–2.
6. **Branch** from location via existing `deriveBranch`, plus §4.3 tag maps for Samsara/miles.
7. **New-hire** = tenure under 90 days at loss date (existing `tenure_days`).

Keyword order is maneuver-first and documented in `/methodology` so both years of a YoY comparison use the same rules.

---

## 10. Data flow

1. Operator drops a workbook on `/upload`.
2. Router detects source (§5).
3. Clean/review (counts, duplicates, conflicts).
4. Commit to Lovable Cloud (§5 keys).
5. Pages query scoped columns (not full-table `select *` on every chart).
6. Charts run `classify.ts` then the family renderer.
7. Family 5 joins Samsara summaries to accidents in accident week + prior week. No Samsara for that window → empty state.

Settings still write overrides, snow events, mileage edits, admin flags, and tag maps.

---

## 11. Error handling

- Lovable Cloud not wired (unpublished / missing Cloud env Lovable injects) → Login: “Lovable database is not connected.”
- Auth and query errors show the Cloud API message. No staff instructions to open a Supabase dashboard.
- Unrecognized or empty workbook → hard stop, nothing written.
- Duplicate file hash → warning; continue only on confirm.
- Conflicts → commit only with accept-conflicts.
- Missing Samsara/miles headers → name the missing headers.
- Partial commit → batch failed + Cloud error toast.
- Page query error → banner, not a blank chart.
- Empty filter result → “No rows for this scope/range” + link to Upload.
- PNG export failure → toast; chart remains.
- `/claims` → placeholder copy, not an empty chart.
- First-time setup / profile insert failure → stay on Login with the error.

---

## 12. Hardening (after pages + ingest)

- Fix current typecheck errors (`NetworkYoYSnow` unused import, `PreventabilityPie` formatter type, `Upload.tsx` unused import and stage comparison).
- `npm run typecheck` and `npm run lint` clean.
- Restore README: what the app is, Lovable host, `AI-Inputs` upload, first-time setup, chart families.
- `.env.example` lists only the client env names Lovable/GitHub already use (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` as the Cloud publishable key). Copy explains these are **Lovable Cloud** client credentials, not a self-serve Supabase project.
- Automated tests in §13.
- Publish the private Lovable project from the GitHub branch when the pass is complete.

Out of this hardening slice: allowlist rewrite, MFA, custom domain, pixel-diff against deck PNGs, bundle-splitting as a blocker.

---

## 13. Testing

### Automated

- Classify fixtures: description → type; unmapped → Other; follow-on dropped; injuries excluded from auto families; preventable-includes-pending vs exclude-pending.
- Detect fixtures: sample headers from each `AI-Inputs` layout route correctly; a random sheet is rejected.
- Miles map: four known tags; unknown tag omitted from branch charts.
- APMM: fixed accidents + miles fixture equals a known rate.
- Existing `typecheck` and `lint` pass.

No new browser e2e framework in this pass.

### Manual (Lovable preview after GitHub sync)

- Upload each of the three `AI-Inputs` files; history shows `source_kind`; re-upload merges as specified.
- Walk every route in §7.
- Variant bar: All Company vs one branch; Export PNG.
- First-time setup + sign-in; unauthenticated visit → Login.
- `/distracted` before Samsara upload shows empty state.

---

## 14. Out of scope

- Claims financial analytics (conversion, incurred, coverage, top-cost types).
- Police-report status field.
- Free-form chart studio (measures/dimensions).
- Auth allowlist / invite-only / domain lock.
- Pixel-perfect automated visual regression against the PNG decks.
- Changing host away from Lovable.

---

## 15. Implementation units

| Unit | Does | Depends on |
|------|------|------------|
| `src/lib/classify.ts` | Type, preventability, follow-on, injury exclusion | Incidents fields |
| `src/lib/detectSource.ts` | Workbook → source kind | Header row |
| `src/lib/ingest.ts` (extend) | Three commit paths | Detect + Cloud tables |
| `src/components/SlideChrome.tsx` | Title, footnote, confidential, variant bar, PNG | Family renderers |
| `src/charts/families/*` | One module per family | classify + queries |
| Pages in §7 | Route-level composition | Families + tables |
| Cloud migration | `samsara_tag_summaries`, `source_kind`, `tag_branch_maps` | Lovable Cloud |
| `/methodology` | Human-readable §9 | classify (must not drift) |

Each unit has one purpose, a small public API, and can be tested without loading the full app.

---

## 16. Success

This pass is done when:

1. The three `AI-Inputs` workbooks ingest into Lovable Cloud through `/upload`.
2. Every §7 route exists; `/claims` is an honest placeholder.
3. Families 1–4 render from incidents + mileage using §9 rules.
4. Family 5 renders after a Samsara upload, or shows the empty state.
5. Export PNG works on a family slide.
6. Typecheck and classify/detect/APMM tests pass.
7. README describes Lovable Cloud + `AI-Inputs`.
8. The GitHub branch is the source that Lovable can publish.
