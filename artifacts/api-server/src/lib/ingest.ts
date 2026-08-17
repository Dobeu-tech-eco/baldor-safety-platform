import { createHash } from "node:crypto";
import {
  db,
  incidentsTable,
  overridesTable,
  uploadBatchesTable,
  uploadFilesTable,
  datasetMergesTable,
  type InsertIncident,
} from "@workspace/db";
import { sql } from "drizzle-orm";

/** Row as parsed from the workbook in the browser. */
export type ParsedRow = {
  occurrence_number?: string;
  record_id?: string;
  incident_type?: string;
  employee?: string;
  employee_number?: string;
  loss_date?: string | null;
  report_date?: string | null;
  location?: string;
  osha_recordable?: string;
  dot_recordable?: string;
  event_description?: string;
  status?: string;
  claim_number?: string;
  preventable?: string;
  injury_type_code?: string;
  tenure_years?: number | null;
  hire_date?: string | null;
  tier?: number | null;
};

export type CleanedRow = InsertIncident & { row_hash: string };
export type DuplicateClass = "new" | "exact-duplicate" | "conflict";
export type ClassifiedRow = {
  row: CleanedRow;
  classification: DuplicateClass;
  existingHash?: string;
};
export type CleanResult = {
  rows: CleanedRow[];
  followOnRemoved: number;
  classificationsRestored: number;
  classified: ClassifiedRow[];
  newCount: number;
  duplicateCount: number;
  conflictCount: number;
};

function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function rowFingerprint(r: Partial<CleanedRow>): string {
  return [
    r.occurrence_number ?? "",
    r.loss_date ?? "",
    (r.employee ?? "").toLowerCase().trim(),
    (r.branch ?? "").toLowerCase().trim(),
    (r.incident_type ?? "").toLowerCase().trim(),
    (r.preventable ?? "").toLowerCase().trim(),
  ].join("|");
}

/** Derive branch from the first 3 chars of Location, uppercased. */
const KNOWN_BRANCHES = new Set(["BNY", "BMA", "BPA", "BDC", "BFS"]);
function deriveBranch(location: string): string {
  const code = String(location ?? "").trim().slice(0, 3).toUpperCase();
  return KNOWN_BRANCHES.has(code) ? code : code || "BFS";
}

/**
 * Server-side port of the ingestion pipeline: follow-on dedup, classification
 * restore, override application, tenure computation, and duplicate
 * classification against previously stored rows.
 */
