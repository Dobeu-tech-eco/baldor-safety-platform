import * as XLSX from 'xlsx';
import { deriveBranch } from './branches';
import { parseAny, fmt } from './dates';
import { supabase, Incident, UploadFile } from './supabase';

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

async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', buf as ArrayBuffer);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function computeFileHash(buffer: ArrayBuffer): Promise<string> {
  return sha256Hex(buffer);
}

function rowFingerprint(r: Partial<Incident>): string {
  return [
    r.occurrence_number ?? '',
    r.loss_date ?? '',
    (r.employee ?? '').toLowerCase().trim(),
    (r.branch ?? '').toLowerCase().trim(),
    (r.incident_type ?? '').toLowerCase().trim(),
    (r.preventable ?? '').toLowerCase().trim(),
  ].join('|');
}

export async function computeRowHash(r: Partial<Incident>): Promise<string> {
  return sha256Hex(rowFingerprint(r));
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

export type CleanedRow = Omit<Incident, 'id' | 'created_at' | 'upload_batch_id'> & { _raw: Record<string, unknown>; row_hash: string };
export type DuplicateClass = 'new' | 'exact-duplicate' | 'conflict';
export type ClassifiedRow = { row: CleanedRow; classification: DuplicateClass; existingHash?: string };
export type CleanResult = {
  rows: CleanedRow[];
  followOnRemoved: number;
  classificationsRestored: number;
  classified: ClassifiedRow[];
  newCount: number;
  duplicateCount: number;
  conflictCount: number;
};

export async function cleanRows(parsed: ParsedRow[]): Promise<CleanResult> {
  const { data: priorIncidents } = await supabase.from('incidents').select('occurrence_number, preventable, row_hash');
  const priorMap = new Map<string, string>();
  const existingHashByOcc = new Map<string, string>();
  (priorIncidents || []).forEach((r) => {
    if (r.preventable === 'Yes' || r.preventable === 'No') priorMap.set(r.occurrence_number, r.preventable);
    if (r.row_hash) existingHashByOcc.set(r.occurrence_number, r.row_hash);
  });

  const { data: overrides } = await supabase.from('overrides').select('occurrence_number, preventable');
  const overrideMap = new Map<string, string>();
  (overrides || []).forEach((o) => overrideMap.set(o.occurrence_number, o.preventable));

  const enriched: CleanedRow[] = parsed.map((p) => {
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
      row_hash: '',
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

  for (const row of enriched) {
    row.row_hash = await computeRowHash(row);
  }

  const classified: ClassifiedRow[] = enriched.map((row) => {
    const existing = existingHashByOcc.get(row.occurrence_number!);
    if (!existing) return { row, classification: 'new' as DuplicateClass };
    if (existing === row.row_hash) return { row, classification: 'exact-duplicate' as DuplicateClass, existingHash: existing };
    return { row, classification: 'conflict' as DuplicateClass, existingHash: existing };
  });

  const newCount = classified.filter((c) => c.classification === 'new').length;
  const duplicateCount = classified.filter((c) => c.classification === 'exact-duplicate').length;
  const conflictCount = classified.filter((c) => c.classification === 'conflict').length;

  return { rows: enriched, followOnRemoved, classificationsRestored, classified, newCount, duplicateCount, conflictCount };
}

export type FileDuplicateCheck = { isDuplicate: boolean; existing: UploadFile | null };

export async function checkFileDuplicate(fileHash: string): Promise<FileDuplicateCheck> {
  const { data } = await supabase.from('upload_files').select('*').eq('file_hash', fileHash).maybeSingle();
  return { isDuplicate: !!data, existing: (data as UploadFile | null) ?? null };
}

export type CommitOptions = { acceptConflicts: boolean };
export type CommitResult = {
  batchId: string;
  inserted: number;
  duplicatesSkipped: number;
  conflictsResolved: number;
  uniqueRowsKept: number;
};

export async function commitIngest(
  cleaned: CleanResult,
  file: { name: string; size: number; hash: string },
  userId: string | null,
  options: CommitOptions = { acceptConflicts: true }
): Promise<CommitResult> {
  const { data: batch, error: batchErr } = await supabase
    .from('upload_batches')
    .insert({
      filename: file.name, uploaded_by: userId, row_count: cleaned.rows.length,
      follow_on_removed: cleaned.followOnRemoved, classifications_restored: cleaned.classificationsRestored,
    })
    .select().maybeSingle();
  if (batchErr || !batch) throw new Error(batchErr?.message || 'Failed to create upload batch');

  const toWrite = cleaned.classified.filter((c) => {
    if (c.classification === 'exact-duplicate') return false;
    if (c.classification === 'conflict' && !options.acceptConflicts) return false;
    return true;
  });

  const payload = toWrite.map((c) => {
    const { _raw, ...rest } = c.row as any;
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

  await supabase.from('upload_files').insert({
    file_hash: file.hash,
    filename: file.name,
    byte_size: file.size,
    row_count: cleaned.rows.length,
    row_hashes: cleaned.rows.map((r) => r.row_hash),
    uploaded_by: userId,
    batch_id: batch.id,
  });

  const duplicatesSkipped = cleaned.duplicateCount;
  const conflictsResolved = options.acceptConflicts ? cleaned.conflictCount : 0;
  const uniqueRowsKept = cleaned.newCount + (options.acceptConflicts ? cleaned.conflictCount : 0);

  if (duplicatesSkipped > 0 || conflictsResolved > 0) {
    await supabase.from('dataset_merges').insert({
      source_batch_id: batch.id,
      target_batch_id: null,
      duplicate_rows_removed: duplicatesSkipped,
      unique_rows_kept: uniqueRowsKept,
      new_rows_added: cleaned.newCount,
      performed_by: userId,
      note: `Merged ${file.name}`,
    });
  }

  return { batchId: batch.id, inserted, duplicatesSkipped, conflictsResolved, uniqueRowsKept };
}
