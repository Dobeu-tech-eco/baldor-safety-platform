import * as XLSX from 'xlsx';
import { parseAny, fmt } from './dates';
import { api, type Incident, type UploadFile } from './api';

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

/** Strip the client-only `_raw` payload before sending rows to the server. */
function toServerRows(parsed: ParsedRow[]): Record<string, unknown>[] {
  return parsed.map(({ _raw, ...rest }) => rest);
}

export type CleanedRow = Omit<Incident, 'id' | 'created_at' | 'upload_batch_id'> & { row_hash: string };
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
  /** The original parsed rows; re-sent on commit so the server stays authoritative. */
  parsed: ParsedRow[];
};

/** Runs the ingestion pipeline server-side (dedup, restore, overrides) without writing. */
export async function cleanRows(parsed: ParsedRow[]): Promise<CleanResult> {
  const result = await api<{
    rowCount: number;
    followOnRemoved: number;
    classificationsRestored: number;
    classified: ClassifiedRow[];
    newCount: number;
    duplicateCount: number;
    conflictCount: number;
  }>('/ingest/preview', {
    method: 'POST',
    body: JSON.stringify({ rows: toServerRows(parsed) }),
  });
  return {
    rows: result.classified.map((c) => c.row),
    followOnRemoved: result.followOnRemoved,
    classificationsRestored: result.classificationsRestored,
    classified: result.classified,
    newCount: result.newCount,
    duplicateCount: result.duplicateCount,
    conflictCount: result.conflictCount,
    parsed,
  };
}

export type FileDuplicateCheck = { isDuplicate: boolean; existing: UploadFile | null };

export async function checkFileDuplicate(fileHash: string): Promise<FileDuplicateCheck> {
  return api<FileDuplicateCheck>(`/upload-files/check?hash=${encodeURIComponent(fileHash)}`);
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
  _userId: string | null,
  options: CommitOptions = { acceptConflicts: true }
): Promise<CommitResult> {
  return api<CommitResult>('/ingest/commit', {
    method: 'POST',
    body: JSON.stringify({
      rows: toServerRows(cleaned.parsed),
      filename: file.name,
      byteSize: file.size,
      fileHash: file.hash,
      acceptConflicts: options.acceptConflicts,
    }),
  });
}