export async function cleanRows(parsed: ParsedRow[]): Promise<CleanResult> {
  const prior = await db
    .select({
      occurrence_number: incidentsTable.occurrence_number,
      preventable: incidentsTable.preventable,
      row_hash: incidentsTable.row_hash,
    })
    .from(incidentsTable);
  const priorMap = new Map<string, string>();
  const existingHashByOcc = new Map<string, string>();
  for (const r of prior) {
    if (r.preventable === "Yes" || r.preventable === "No")
      priorMap.set(r.occurrence_number, r.preventable);
    if (r.row_hash) existingHashByOcc.set(r.occurrence_number, r.row_hash);
  }

  const overrides = await db.select().from(overridesTable);
  const overrideMap = new Map(
    overrides.map((o) => [o.occurrence_number, o.preventable]),
  );

  const enriched: CleanedRow[] = [];
  for (const p of parsed) {
    let occ = String(p.occurrence_number ?? "").trim();
    const recordId = String(p.record_id ?? "").trim();
    if (!occ && recordId) occ = recordId.replace(/-\d+$/, "");
    if (!occ) continue;
    const m = recordId.match(/^(.+?)-(\d+)$/);
    const baseOccurrence = m ? m[1]! : recordId;
    const suffix = m ? parseInt(m[2]!, 10) : null;
    const incidentType = String(p.incident_type ?? "");
    const loss = p.loss_date ? new Date(p.loss_date) : null;
    const hire = p.hire_date ? new Date(p.hire_date) : null;
    let tenureDays: number | null = null;
    if (loss && hire && !isNaN(loss.getTime()) && !isNaN(hire.getTime()))
      tenureDays = Math.floor((loss.getTime() - hire.getTime()) / 86400000);
    enriched.push({
      occurrence_number: occ,
      record_id: recordId,
      base_occurrence: baseOccurrence,
      suffix,
      is_followon: false,
      incident_type: incidentType,
      employee: String(p.employee ?? ""),
      employee_number: String(p.employee_number ?? ""),
      loss_date: p.loss_date ?? null,
      report_date: p.report_date ?? null,
      location: String(p.location ?? ""),
      branch: deriveBranch(String(p.location ?? "")),
      osha_recordable: String(p.osha_recordable ?? ""),
      dot_recordable: String(p.dot_recordable ?? ""),
      event_description: String(p.event_description ?? ""),
      status: String(p.status ?? ""),
      claim_number: String(p.claim_number ?? ""),
      preventable: String(p.preventable ?? "").trim(),
      injury_type_code: String(p.injury_type_code ?? ""),
      tenure_years: p.tenure_years ?? null,
      hire_date: p.hire_date ?? null,
      tenure_days: tenureDays,
      tier: p.tier ?? null,
      is_injury: /injured/i.test(incidentType),
      row_hash: "",
    });
  }

  // Follow-on dedup: group by base occurrence, keep the clean/lowest-suffix row.
  const groups = new Map<string, CleanedRow[]>();
  for (const row of enriched) {
    const key = row.base_occurrence || row.occurrence_number;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  let followOnRemoved = 0;
  groups.forEach((rows) => {
    if (rows.length === 1) return;
    const clean = rows.find((r) => r.suffix == null);
    const keeper =
      clean ??
      rows.reduce((a, b) => ((a.suffix ?? 0) <= (b.suffix ?? 0) ? a : b));
    for (const r of rows) {
      if (r !== keeper) {
        r.is_followon = true;
        followOnRemoved++;
      }
    }
  });

  // Classification restore + overrides.
  let classificationsRestored = 0;
  for (const row of enriched) {
    const incoming = row.preventable;
    if (!incoming || (incoming !== "Yes" && incoming !== "No")) {
      const priorVal = priorMap.get(row.occurrence_number);
      if (priorVal) {
        row.preventable = priorVal;
        classificationsRestored++;
      }
    }
    const ov = overrideMap.get(row.occurrence_number);
    if (ov) row.preventable = ov;
  }

  for (const row of enriched) row.row_hash = sha256Hex(rowFingerprint(row));

  const classified: ClassifiedRow[] = enriched.map((row) => {
    const existing = existingHashByOcc.get(row.occurrence_number);
    if (!existing) return { row, classification: "new" };
    if (existing === row.row_hash)
      return { row, classification: "exact-duplicate", existingHash: existing };
    return { row, classification: "conflict", existingHash: existing };
  });

  return {
    rows: enriched,
    followOnRemoved,
    classificationsRestored,
    classified,
    newCount: classified.filter((c) => c.classification === "new").length,
    duplicateCount: classified.filter(
      (c) => c.classification === "exact-duplicate",
    ).length,
    conflictCount: classified.filter((c) => c.classification === "conflict")
      .length,
  };
}

export type CommitResult = {
  batchId: string;
  inserted: number;
  duplicatesSkipped: number;
  conflictsResolved: number;
  uniqueRowsKept: number;
  followOnRemoved: number;
  classificationsRestored: number;
  newCount: number;
};

export async function commitIngest(
  cleaned: CleanResult,
  file: { name: string; size: number; hash: string },
  userId: string | null,
  acceptConflicts: boolean,
): Promise<CommitResult> {
  const [batch] = await db
    .insert(uploadBatchesTable)
    .values({
      filename: file.name,
      uploaded_by: userId,
      row_count: cleaned.rows.length,
      follow_on_removed: cleaned.followOnRemoved,
      classifications_restored: cleaned.classificationsRestored,
    })
    .returning();
  if (!batch) throw new Error("Failed to create upload batch");

  const candidates = cleaned.classified.filter((c) => {
    if (c.classification === "exact-duplicate") return false;
    if (c.classification === "conflict" && !acceptConflicts) return false;
    return true;
  });

  // A single upsert statement cannot touch the same occurrence twice
  // (follow-on rows share the base occurrence number) — keep one row per
  // occurrence, preferring the non-follow-on keeper.
  const byOcc = new Map<string, (typeof candidates)[number]>();
  for (const c of candidates) {
    const key = c.row.occurrence_number;
    const prev = byOcc.get(key);
    if (!prev || (prev.row.is_followon && !c.row.is_followon)) byOcc.set(key, c);
  }
  const toWrite = [...byOcc.values()];

  let inserted = 0;
  const chunkSize = 200;
  for (let i = 0; i < toWrite.length; i += chunkSize) {
    const chunk = toWrite.slice(i, i + chunkSize).map((c) => ({
      ...c.row,
      upload_batch_id: batch.id,
    }));
    if (!chunk.length) continue;
    await db
      .insert(incidentsTable)
      .values(chunk)
      .onConflictDoUpdate({
        target: incidentsTable.occurrence_number,
        set: {
          record_id: sql`excluded.record_id`,
          base_occurrence: sql`excluded.base_occurrence`,
          suffix: sql`excluded.suffix`,
          is_followon: sql`excluded.is_followon`,
          incident_type: sql`excluded.incident_type`,
          employee: sql`excluded.employee`,
          employee_number: sql`excluded.employee_number`,
          loss_date: sql`excluded.loss_date`,
          report_date: sql`excluded.report_date`,
          location: sql`excluded.location`,
          branch: sql`excluded.branch`,
          osha_recordable: sql`excluded.osha_recordable`,
          dot_recordable: sql`excluded.dot_recordable`,
          event_description: sql`excluded.event_description`,
          status: sql`excluded.status`,
          claim_number: sql`excluded.claim_number`,
          preventable: sql`excluded.preventable`,
          injury_type_code: sql`excluded.injury_type_code`,
          tenure_years: sql`excluded.tenure_years`,
          hire_date: sql`excluded.hire_date`,
          tenure_days: sql`excluded.tenure_days`,
          tier: sql`excluded.tier`,
          is_injury: sql`excluded.is_injury`,
          row_hash: sql`excluded.row_hash`,
          upload_batch_id: sql`excluded.upload_batch_id`,
          updated_at: sql`now()`,
        },
      });
    inserted += chunk.length;
  }

  await db
    .insert(uploadFilesTable)
    .values({
      file_hash: file.hash,
      filename: file.name,
      byte_size: file.size,
      row_count: cleaned.rows.length,
      row_hashes: cleaned.rows.map((r) => r.row_hash),
      uploaded_by: userId,
      batch_id: batch.id,
    })
    .onConflictDoUpdate({
      target: uploadFilesTable.file_hash,
      set: {
        filename: file.name,
        uploaded_by: userId,
        batch_id: batch.id,
        uploaded_at: sql`now()`,
      },
    });

  const duplicatesSkipped = cleaned.duplicateCount;
  const conflictsResolved = acceptConflicts ? cleaned.conflictCount : 0;
  const uniqueRowsKept = cleaned.newCount + conflictsResolved;

  if (duplicatesSkipped > 0 || conflictsResolved > 0) {
    await db.insert(datasetMergesTable).values({
      source_batch_id: batch.id,
      target_batch_id: null,
      duplicate_rows_removed: duplicatesSkipped,
      unique_rows_kept: uniqueRowsKept,
      new_rows_added: cleaned.newCount,
      performed_by: userId,
      note: `Merged ${file.name}`,
    });
  }

  return {
    batchId: batch.id,
    inserted,
    duplicatesSkipped,
    conflictsResolved,
    uniqueRowsKept,
    followOnRemoved: cleaned.followOnRemoved,
    classificationsRestored: cleaned.classificationsRestored,
    newCount: cleaned.newCount,
  };
}
