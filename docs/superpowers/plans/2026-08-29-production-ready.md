# Production-Ready Safety Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the original spec pages, ingest the three `AI-Inputs` workbooks into Lovable Cloud, and ship five presentation-grade chart families, then harden typecheck/docs.

**Architecture:** GitHub SPA talks to this project's Lovable Cloud database via the existing Supabase-compatible client. Upload detects workbook kind by headers. `src/lib/classify.ts` is the single source of accident-type and preventability rules. Chart families render inside `SlideChrome`. Claims is a placeholder.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind, Recharts, html-to-image, `@supabase/supabase-js` (Lovable Cloud client), Vitest.

## Global Constraints

- Staff-facing copy never says “set up Supabase” or “open the Supabase dashboard.” Say “Lovable database” / “Lovable Cloud.”
- Auth stays first-time setup; first `app_users` row is admin.
- Claims financials are out of scope — `/claims` is placeholder copy only.
- No free-form chart studio; five locked families + variant bar only.
- No police-report column.
- Accident type comes from event description, not Origami Incident Type.
- Auto families exclude follow-ons (`is_followon`) and injuries (`is_injury`).
- Family 1 preventable includes pending/blank.
- APMM = `(accidents / miles) * 1_000_000`.
- Branch order: BNY, BMA, BPA, BDC.
- Cream slide background `#F1EFEC`; brand green `#006838`; lime `#8DC63F`; purple `#7B2D8E`.
- Type-chart preventable terracotta `#A63626`; non-preventable `#99A0A3`.
- Confidential chart footer: `CONFIDENTIAL — Baldor Transportation Safety`.
- App chrome footer stays `CONFIDENTIAL — Internal Use Only`.
- Work from `/workspace` on branch `cursor_dev/production-ready-spec-6fb3`.
- Imports at top of file only. Exhaustive `switch` over unions uses `never` in default.
- Do not commit secrets or `.env`.

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/lib/classify.ts` | Accident type from description; auto-row filter; preventability fold |
| `src/lib/detectSource.ts` | Header → `incidents` \| `samsara` \| `mileage` \| `unrecognized` |
| `src/lib/tagMap.ts` | Tag string → branch; default four maps |
| `src/lib/apmm.ts` | Rate helper |
| `src/lib/ingest.ts` | Extend: Samsara + miles commit; `source_kind` on batches |
| `src/lib/supabase.ts` | Types for new tables |
| `src/lib/colors.ts` | Add slide palette keys |
| `src/components/SlideChrome.tsx` | Slide chrome + variant bar + PNG |
| `src/components/PageBanner.tsx` | Query-error / empty-state banner |
| `src/charts/families/aggregate.ts` | Pure aggregators for families 1–5 |
| `src/charts/families/FamilyType.tsx` | Family 1 |
| `src/charts/families/FamilyApmm.tsx` | Family 2 |
| `src/charts/families/FamilyYoyMonthly.tsx` | Family 3 |
| `src/charts/families/FamilyYoyMatrix.tsx` | Family 4 |
| `src/charts/families/FamilyDistracted.tsx` | Family 5 |
| `src/pages/*.tsx` | Spec routes |
| `src/App.tsx` | New routes |
| `src/components/Layout.tsx` | Spec sidebar |
| `supabase/migrations/20260829180000_samsara_tag_maps.sql` | Cloud schema |
| `src/lib/classify.test.ts` | Classify tests |
| `src/lib/detectSource.test.ts` | Detect tests |
| `src/lib/tagMap.test.ts` | Tag map tests |
| `src/lib/apmm.test.ts` | APMM tests |
| `src/charts/families/aggregate.test.ts` | Aggregator tests |
| `README.md` | Lovable Cloud + AI-Inputs |
| `.env.example` | Cloud client env names |

---

### Task 1: Vitest + classify module

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script and `vitest` devDependency)
- Create: `src/lib/classify.ts`
- Create: `src/lib/classify.test.ts`
- Modify: `src/lib/queries.ts` — re-export `preventabilityClass` as `classify` so existing charts keep compiling

**Interfaces:**
- Consumes: `Incident` from `src/lib/supabase.ts`
- Produces: `AccidentType`, `ACCIDENT_TYPES`, `classifyAccidentType(description: string): AccidentType`, `isAutoFamilyRow(row: { is_followon: boolean; is_injury: boolean }): boolean`, `preventabilityClass(row: { preventable: string; is_injury: boolean }, foldPending: boolean): 'preventable' | 'nonpreventable' | 'pending'`

- [ ] **Step 1: Add vitest**

```json
"test": "vitest run"
```

Install: `npm install -D vitest`

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { classifyAccidentType, isAutoFamilyRow, preventabilityClass } from './classify';

describe('classifyAccidentType', () => {
  it('classifies backing from description', () => {
    expect(classifyAccidentType('Driver was backing into the dock')).toBe('Backing');
  });
  it('classifies sideswipe', () => {
    expect(classifyAccidentType('Sideswipe while changing lanes')).toBe('Sideswipe');
  });
  it('prefers backing over other when both appear (maneuver-first)', () => {
    expect(classifyAccidentType('Backing into a parked vehicle')).toBe('Backing');
  });
  it('maps unknown text to Other', () => {
    expect(classifyAccidentType('Mysterious incident')).toBe('Other');
  });
  it('classifies rear-end, fixed object, parked, turning, overhead, merge, cargo, pedestrian', () => {
    expect(classifyAccidentType('rear-ended the car ahead')).toBe('Rear-End');
    expect(classifyAccidentType('struck a fixed object pole')).toBe('Fixed Object');
    expect(classifyAccidentType('hit a parked vehicle')).toBe('Parked Vehicle');
    expect(classifyAccidentType('turning left at the light')).toBe('Turning');
    expect(classifyAccidentType('overhead clearance strike')).toBe('Overhead/Clearance');
    expect(classifyAccidentType('merge / lane change contact')).toBe('Merge/Lane Change');
    expect(classifyAccidentType('equipment/cargo shift')).toBe('Equipment/Cargo');
    expect(classifyAccidentType('pedestrian / cyclist')).toBe('Pedestrian/Cyclist');
  });
});

describe('isAutoFamilyRow', () => {
  it('drops follow-ons and injuries', () => {
    expect(isAutoFamilyRow({ is_followon: true, is_injury: false })).toBe(false);
    expect(isAutoFamilyRow({ is_followon: false, is_injury: true })).toBe(false);
    expect(isAutoFamilyRow({ is_followon: false, is_injury: false })).toBe(true);
  });
});

describe('preventabilityClass', () => {
  it('folds pending into preventable when foldPending is true', () => {
    expect(preventabilityClass({ preventable: '', is_injury: false }, true)).toBe('preventable');
  });
  it('returns pending when foldPending is false', () => {
    expect(preventabilityClass({ preventable: '', is_injury: false }, false)).toBe('pending');
  });
  it('maps Yes and No', () => {
    expect(preventabilityClass({ preventable: 'Yes', is_injury: false }, true)).toBe('preventable');
    expect(preventabilityClass({ preventable: 'No', is_injury: false }, true)).toBe('nonpreventable');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/classify.test.ts`
Expected: FAIL — `classify` module not found

- [ ] **Step 4: Write `src/lib/classify.ts`**

```ts
export const ACCIDENT_TYPES = [
  'Backing',
  'Sideswipe',
  'Rear-End',
  'Fixed Object',
  'Parked Vehicle',
  'Turning',
  'Overhead/Clearance',
  'Merge/Lane Change',
  'Equipment/Cargo',
  'Pedestrian/Cyclist',
  'Other',
] as const;

export type AccidentType = (typeof ACCIDENT_TYPES)[number];

const RULES: { type: AccidentType; pattern: RegExp }[] = [
  { type: 'Backing', pattern: /\bback(?:ing|ed|s)?\b/i },
  { type: 'Sideswipe', pattern: /\bsideswipe\b/i },
  { type: 'Rear-End', pattern: /\brear[-\s]?end/i },
  { type: 'Parked Vehicle', pattern: /\bparked\b/i },
  { type: 'Fixed Object', pattern: /\bfixed object\b|\bpole\b|\bguardrail\b/i },
  { type: 'Overhead/Clearance', pattern: /\boverhead\b|\bclearance\b/i },
  { type: 'Merge/Lane Change', pattern: /\bmerge\b|\blane change\b/i },
  { type: 'Equipment/Cargo', pattern: /\bequipment\b|\bcargo\b/i },
  { type: 'Pedestrian/Cyclist', pattern: /\bpedestrian\b|\bcyclist\b|\bbicycl/i },
  { type: 'Turning', pattern: /\bturn(?:ing|ed)?\b/i },
];

export function classifyAccidentType(description: string): AccidentType {
  const text = description ?? '';
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.type;
  }
  return 'Other';
}

export function isAutoFamilyRow(row: { is_followon: boolean; is_injury: boolean }): boolean {
  return !row.is_followon && !row.is_injury;
}

export function preventabilityClass(
  row: { preventable: string; is_injury: boolean },
  foldPending: boolean,
): 'preventable' | 'nonpreventable' | 'pending' {
  if (row.preventable === 'Yes') return 'preventable';
  if (row.preventable === 'No') return 'nonpreventable';
  if (row.is_injury) return 'nonpreventable';
  if (foldPending) return 'preventable';
  return 'pending';
}
```

In `src/lib/queries.ts` replace the local `classify` function with:

```ts
import { preventabilityClass } from './classify';

export function classify(row: Incident, foldPending = true): 'preventable' | 'nonpreventable' | 'pending' {
  return preventabilityClass(row, foldPending);
}
```

Keep `fetchIncidents` as it is.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/classify.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/classify.ts src/lib/classify.test.ts src/lib/queries.ts
git commit -m "feat: add classify module and vitest"
```

---

### Task 2: Detect source, tag map, APMM rate

**Files:**
- Create: `src/lib/detectSource.ts`
- Create: `src/lib/detectSource.test.ts`
- Create: `src/lib/tagMap.ts`
- Create: `src/lib/tagMap.test.ts`
- Create: `src/lib/apmm.ts`
- Create: `src/lib/apmm.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `SourceKind = 'incidents' | 'samsara' | 'mileage' | 'unrecognized'`, `detectSource(headers: string[]): SourceKind`, `DEFAULT_TAG_MAPS`, `mapTagToBranch(tag: string, maps?: { tag_pattern: string; branch: string }[]): string | null`, `computeApmm(accidents: number, miles: number): number | null`

- [ ] **Step 1: Write failing tests**

`src/lib/detectSource.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { detectSource } from './detectSource';

describe('detectSource', () => {
  it('detects incidents', () => {
    expect(detectSource(['Occurrence Number', 'Loss Date', 'Employee'])).toBe('incidents');
  });
  it('detects samsara', () => {
    expect(detectSource(['Driver Tag', 'Mobile Usage', 'Inattentive Driving'])).toBe('samsara');
  });
  it('detects mileage', () => {
    expect(detectSource(['Asset Tag Name', 'Distance (mi) (mi) [Sum]'])).toBe('mileage');
  });
  it('rejects unknown sheets', () => {
    expect(detectSource(['Foo', 'Bar'])).toBe('unrecognized');
  });
});
```

`src/lib/tagMap.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mapTagToBranch, DEFAULT_TAG_MAPS } from './tagMap';

describe('mapTagToBranch', () => {
  it('maps the four known tags', () => {
    expect(mapTagToBranch('New York', DEFAULT_TAG_MAPS)).toBe('BNY');
    expect(mapTagToBranch('Boston', DEFAULT_TAG_MAPS)).toBe('BMA');
    expect(mapTagToBranch('Philly', DEFAULT_TAG_MAPS)).toBe('BPA');
    expect(mapTagToBranch('Philadelphia', DEFAULT_TAG_MAPS)).toBe('BPA');
    expect(mapTagToBranch('DC', DEFAULT_TAG_MAPS)).toBe('BDC');
  });
  it('returns null for unknown tags', () => {
    expect(mapTagToBranch('Yard Jockeys', DEFAULT_TAG_MAPS)).toBeNull();
  });
});
```

`src/lib/apmm.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { computeApmm } from './apmm';

describe('computeApmm', () => {
  it('computes the known fixture rate', () => {
    expect(computeApmm(51.3, 1_000_000)).toBe(51.3);
    expect(computeApmm(10, 500_000)).toBe(20);
  });
  it('returns null when miles are 0', () => {
    expect(computeApmm(10, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run src/lib/detectSource.test.ts src/lib/tagMap.test.ts src/lib/apmm.test.ts`

- [ ] **Step 3: Implement**

`src/lib/detectSource.ts`:

```ts
export type SourceKind = 'incidents' | 'samsara' | 'mileage' | 'unrecognized';

function norm(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function detectSource(headers: string[]): SourceKind {
  const h = headers.map(norm);
  const has = (part: string) => h.some((x) => x.includes(part));
  if (has('occurrence number') && has('loss date')) return 'incidents';
  if (has('driver tag') && (has('mobile usage') || has('inattentive driving'))) return 'samsara';
  if (has('asset tag') && has('distance')) return 'mileage';
  return 'unrecognized';
}
```

`src/lib/tagMap.ts`:

```ts
export type TagBranchMap = { tag_pattern: string; branch: string };

export const DEFAULT_TAG_MAPS: TagBranchMap[] = [
  { tag_pattern: 'new york', branch: 'BNY' },
  { tag_pattern: 'boston', branch: 'BMA' },
  { tag_pattern: 'philadelphia', branch: 'BPA' },
  { tag_pattern: 'philly', branch: 'BPA' },
  { tag_pattern: 'dc', branch: 'BDC' },
];

export function mapTagToBranch(tag: string, maps: TagBranchMap[] = DEFAULT_TAG_MAPS): string | null {
  const t = tag.toLowerCase();
  for (const m of maps) {
    if (t.includes(m.tag_pattern.toLowerCase())) return m.branch;
  }
  return null;
}
```

`src/lib/apmm.ts`:

```ts
export function computeApmm(accidents: number, miles: number): number | null {
  if (!miles) return null;
  return (accidents / miles) * 1_000_000;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run src/lib/detectSource.test.ts src/lib/tagMap.test.ts src/lib/apmm.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/detectSource.ts src/lib/detectSource.test.ts src/lib/tagMap.ts src/lib/tagMap.test.ts src/lib/apmm.ts src/lib/apmm.test.ts
git commit -m "feat: add source detect, tag map, and APMM rate"
```

---

### Task 3: Family aggregators (pure, tested)

**Files:**
- Create: `src/charts/families/aggregate.ts`
- Create: `src/charts/families/aggregate.test.ts`

**Interfaces:**
- Consumes: `classifyAccidentType`, `isAutoFamilyRow`, `preventabilityClass`, `computeApmm`, `ACCIDENT_TYPES`
- Produces: `TypeBar`, `aggregateByType(rows)`, `YoyCell`, `aggregateYoyMatrix(rows, yearA, yearB, throughMonth)`, `ApmmPoint`, `aggregateApmmYearly(rows, mileageByYear)`

Use this incident shape in tests (minimal):

```ts
type Row = {
  event_description: string;
  preventable: string;
  is_followon: boolean;
  is_injury: boolean;
  loss_date: string | null;
  branch: string;
};
```

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { aggregateByType, aggregateYoyMatrix, aggregateApmmYearly } from './aggregate';

const base = { is_followon: false, is_injury: false, branch: 'BNY', preventable: 'Yes' };

describe('aggregateByType', () => {
  it('stacks preventable including pending and drops injuries', () => {
    const rows = [
      { ...base, event_description: 'backing into dock', preventable: 'Yes', loss_date: '2026-01-02' },
      { ...base, event_description: 'backing hit', preventable: '', loss_date: '2026-01-03' },
      { ...base, event_description: 'backing other car', preventable: 'No', loss_date: '2026-01-04' },
      { ...base, event_description: 'backing', is_injury: true, loss_date: '2026-01-05' },
    ];
    const bars = aggregateByType(rows);
    const backing = bars.find((b) => b.type === 'Backing');
    expect(backing).toEqual({ type: 'Backing', preventable: 2, nonPreventable: 1, total: 3 });
  });
});

describe('aggregateYoyMatrix', () => {
  it('compares like months across years', () => {
    const rows = [
      { ...base, event_description: 'backing', loss_date: '2025-01-10', preventable: 'Yes' },
      { ...base, event_description: 'backing', loss_date: '2026-01-11', preventable: 'Yes' },
      { ...base, event_description: 'backing', loss_date: '2026-01-12', preventable: 'Yes' },
    ];
    const matrix = aggregateYoyMatrix(rows, 2025, 2026, 1);
    const backing = matrix.find((r) => r.type === 'Backing');
    expect(backing?.months[0]).toEqual({ a: 1, b: 2 });
    expect(backing?.ytdA).toBe(1);
    expect(backing?.ytdB).toBe(2);
    expect(backing?.delta).toBe(1);
  });
});

describe('aggregateApmmYearly', () => {
  it('uses computeApmm per year', () => {
    const rows = [
      { ...base, event_description: 'backing', loss_date: '2026-03-01', preventable: 'Yes' },
      { ...base, event_description: 'sideswipe', loss_date: '2026-03-02', preventable: 'No' },
    ];
    const points = aggregateApmmYearly(rows, { 2026: 1_000_000 });
    expect(points[0].year).toBe(2026);
    expect(points[0].preventableApmm).toBe(1);
    expect(points[0].nonPreventableApmm).toBe(1);
    expect(points[0].totalApmm).toBe(2);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/charts/families/aggregate.test.ts`

- [ ] **Step 3: Implement `aggregate.ts`**

```ts
import { ACCIDENT_TYPES, AccidentType, classifyAccidentType, isAutoFamilyRow, preventabilityClass } from '../../lib/classify';
import { computeApmm } from '../../lib/apmm';

export type AutoRow = {
  event_description: string;
  preventable: string;
  is_followon: boolean;
  is_injury: boolean;
  loss_date: string | null;
  branch: string;
};

export type TypeBar = { type: AccidentType; preventable: number; nonPreventable: number; total: number };

export function autoRows(rows: AutoRow[]): AutoRow[] {
  return rows.filter((r) => isAutoFamilyRow(r) && r.loss_date);
}

export function aggregateByType(rows: AutoRow[]): TypeBar[] {
  const map = new Map<AccidentType, { preventable: number; nonPreventable: number }>();
  for (const t of ACCIDENT_TYPES) map.set(t, { preventable: 0, nonPreventable: 0 });
  for (const r of autoRows(rows)) {
    const type = classifyAccidentType(r.event_description);
    const prev = preventabilityClass(r, true);
    const slot = map.get(type)!;
    if (prev === 'nonpreventable') slot.nonPreventable += 1;
    else slot.preventable += 1;
  }
  return ACCIDENT_TYPES.map((type) => {
    const s = map.get(type)!;
    return { type, preventable: s.preventable, nonPreventable: s.nonPreventable, total: s.preventable + s.nonPreventable };
  }).filter((b) => b.total > 0).sort((a, b) => b.total - a.total);
}

export type YoyMatrixRow = {
  type: AccidentType;
  months: { a: number; b: number }[];
  ytdA: number;
  ytdB: number;
  delta: number;
};

export function aggregateYoyMatrix(rows: AutoRow[], yearA: number, yearB: number, throughMonth: number): YoyMatrixRow[] {
  const counts = new Map<string, number>();
  const key = (type: string, year: number, month: number) => `${type}|${year}|${month}`;
  for (const r of autoRows(rows)) {
    const d = new Date(r.loss_date as string);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    if (m > throughMonth) continue;
    if (y !== yearA && y !== yearB) continue;
    const type = classifyAccidentType(r.event_description);
    const k = key(type, y, m);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return ACCIDENT_TYPES.map((type) => {
    const months = Array.from({ length: throughMonth }, (_, i) => ({
      a: counts.get(key(type, yearA, i + 1)) ?? 0,
      b: counts.get(key(type, yearB, i + 1)) ?? 0,
    }));
    const ytdA = months.reduce((s, x) => s + x.a, 0);
    const ytdB = months.reduce((s, x) => s + x.b, 0);
    return { type, months, ytdA, ytdB, delta: ytdB - ytdA };
  }).filter((r) => r.ytdA + r.ytdB > 0);
}

export type ApmmYearPoint = {
  year: number;
  preventableApmm: number | null;
  nonPreventableApmm: number | null;
  totalApmm: number | null;
};

export function aggregateApmmYearly(rows: AutoRow[], mileageByYear: Record<number, number>): ApmmYearPoint[] {
  const years = Object.keys(mileageByYear).map(Number).sort();
  return years.map((year) => {
    const ofYear = autoRows(rows).filter((r) => new Date(r.loss_date as string).getUTCFullYear() === year);
    let p = 0;
    let n = 0;
    for (const r of ofYear) {
      if (preventabilityClass(r, true) === 'nonpreventable') n += 1;
      else p += 1;
    }
    const miles = mileageByYear[year] ?? 0;
    const preventableApmm = computeApmm(p, miles);
    const nonPreventableApmm = computeApmm(n, miles);
    const totalApmm = computeApmm(p + n, miles);
    return { year, preventableApmm, nonPreventableApmm, totalApmm };
  });
}

export type YoyMonthBar = {
  month: number;
  year: number;
  preventable: number;
  nonPreventable: number;
  total: number;
};

export function aggregateYoyMonthly(rows: AutoRow[], yearA: number, yearB: number, throughMonth: number): YoyMonthBar[] {
  const out: YoyMonthBar[] = [];
  for (const year of [yearA, yearB]) {
    for (let month = 1; month <= throughMonth; month++) {
      let preventable = 0;
      let nonPreventable = 0;
      for (const r of autoRows(rows)) {
        const d = new Date(r.loss_date as string);
        if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month) continue;
        if (preventabilityClass(r, false) === 'pending') continue;
        if (preventabilityClass(r, false) === 'nonpreventable') nonPreventable += 1;
        else preventable += 1;
      }
      out.push({ month, year, preventable, nonPreventable, total: preventable + nonPreventable });
    }
  }
  return out;
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/charts/families/aggregate.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/charts/families/aggregate.ts src/charts/families/aggregate.test.ts
git commit -m "feat: add tested chart family aggregators"
```

---

### Task 4: Lovable Cloud migration + TypeScript types

**Files:**
- Create: `supabase/migrations/20260829180000_samsara_tag_maps.sql`
- Modify: `src/lib/supabase.ts`

**Interfaces:**
- Consumes: existing RLS style in `supabase/migrations/20260603133649_tighten_rls_policies.sql`
- Produces: tables `samsara_tag_summaries`, `tag_branch_maps`; column `upload_batches.source_kind`; types `SamsaraTagSummary`, `TagBranchMapRow`, `UploadBatch.source_kind`

- [ ] **Step 1: Write migration**

```sql
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
```

- [ ] **Step 2: Extend types in `src/lib/supabase.ts`**

Add to `UploadBatch`: `source_kind: 'incidents' | 'samsara' | 'mileage';`

Add:

```ts
export type SamsaraTagSummary = {
  id: string;
  tag: string;
  tag_path: string;
  period_start: string;
  period_end: string;
  safety_score: number | null;
  drive_time_seconds: number | null;
  total_distance_mi: number | null;
  total_events: number | null;
  total_behaviors: number | null;
  mobile_usage: number;
  inattentive_driving: number;
  drowsy: number;
  harsh_brake: number;
  harsh_turn: number;
  harsh_accel: number;
  rolling_stop: number;
  no_seat_belt: number;
  upload_batch_id: string | null;
};

export type TagBranchMapRow = { id: string; tag_pattern: string; branch: string };
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260829180000_samsara_tag_maps.sql src/lib/supabase.ts
git commit -m "feat: add samsara summaries and tag map schema"
```

---

### Task 5: Ingest Samsara and miles

**Files:**
- Modify: `src/lib/ingest.ts`
- Create: `src/lib/ingestSources.ts` (parse + commit for samsara/miles so ingest.ts does not grow unbounded)

**Interfaces:**
- Consumes: `detectSource`, `mapTagToBranch`, `DEFAULT_TAG_MAPS`
- Produces: `readFirstSheetHeaders(buffer: ArrayBuffer): string[]`, `parseSamsaraWorkbook(buffer)`, `parseMilesWorkbook(buffer)`, `commitSamsara(...)`, `commitMiles(...)`

- [ ] **Step 1: Implement `src/lib/ingestSources.ts`**

Export:

```ts
export function readFirstSheetHeaders(file: ArrayBuffer): string[];
export function parseSamsaraWorkbook(file: ArrayBuffer): {
  tag: string;
  tag_path: string;
  period_start: string;
  period_end: string;
  mobile_usage: number;
  inattentive_driving: number;
  drowsy: number;
  harsh_brake: number;
  harsh_turn: number;
  harsh_accel: number;
  rolling_stop: number;
  no_seat_belt: number;
  safety_score: number | null;
  total_distance_mi: number | null;
  total_events: number | null;
  total_behaviors: number | null;
}[];
export function parseMilesWorkbook(file: ArrayBuffer): {
  tag: string;
  year: number;
  month: number;
  miles: number;
}[];
```

Parsing rules:
- Use `xlsx` `sheet_to_json` header:1 like `parseWorkbook`.
- Header row = first row that contains the detect-source signals.
- Samsara period: if the file has no per-row dates, accept `periodStart`/`periodEnd` passed into `commitSamsara` from the upload UI (default: infer from filename dates `Apr_01_2026` / `Aug_28_2026` via regex `([A-Za-z]{3})_(\d{2})_(\d{4})`). If none, use the last calendar month.
- Miles: `Start Time (Start)` → year/month; `Distance (mi)` column is the first header containing `distance`.
- `commitSamsara`: insert `upload_batches` with `source_kind: 'samsara'`, then upsert summaries on `(tag, period_start, period_end)`.
- `commitMiles`: insert batch `source_kind: 'mileage'`; for each row `mapTagToBranch`; skip unmapped for `mileage` table but return `unmappedCount`; upsert `{ branch, year, month, miles }`.

Also export `UNRECOGNIZED_MESSAGE` =

`Unrecognized workbook. Expected one of: Incidents (Occurrence Number + Loss Date), Samsara Driver Safety (Driver Tag + Mobile Usage or Inattentive Driving), or Miles by Jurisdiction (Asset Tag Name + Distance).`

- [ ] **Step 2: Add a unit test file `src/lib/ingestSources.test.ts`** that builds tiny AOA workbooks with `XLSX.utils.aoa_to_sheet` / `book_new` and asserts detect+parse counts.

Example miles sheet:

```ts
[['Asset Tag Name', 'Start Time (Start)', 'Distance (mi)'], ['Boston', 'Jun 1 2026 12:00:00AM EDT', '1000']]
```

Example samsara sheet:

```ts
[['Driver Tag', 'Mobile Usage', 'Inattentive Driving', 'Drowsy', 'Harsh Brake', 'Harsh Turn', 'Harsh Accel', 'Rolling Stop', 'No Seat Belt'],
 ['New York', '2', '1', '0', '3', '0', '0', '1', '0']]
```

- [ ] **Step 3: Run `npx vitest run src/lib/ingestSources.test.ts` — PASS**

- [ ] **Step 4: Commit**

```bash
git add src/lib/ingestSources.ts src/lib/ingestSources.test.ts
git commit -m "feat: parse and commit Samsara and miles workbooks"
```

---

### Task 6: Slide chrome, colors, page banner

**Files:**
- Create: `src/components/SlideChrome.tsx`
- Create: `src/components/PageBanner.tsx`
- Modify: `src/lib/colors.ts`

**Interfaces:**
- Consumes: `BRANCH_ORDER` from `src/lib/branches.ts`, `DateRange` from `src/lib/dates.ts`, `toPng` from `html-to-image`
- Produces: `SlideChrome` props `{ title, subtitle, nLabel, footnote, scope, onScope, range, onRange, children }`; `PageBanner` props `{ kind: 'error' | 'empty' | 'info'; text: string; to?: string }`

- [ ] **Step 1: Add colors**

```ts
  slideCream: '#F1EFEC',
  typePreventable: '#A63626',
  typeNonPreventable: '#99A0A3',
  slideConfidential: '#006838',
```

- [ ] **Step 2: Implement `SlideChrome`**

- Outer cream `#F1EFEC` panel
- Title (green `#006838`), subtitle, `nLabel`
- Variant controls: All Company + four branches; YTD button; two date inputs for custom range
- Export PNG via `html-to-image` `toPng` on the cream panel; on failure call optional `onExportError`
- Footnote left; `CONFIDENTIAL — Baldor Transportation Safety` right
- Default `onRange` receives `ytd()` when YTD clicked

- [ ] **Step 3: Implement `PageBanner`**

Error: red border. Empty: gray + optional `Link` to `/upload`. Never invent zero charts.

- [ ] **Step 4: Commit**

```bash
git add src/components/SlideChrome.tsx src/components/PageBanner.tsx src/lib/colors.ts
git commit -m "feat: add slide chrome and page banners"
```

---

### Task 7: Family chart components

**Files:**
- Create: `src/charts/families/FamilyType.tsx`
- Create: `src/charts/families/FamilyApmm.tsx`
- Create: `src/charts/families/FamilyYoyMonthly.tsx`
- Create: `src/charts/families/FamilyYoyMatrix.tsx`
- Create: `src/charts/families/FamilyDistracted.tsx`

**Interfaces:**
- Consumes: aggregators, `SlideChrome`, `fetchIncidents`, mileage + samsara tables
- Produces: five default-exported React pages/sections that accept `{ incidents, mileage?, samsara?, range, branch }` where possible so pages can fetch once

Rules:
- Family 1: horizontal stacked BarChart, terracotta / gray, in-bar labels, end totals + %.
- Family 2: yearly and quarterly stacked vertical bars, lime / purple, APMM labels. Quarterly uses `getUTCMonth() / 3`.
- Family 3: grouped stacked bars yearA hatched (`fillOpacity: 0.45`) vs yearB solid; exclude pending (footnote: “pending/unclassified preventability excluded”).
- Family 4: HTML table heatmap; red `#f8d7da` if b>a, green `#d4edda` if b<a.
- Family 5: if `samsara.length === 0` render `PageBanner` empty “Upload a Samsara Driver Safety Report…” linking `/upload`. Do not render 0% bars. Behavior share uses tag-level counts as a stand-in for driver-level when only tag summaries exist: show tag rows (not named drivers) and a note “Source: Samsara tag summaries — per-driver lead-up requires driver-level exports, not in this file.” Horizontal bars for the eight behaviors.

Exhaustive switches if any union is switched.

- [ ] **Step 1: Implement the five components**
- [ ] **Step 2: `npx vitest run` still PASS**
- [ ] **Step 3: Commit**

```bash
git add src/charts/families/FamilyType.tsx src/charts/families/FamilyApmm.tsx src/charts/families/FamilyYoyMonthly.tsx src/charts/families/FamilyYoyMatrix.tsx src/charts/families/FamilyDistracted.tsx
git commit -m "feat: add five presentation chart families"
```

---

### Task 8: Routes, layout, spec pages

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`
- Create: `src/pages/ApmmPage.tsx`, `src/pages/Incidents.tsx`, `src/pages/Injuries.tsx`, `src/pages/NewHire.tsx`, `src/pages/Distracted.tsx`, `src/pages/Dot.tsx`, `src/pages/UnclassifiedPage.tsx`, `src/pages/Claims.tsx`, `src/pages/Methodology.tsx`
- Modify: `src/pages/Dashboard.tsx`, `src/pages/Mileage.tsx`
- Keep `src/pages/Charts.tsx` routed but omit from sidebar

**Interfaces:**
- Consumes: families, `fetchIncidents`, `PageBanner`, `SlideChrome`
- Produces: routes listed below

Sidebar labels in this order: Dashboard, APMM, Incidents, Injuries, New-Hire, Distracted, DOT, Unclassified, Mileage, Claims, Methodology, Settings, Upload.

Routes:

```tsx
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/apmm" element={<ApmmPage />} />
<Route path="/incidents" element={<Incidents />} />
<Route path="/injuries" element={<Injuries />} />
<Route path="/new-hire" element={<NewHire />} />
<Route path="/distracted" element={<Distracted />} />
<Route path="/dot" element={<Dot />} />
<Route path="/unclassified" element={<UnclassifiedPage />} />
<Route path="/mileage" element={<MileagePage />} />
<Route path="/claims" element={<Claims />} />
<Route path="/methodology" element={<Methodology />} />
<Route path="/upload" element={<UploadPage />} />
<Route path="/data" element={<Navigate to="/incidents" replace />} />
<Route path="/charts" element={<Charts />} />
<Route path="/settings" element={<Settings />} />
```

Page requirements:
- Dashboard: four KPIs (YTD preventable, non-preventable, injuries, OSHA %). Quick links to the spec pages. Three minis using FamilyType (company), a small injury-type count, and FamilyApmm yearly if mileage exists. Query errors → `PageBanner` error.
- Incidents: filterable table (occurrence, branch, loss date, type from `classifyAccidentType`, preventable, claim #) + Family 1, 3, 4.
- Injuries: `is_injury` rows only + bar by `injury_type_code`.
- New-Hire: share of auto preventables with `tenure_days !== null && tenure_days < 90`.
- DOT: `dot_recordable === 'Yes'`.
- Unclassified: auto rows with `preventabilityClass(..., false) === 'pending'`.
- Claims: heading + paragraph: “Financial claims data is not in this release. This page is a placeholder.”
- Methodology: document the seven rules from the spec §9 verbatim in staff language (first-record, injuries excluded, type from description + keyword list, preventable includes pending on type charts, APMM formula, branch maps, new-hire 90 days).
- Dashboard/Incidents/etc. empty data → `PageBanner` empty with link to `/upload`.

- [ ] **Step 1: Implement routes and pages**
- [ ] **Step 2: Commit**

```bash
git add src/App.tsx src/components/Layout.tsx src/pages
git commit -m "feat: add original spec pages and sidebar"
```

---

### Task 9: Upload router, settings tag maps, login Cloud message

**Files:**
- Modify: `src/pages/Upload.tsx`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/Login.tsx`
- Modify: `src/lib/supabase.ts` — export `isCloudConfigured()` that is true when `VITE_SUPABASE_URL` and (`VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`) are non-empty

**Interfaces:**
- Consumes: `detectSource`, `readFirstSheetHeaders`, `parseSamsaraWorkbook`, `parseMilesWorkbook`, `commitSamsara`, `commitMiles`, existing incident ingest
- Produces: three-way upload; Settings CRUD for `tag_branch_maps`; Login banner if Cloud is not configured

Upload flow:
1. Read headers via `readFirstSheetHeaders`.
2. `detectSource`.
3. `unrecognized` → notice error `UNRECOGNIZED_MESSAGE`; do not parse incidents.
4. `incidents` → existing parse/clean/commit; batch already needs `source_kind: 'incidents'` added in `commitIngest` insert.
5. `samsara` / `mileage` → preview row counts + unmapped tags; commit via the new functions.
6. History table shows `source_kind`.
7. Remove unused `FileCheck2` import. Fix `committing` prop: pass `stage === 'committing'` by lifting commit into a flag `isCommitting` so the comparison is valid (use `const isCommitting = stage === 'committing'` only when stage can be that value — set stage to `committing` before await).

`commitIngest` insert payload must include `source_kind: 'incidents'`.

Login: if `!isCloudConfigured()` show “Lovable database is not connected.” above the form. Auth errors display `error.message` as today.

Settings: new section “Branch tag maps” listing `tag_branch_maps` with add (pattern + branch select BNY/BMA/BPA/BDC) and delete.

- [ ] **Step 1: Implement**
- [ ] **Step 2: `npx vitest run` PASS**
- [ ] **Step 3: Commit**

```bash
git add src/pages/Upload.tsx src/pages/Settings.tsx src/pages/Login.tsx src/lib/supabase.ts src/lib/ingest.ts
git commit -m "feat: route uploads by source and map tags in settings"
```

---

### Task 10: Harden typecheck, lint, README

**Files:**
- Modify: `src/charts/NetworkYoYSnow.tsx` (remove unused `useMemo`)
- Modify: `src/charts/PreventabilityPie.tsx` (formatter `(v) =>` accept `ValueType | undefined`)
- Modify: `src/charts/ChartRouter.tsx` (add `default` with `const _exhaustive: never = chartId; return _exhaustive;`)
- Create: `README.md`
- Create: `.env.example`

**Interfaces:**
- Consumes: none
- Produces: clean `npm run typecheck` and `npm run lint`; docs

- [ ] **Step 1: Fix typecheck errors listed above**
- [ ] **Step 2: Run `npm run typecheck` — Expected: exit 0**
- [ ] **Step 3: Run `npm run lint` — Expected: exit 0 (fix only errors you introduce; do not drive-by the repo)**
- [ ] **Step 4: Run `npx vitest run` — Expected: all PASS**
- [ ] **Step 5: README.md**

```md
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
```

`.env.example`:

```
# Lovable Cloud client (injected on Lovable; set locally for GitHub builds)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Lovable also uses VITE_SUPABASE_PUBLISHABLE_KEY — either key name works in isCloudConfigured()
```

- [ ] **Step 6: Commit**

```bash
git add src/charts/NetworkYoYSnow.tsx src/charts/PreventabilityPie.tsx src/charts/ChartRouter.tsx README.md .env.example
git commit -m "chore: harden typecheck and document Lovable Cloud"
```

---

## Self-review

1. Spec coverage: classify, detect, tag map, APMM, migration, ingest, slide chrome, five families, all §7 routes, claims placeholder, methodology, upload router, settings maps, login Cloud message, typecheck, README.
2. No TBD/TODO in this plan.
3. Type names match across tasks (`SourceKind`, `SamsaraTagSummary`, `TagBranchMapRow`, `computeApmm`).
