import { format, parseISO, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';

export type DateRange = { from: Date; to: Date; label: string };

export function fmt(d: Date): string { return format(d, 'yyyy-MM-dd'); }

export function lastWeek(today = new Date()): DateRange {
  const prev = subDays(today, 7);
  return { from: startOfWeek(prev, { weekStartsOn: 1 }), to: endOfWeek(prev, { weekStartsOn: 1 }), label: 'Last Week' };
}
export function trailing30(today = new Date()): DateRange { return { from: subDays(today, 30), to: today, label: 'Trailing 30 Days' }; }
export function trailing60(today = new Date()): DateRange { return { from: subDays(today, 60), to: today, label: 'Trailing 60 Days' }; }
export function ytd(today = new Date()): DateRange { return { from: startOfYear(today), to: today, label: 'YTD' }; }

export function monthRange(year: number, month: number): DateRange {
  const d = new Date(year, month - 1, 1);
  return { from: startOfMonth(d), to: endOfMonth(d), label: format(d, 'MMMM yyyy') };
}

export function parseAny(s: string | null | undefined): Date | null {
  if (!s) return null;
  const str = String(s).trim();
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = parseISO(str); return isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(str)) {
    const parts = str.split(/[\/\s:]/);
    let yr = parts[2]; if (yr && yr.length === 2) yr = '20' + yr;
    const m = parts[0].padStart(2, '0'); const d = parts[1].padStart(2, '0');
    const out = parseISO(`${yr}-${m}-${d}`); return isNaN(out.getTime()) ? null : out;
  }
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    if (n > 25569 && n < 80000) {
      const out = new Date((n - 25569) * 86400 * 1000);
      return isNaN(out.getTime()) ? null : out;
    }
  }
  const out = new Date(str); return isNaN(out.getTime()) ? null : out;
}

export function monthLabel(m: number): string {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1];
}

export function weekStart(d: Date): Date { return startOfWeek(d, { weekStartsOn: 1 }); }
