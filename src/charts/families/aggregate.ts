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
