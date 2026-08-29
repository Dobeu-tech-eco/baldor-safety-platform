import * as XLSX from 'xlsx';
import { endOfMonth, startOfMonth } from 'date-fns';
import { detectSource } from './detectSource';
import { fmt, parseAny } from './dates';
import { mapTagToBranch, DEFAULT_TAG_MAPS, TagBranchMap } from './tagMap';
import { supabase } from './supabase';

export const UNRECOGNIZED_MESSAGE =
  'Unrecognized workbook. Expected one of: Incidents (Occurrence Number + Loss Date), Samsara Driver Safety (Driver Tag + Mobile Usage or Inattentive Driving), or Miles by Jurisdiction (Asset Tag Name + Distance).';

export type ParsedSamsaraRow = {
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
};

export type ParsedMilesRow = {
  tag: string;
  year: number;
  month: number;
  miles: number;
};

function normHeader(s: string): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function readAoa(file: ArrayBuffer): unknown[][] {
  const wb = XLSX.read(file, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as unknown[][];
}

function findHeaderRow(aoa: unknown[][]): number {
  for (let i = 0; i < Math.min(aoa.length, 30); i++) {
    const headers = (aoa[i] || []).map((c) => String(c ?? ''));
    if (detectSource(headers) !== 'unrecognized') return i;
  }
  return 0;
}

export function readFirstSheetHeaders(file: ArrayBuffer): string[] {
  const aoa = readAoa(file);
  if (!aoa.length) return [];
  const headerRow = findHeaderRow(aoa);
  return (aoa[headerRow] || []).map((c) => String(c ?? ''));
}

function parseIntOrZero(val: unknown): number {
  const n = parseInt(String(val ?? '').replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function parseNumOrNull(val: unknown): number | null {
  const s = String(val ?? '').trim();
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

type SamsaraColField =
  | '_tag'
  | '_path'
  | 'mobile_usage'
  | 'inattentive_driving'
  | 'drowsy'
  | 'harsh_brake'
  | 'harsh_turn'
  | 'harsh_accel'
  | 'rolling_stop'
  | 'no_seat_belt'
  | 'safety_score'
  | 'total_distance_mi'
  | 'total_events'
  | 'total_behaviors';

const SAMSARA_COLS: Record<string, SamsaraColField> = {
  'driver tag': '_tag',
  'tag path': '_path',
  'mobile usage': 'mobile_usage',
  'inattentive driving': 'inattentive_driving',
  drowsy: 'drowsy',
  'harsh brake': 'harsh_brake',
  'harsh turn': 'harsh_turn',
  'harsh accel': 'harsh_accel',
  'rolling stop': 'rolling_stop',
  'no seat belt': 'no_seat_belt',
  'safety score': 'safety_score',
  'total distance': 'total_distance_mi',
  'total events': 'total_events',
  'total behaviors': 'total_behaviors',
};

function matchSamsaraCol(h: string): SamsaraColField | null {
  const n = normHeader(h);
  for (const [key, field] of Object.entries(SAMSARA_COLS)) {
    if (n === key || n.includes(key)) return field;
  }
  return null;
}

export function parseSamsaraWorkbook(file: ArrayBuffer): ParsedSamsaraRow[] {
  const aoa = readAoa(file);
  if (!aoa.length) return [];
  const headerRow = findHeaderRow(aoa);
  const headers = (aoa[headerRow] || []).map((c) => String(c ?? ''));
  if (detectSource(headers) !== 'samsara') return [];

  const rows: ParsedSamsaraRow[] = [];
  for (let i = headerRow + 1; i < aoa.length; i++) {
    const r = aoa[i] || [];
    if (r.every((c) => c === '' || c == null)) continue;

    const row: ParsedSamsaraRow = {
      tag: '',
      tag_path: '',
      period_start: '',
      period_end: '',
      mobile_usage: 0,
      inattentive_driving: 0,
      drowsy: 0,
      harsh_brake: 0,
      harsh_turn: 0,
      harsh_accel: 0,
      rolling_stop: 0,
      no_seat_belt: 0,
      safety_score: null,
      total_distance_mi: null,
      total_events: null,
      total_behaviors: null,
    };

    headers.forEach((h, idx) => {
      const field = matchSamsaraCol(h);
      if (!field) return;
      const val = r[idx];
      switch (field) {
        case '_tag':
          row.tag = String(val ?? '').trim();
          break;
        case '_path':
          row.tag_path = String(val ?? '').trim();
          break;
        case 'safety_score':
        case 'total_distance_mi':
        case 'total_events':
        case 'total_behaviors':
          row[field] = parseNumOrNull(val);
          break;
        case 'mobile_usage':
        case 'inattentive_driving':
        case 'drowsy':
        case 'harsh_brake':
        case 'harsh_turn':
        case 'harsh_accel':
        case 'rolling_stop':
        case 'no_seat_belt':
          row[field] = parseIntOrZero(val);
          break;
        default: {
          const _exhaustive: never = field;
          void _exhaustive;
        }
      }
    });

    if (!row.tag) continue;
    rows.push(row);
  }
  return rows;
}

function parseMilesStart(raw: string): Date | null {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/(\d)(AM|PM)\b/i, '$1 $2')
    .replace(/\s+[A-Z]{2,4}$/i, '');
  return parseAny(cleaned) ?? parseAny(raw);
}

export function parseMilesWorkbook(file: ArrayBuffer): ParsedMilesRow[] {
  const aoa = readAoa(file);
  if (!aoa.length) return [];
  const headerRow = findHeaderRow(aoa);
  const headers = (aoa[headerRow] || []).map((c) => String(c ?? ''));
  if (detectSource(headers) !== 'mileage') return [];

  const normed = headers.map(normHeader);
  const tagIdx = normed.findIndex((h) => h.includes('asset tag'));
  const startIdx = normed.findIndex((h) => h.includes('start time') || h === 'start');
  const distanceIdx = normed.findIndex((h) => h.includes('distance'));
  if (tagIdx < 0 || distanceIdx < 0) return [];

  const rows: ParsedMilesRow[] = [];
  for (let i = headerRow + 1; i < aoa.length; i++) {
    const r = aoa[i] || [];
    if (r.every((c) => c === '' || c == null)) continue;
    const tag = String(r[tagIdx] ?? '').trim();
    if (!tag) continue;
    const miles = parseFloat(String(r[distanceIdx] ?? '').replace(/,/g, ''));
    if (!Number.isFinite(miles)) continue;
    const startRaw = startIdx >= 0 ? String(r[startIdx] ?? '') : '';
    const d = parseMilesStart(startRaw);
    if (!d) continue;
    rows.push({
      tag,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      miles,
    });
  }
  return rows;
}

const MONTH_IDX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function lastCalendarMonth(today = new Date()): { start: string; end: string } {
  const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return { start: fmt(startOfMonth(d)), end: fmt(endOfMonth(d)) };
}

export function inferPeriodFromFilename(filename: string): { start: string; end: string } | null {
  const re = /([A-Za-z]{3})_(\d{2})_(\d{4})/g;
  const matches = [...filename.matchAll(re)];
  if (matches.length < 2) return null;
  const parse = (m: RegExpMatchArray): string | null => {
    const mon = MONTH_IDX[m[1].toLowerCase()];
    if (mon == null) return null;
    const day = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const d = new Date(year, mon, day);
    if (isNaN(d.getTime())) return null;
    return fmt(d);
  };
  const start = parse(matches[0]);
  const end = parse(matches[1]);
  if (!start || !end) return null;
  return { start, end };
}

export function resolveSamsaraPeriod(
  filename: string,
  periodStart?: string,
  periodEnd?: string,
  today = new Date()
): { start: string; end: string } {
  if (periodStart && periodEnd) return { start: periodStart, end: periodEnd };
  const fromName = inferPeriodFromFilename(filename);
  if (fromName) return fromName;
  return lastCalendarMonth(today);
}

export type CommitSamsaraResult = { batchId: string; inserted: number };
export type CommitMilesResult = { batchId: string; inserted: number; unmappedCount: number };

export async function commitSamsara(
  rows: ParsedSamsaraRow[],
  file: { name: string; size: number },
  userId: string | null,
  options: { periodStart?: string; periodEnd?: string } = {}
): Promise<CommitSamsaraResult> {
  const period = resolveSamsaraPeriod(file.name, options.periodStart, options.periodEnd);

  const { data: batch, error: batchErr } = await supabase
    .from('upload_batches')
    .insert({
      filename: file.name,
      uploaded_by: userId,
      row_count: rows.length,
      follow_on_removed: 0,
      classifications_restored: 0,
      source_kind: 'samsara',
    })
    .select()
    .maybeSingle();
  if (batchErr || !batch) throw new Error(batchErr?.message || 'Failed to create upload batch');

  const payload = rows.map((r) => ({
    tag: r.tag,
    tag_path: r.tag_path,
    period_start: period.start,
    period_end: period.end,
    mobile_usage: r.mobile_usage,
    inattentive_driving: r.inattentive_driving,
    drowsy: r.drowsy,
    harsh_brake: r.harsh_brake,
    harsh_turn: r.harsh_turn,
    harsh_accel: r.harsh_accel,
    rolling_stop: r.rolling_stop,
    no_seat_belt: r.no_seat_belt,
    safety_score: r.safety_score,
    total_distance_mi: r.total_distance_mi,
    total_events: r.total_events,
    total_behaviors: r.total_behaviors,
    upload_batch_id: batch.id,
  }));

  let inserted = 0;
  const chunkSize = 200;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('samsara_tag_summaries')
      .upsert(chunk, { onConflict: 'tag,period_start,period_end' });
    if (error) throw new Error(error.message);
    inserted += chunk.length;
  }

  return { batchId: batch.id, inserted };
}

export async function commitMiles(
  rows: ParsedMilesRow[],
  file: { name: string; size: number },
  userId: string | null,
  maps: TagBranchMap[] = DEFAULT_TAG_MAPS
): Promise<CommitMilesResult> {
  const { data: batch, error: batchErr } = await supabase
    .from('upload_batches')
    .insert({
      filename: file.name,
      uploaded_by: userId,
      row_count: rows.length,
      follow_on_removed: 0,
      classifications_restored: 0,
      source_kind: 'mileage',
    })
    .select()
    .maybeSingle();
  if (batchErr || !batch) throw new Error(batchErr?.message || 'Failed to create upload batch');

  const byKey = new Map<string, { branch: string; year: number; month: number; miles: number }>();
  let unmappedCount = 0;
  for (const row of rows) {
    const branch = mapTagToBranch(row.tag, maps);
    if (!branch) {
      unmappedCount++;
      continue;
    }
    const key = `${branch}|${row.year}|${row.month}`;
    const existing = byKey.get(key);
    if (existing) existing.miles += row.miles;
    else byKey.set(key, { branch, year: row.year, month: row.month, miles: row.miles });
  }

  const payload = [...byKey.values()];
  let inserted = 0;
  const chunkSize = 200;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from('mileage').upsert(chunk, { onConflict: 'branch,year,month' });
    if (error) throw new Error(error.message);
    inserted += chunk.length;
  }

  return { batchId: batch.id, inserted, unmappedCount };
}
