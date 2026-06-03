import * as XLSX from 'xlsx';
import { deriveBranch } from './branches';
import { parseAny, fmt } from './dates';
import { supabase, Incident } from './supabase';

export type ParsedRow = Partial<Incident> & { _raw: Record<string, unknown> };

const COLUMN_MAP: Record<string, keyof Incident | '_skip'> = {
  '#': 'record_id',
  'record id': 'record_id',
  'occurrence number': 'occurrence_number',
  'occurrence #': 'occurrence_number',
  'incident type': 'incident_type',
  'incident category': 'incident_type',
  'employee': 'employee',
  'employee name': 'employee',
  'employee number': 'employee_number',
  'emp no': 'employee_number',
  'loss date': 'loss_date',
  'date of loss': 'loss_date',
  'report date': 'report_date',
  'date reported': 'report_date',
  'location': 'location',
  'osha recordable': 'osha_recordable',
  'osha': 'osha_recordable',
  'dot recordable': 'dot_recordable',
  'dot': 'dot_recordable',
  'event description': 'event_description',
  'description': 'event_description',
  'status': 'status',
  'claim number': 'claim_number',
  'claim #': 'claim_number',
  'preventable': 'preventable',
  'injury type code': 'injury_type_code',
  'injury type': 'injury_type_code',
  'tenure': 'tenure_years',
  'tenure (years)': 'tenure_years',
  'hire date': 'hire_date',
  'tier': 'tier',
};

function normHeader(s: string): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseWorkbook(file: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(file, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  if (!aoa.length) return [];

  let headerRow = 0;
  for (let i = 0; i < Math.min(aoa.length, 15); i++) {
    const row = (aoa[i] || []).map((c) => normHeader(String(c)));
    if (row.some((c) => c.includes('occurrence number')) || (row.some((c) => c.includes('loss date')) && row.some((c) => c === '#' || c.includes('record')))) {
      headerRow = i; break;
    }
  }

  const headers = (aoa[headerRow] || []).map((c) => normHeader(String(c)));
  const rows: ParsedRow[] = [];
  for (let i = headerRow + 1; i < aoa.length; i++) {
    const r = aoa[i] || [];
    if (r.every((c) => c === '' || c == null)) continue;
    const obj: ParsedRow = { _raw: {} };
    headers.forEach((h, idx) => {
      const key = COLUMN_MAP[h];
      const val = r[idx];
      obj._raw[h] = val;
      if (!key || key === '_skip') return;
      if (key === 'loss_date' || key === 'report_date' || key === 'hire_date') {
        const d = parseAny(val as string);
        (obj as any)[key] = d ? fmt(d) : null;
      } else if (key === 'tenure_years') {
        const n = parseFloat(String(val));
        (obj as any)[key] = isFinite(n) ? n : null;
      } else if (key === 'tier') {
        const n = parseInt(String(val), 10);
        (obj as any)[key] = isFinite(n) ? n : null;
      } else {
        (obj as any)[key] = String(val ?? '').trim();
      }
    });
    if (!obj.occurrence_number && obj.record_id) {
      obj.occurrence_number = String(obj.record_id).replace(/-\d+$/, '');
    }
    if (!obj.occurrence_number) continue;
    rows.push(obj);
  }
  return rows;
}

export type CleanedRow = Omit<Incident, 'id' | 'created_at' | 'upload_batch_id'> & { _raw: Record<string, unknown> };
export type CleanResult = { rows: CleanedRow[]; followOnRemoved: number; classificationsRestored: number; };

export async function cleanRows(parsed: ParsedRow[]): Promise<CleanResult> {
  const { data: priorIncidents } = await supabase.from('incidents').select('occurrence_number, preventable');
  const priorMap = new Map<string, string>();
  (priorIncidents || []).forEach((r) => {
    if (r.preventable === 'Yes' || r.preventable === 'No') priorMap.set(r.occurrence_number, r.preventable);
  });

  const { data: overrides } = await supabase.from('overrides').select('occurrence_number, preventable');
  const overrideMap = new Map<string, string>();
  (overrides || []).forEach((o) => overrideMap.set(o.occurrence_number, o.preventable));

  const enriched = parsed.map((p) => {
    const recordId = String(p.record_id ?? '').trim();
    const m = recordId.match(/^(.+?)-(\d+)$/);
    const baseOccurrence = m ? m[1] : recordId;
    const suffix = m ? parseInt(m[2], 10) : null;
    const branch = deriveBranch(String(p.location ?? ''));
    const incident_type = String(p.incident_type ?? '');
    const is_injury = /injured/i.test(incident_type);
    const loss = p.loss_date ? new Date(p.loss_date) : null;
    const hire = p.hire_date ? new Date(p.hire_date) : null;
    let tenureDays: number | null = null;
    if (loss && hire) tenureDays = Math.floor((loss.getTime() - hire.getTime()) / 86400000);
    return {
      ...p,
      record_id: recordId,
      base_occurrence: baseOccurrence,
      suffix,
      branch,
      is_injury,
      tenure_days: tenureDays,
      preventable: String(p.preventable ?? '').trim(),
      is_followon: false,
    } as CleanedRow;
  });

  const groups = new Map<string, CleanedRow[]>();
  enriched.forEach((row) => {
    const key = row.base_occurrence || row.occurrence_number!;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  });

  let followOnRemoved = 0;
  groups.forEach((rows) => {
    if (rows.length === 1) return;
    const clean = rows.find((r) => r.suffix == null);
    const keeper = clean ?? rows.reduce((a, b) => ((a.suffix ?? 0) <= (b.suffix ?? 0) ? a : b));
    rows.forEach((r) => {
      if (r !== keeper) { r.is_followon = true; followOnRemoved++; }
    });
  });

  let classificationsRestored = 0;
  enriched.forEach((row) => {
    const occ = row.occurrence_number!;
    const incoming = row.preventable;
    if (!incoming || (incoming !== 'Yes' && incoming !== 'No')) {
      const prior = priorMap.get(occ);
      if (prior) { row.preventable = prior; classificationsRestored++; }
    }
    const ov = overrideMap.get(occ);
    if (ov) row.preventable = ov;
  });

  return { rows: enriched, followOnRemoved, classificationsRestored };
}

export async function commitIngest(cleaned: CleanResult, filename: string, userId: string | null): Promise<{ batchId: string; inserted: number }> {
  const { data: batch, error: batchErr } = await supabase
    .from('upload_batches')
    .insert({
      filename, uploaded_by: userId, row_count: cleaned.rows.length,
      follow_on_removed: cleaned.followOnRemoved, classifications_restored: cleaned.classificationsRestored,
    })
    .select().maybeSingle();
  if (batchErr || !batch) throw new Error(batchErr?.message || 'Failed to create upload batch');

  const payload = cleaned.rows.map((r) => {
    const { _raw, ...rest } = r as any;
    return { ...rest, upload_batch_id: batch.id, updated_at: new Date().toISOString() };
  });

  let inserted = 0;
  const chunkSize = 200;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from('incidents').upsert(chunk, { onConflict: 'occurrence_number' });
    if (error) throw new Error(error.message);
    inserted += chunk.length;
  }
  return { batchId: batch.id, inserted };
}
