import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload as UploadIcon, AlertCircle, CheckCircle2,
  GitMerge, FileText, Clock, ShieldAlert, RefreshCw, Files,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  parseWorkbook, cleanRows, commitIngest, computeFileHash, checkFileDuplicate,
  CleanResult,
} from '../lib/ingest';
import {
  UNRECOGNIZED_MESSAGE,
  readFirstSheetHeaders,
  parseSamsaraWorkbook,
  parseMilesWorkbook,
  commitSamsara,
  commitMiles,
  milesRowsToUpserts,
  ParsedSamsaraRow,
  ParsedMilesRow,
} from '../lib/ingestSources';
import { detectSource, SourceKind } from '../lib/detectSource';
import { mapTagToBranch, DEFAULT_TAG_MAPS, TagBranchMap } from '../lib/tagMap';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { supabase, UploadFile, UploadBatch, DatasetMerge, TagBranchMapRow } from '../lib/supabase';

type Stage = 'idle' | 'parsing' | 'reviewing' | 'committing' | 'done';

type Notice = { kind: 'info' | 'success' | 'warning' | 'error'; text: string } | null;

type SourcePreview =
  | { kind: 'incidents'; cleaned: CleanResult }
  | { kind: 'samsara'; rows: ParsedSamsaraRow[]; unmappedTags: string[] }
  | { kind: 'mileage'; rows: ParsedMilesRow[]; upsertCount: number; unmappedTags: string[] };

async function loadTagMaps(): Promise<TagBranchMap[]> {
  const { data } = await supabase.from('tag_branch_maps').select('tag_pattern, branch');
  const rows = (data as Pick<TagBranchMapRow, 'tag_pattern' | 'branch'>[] | null) ?? [];
  if (!rows.length) return DEFAULT_TAG_MAPS;
  return rows.map((r) => ({ tag_pattern: r.tag_pattern, branch: r.branch }));
}

function collectUnmappedTags(tags: string[], maps: TagBranchMap[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    if (mapTagToBranch(tag, maps)) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [preview, setPreview] = useState<SourcePreview | null>(null);
  const [sourceKind, setSourceKind] = useState<SourceKind | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [notice, setNotice] = useState<Notice>(null);
  const [acceptConflicts, setAcceptConflicts] = useState(true);
  const [duplicateFile, setDuplicateFile] = useState<UploadFile | null>(null);
  const [overrideDup, setOverrideDup] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tagMaps, setTagMaps] = useState<TagBranchMap[]>(DEFAULT_TAG_MAPS);

  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [merges, setMerges] = useState<DatasetMerge[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const isCommitting = stage === 'committing';

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const [b, f, m] = await Promise.all([
      supabase.from('upload_batches').select('*').order('uploaded_at', { ascending: false }).limit(50),
      supabase.from('upload_files').select('*').order('uploaded_at', { ascending: false }).limit(50),
      supabase.from('dataset_merges').select('*').order('performed_at', { ascending: false }).limit(50),
    ]);
    setBatches((b.data as UploadBatch[]) ?? []);
    setFiles((f.data as UploadFile[]) ?? []);
    setMerges((m.data as DatasetMerge[]) ?? []);
    setLastSync(new Date());
    setHistoryLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  function reset() {
    setFile(null); setFileHash(null); setPreview(null); setSourceKind(null); setStage('idle');
    setDuplicateFile(null); setOverrideDup(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleFile(f: File) {
    reset();
    setFile(f); setStage('parsing'); setNotice(null);
    try {
      const buf = await f.arrayBuffer();
      const hash = await computeFileHash(buf);
      setFileHash(hash);

      const dup = await checkFileDuplicate(hash);
      if (dup.isDuplicate && dup.existing) {
        setDuplicateFile(dup.existing);
        setNotice({
          kind: 'warning',
          text: `This exact file was already uploaded on ${format(new Date(dup.existing.uploaded_at), 'PPp')} as "${dup.existing.filename}". You can still continue if you want to merge it again.`,
        });
      }

      const headers = readFirstSheetHeaders(buf);
      const detected = detectSource(headers);
      setSourceKind(detected);

      if (detected === 'unrecognized') {
        setNotice({ kind: 'error', text: UNRECOGNIZED_MESSAGE });
        setStage('idle');
        return;
      }

      if (detected === 'incidents') {
        const parsed = parseWorkbook(buf);
        if (parsed.length === 0) {
          setNotice({ kind: 'error', text: 'No incident rows could be parsed from this file.' });
          setStage('idle');
          return;
        }
        const c = await cleanRows(parsed);
        setPreview({ kind: 'incidents', cleaned: c });
        setStage('reviewing');
        if (c.duplicateCount > 0 || c.conflictCount > 0) {
          setNotice({
            kind: 'info',
            text: `Overlap detected. ${c.newCount} new rows, ${c.duplicateCount} exact duplicates (will be skipped), ${c.conflictCount} conflicting rows (same occurrence, changed content).`,
          });
        } else {
          setNotice({ kind: 'success', text: `Parsed ${c.rows.length} incident rows. No overlap with existing data.` });
        }
        return;
      }

      const maps = await loadTagMaps();
      setTagMaps(maps);

      if (detected === 'samsara') {
        const rows = parseSamsaraWorkbook(buf);
        if (rows.length === 0) {
          setNotice({ kind: 'error', text: 'No Samsara rows could be parsed from this file.' });
          setStage('idle');
          return;
        }
        const unmappedTags = collectUnmappedTags(rows.map((r) => r.tag), maps);
        setPreview({ kind: 'samsara', rows, unmappedTags });
        setStage('reviewing');
        setNotice({
          kind: unmappedTags.length ? 'warning' : 'success',
          text: `Parsed ${rows.length} Samsara tag rows.${unmappedTags.length ? ` ${unmappedTags.length} tag(s) have no branch map.` : ''}`,
        });
        return;
      }

      const rows = parseMilesWorkbook(buf);
      if (rows.length === 0) {
        setNotice({ kind: 'error', text: 'No mileage rows could be parsed from this file.' });
        setStage('idle');
        return;
      }
      const { upserts, unmappedCount } = milesRowsToUpserts(rows, maps);
      const unmappedTags = collectUnmappedTags(rows.map((r) => r.tag), maps);
      setPreview({ kind: 'mileage', rows, upsertCount: upserts.length, unmappedTags });
      setStage('reviewing');
      setNotice({
        kind: unmappedCount ? 'warning' : 'success',
        text: `Parsed ${rows.length} mileage rows → ${upserts.length} branch/month upserts.${unmappedCount ? ` ${unmappedCount} row(s) unmapped.` : ''}`,
      });
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Parse failed' });
      setStage('idle');
    }
  }

  async function commit() {
    if (!preview || !file || !fileHash) return;
    if (duplicateFile && !overrideDup) {
      setNotice({ kind: 'warning', text: 'Confirm you want to re-merge this duplicate file before committing.' });
      return;
    }
    setStage('committing'); setNotice(null);
    try {
      let msg = '';
      switch (preview.kind) {
        case 'incidents': {
          const r = await commitIngest(
            preview.cleaned,
            { name: file.name, size: file.size, hash: fileHash },
            user?.id ?? null,
            { acceptConflicts },
          );
          msg = `Committed batch ${r.batchId.slice(0, 8)}. ${r.inserted} rows written, ${r.duplicatesSkipped} duplicates removed, ${r.uniqueRowsKept} unique rows kept.`;
          break;
        }
        case 'samsara': {
          const r = await commitSamsara(
            preview.rows,
            { name: file.name, size: file.size },
            user?.id ?? null,
          );
          msg = `Committed Samsara batch ${r.batchId.slice(0, 8)}. ${r.inserted} tag summaries written.`;
          break;
        }
        case 'mileage': {
          const r = await commitMiles(
            preview.rows,
            { name: file.name, size: file.size },
            user?.id ?? null,
            tagMaps,
          );
          msg = `Committed mileage batch ${r.batchId.slice(0, 8)}. ${r.inserted} branch/month rows written${r.unmappedCount ? `, ${r.unmappedCount} unmapped skipped` : ''}.`;
          break;
        }
        default: {
          const _exhaustive: never = preview;
          void _exhaustive;
          throw new Error('Unknown preview kind');
        }
      }
      setNotice({ kind: 'success', text: msg });
      toast('success', msg);
      setStage('done');
      await loadHistory();
      setTimeout(reset, 200);
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Commit failed' });
      setStage('reviewing');
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload</h1>
          <p className="text-sm text-gray-500 mt-1">
            XLSX or CSV. Detects incidents, Samsara driver safety, or jurisdiction miles by columns.
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
          {lastSync ? `Synced ${format(lastSync, 'p')}` : 'Sync'}
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`bg-white border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
          dragOver ? 'border-[#006838] bg-green-50' : 'border-gray-300 hover:border-[#006838]'
        }`}
      >
        <UploadIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <button onClick={() => inputRef.current?.click()}
          className="px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d]">Choose file</button>
        <p className="text-xs text-gray-500 mt-3">
          {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Drag a file here or click to browse'}
        </p>
        {fileHash && (
          <p className="text-[10px] text-gray-400 mt-1 font-mono">SHA-256 {fileHash.slice(0, 16)}…</p>
        )}
        {sourceKind && sourceKind !== 'unrecognized' && (
          <p className="text-xs text-gray-600 mt-2">Detected source: <span className="font-medium">{sourceKind}</span></p>
        )}
      </div>

      {notice && <NoticeBanner notice={notice} />}

      {duplicateFile && stage === 'reviewing' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Duplicate file detected</p>
            <p className="text-xs text-amber-800 mt-1">
              Identical content was uploaded as "{duplicateFile.filename}" on {format(new Date(duplicateFile.uploaded_at), 'PPp')}.
              Re-committing will be deduplicated row-by-row.
            </p>
            <label className="flex items-center gap-2 mt-2 text-xs text-amber-900">
              <input type="checkbox" checked={overrideDup} onChange={(e) => setOverrideDup(e.target.checked)} />
              I understand, proceed with merge anyway
            </label>
          </div>
        </div>
      )}

      {preview?.kind === 'incidents' && (stage === 'reviewing' || stage === 'committing') && (
        <PreviewPanel
          cleaned={preview.cleaned}
          acceptConflicts={acceptConflicts}
          setAcceptConflicts={setAcceptConflicts}
          committing={isCommitting}
          onCommit={commit}
        />
      )}

      {preview && preview.kind !== 'incidents' && (stage === 'reviewing' || stage === 'committing') && (
        <SourcePreviewPanel preview={preview} committing={isCommitting} onCommit={commit} />
      )}

      <HistoryPanel batches={batches} files={files} merges={merges} />
    </div>
  );
}

function NoticeBanner({ notice }: { notice: NonNullable<Notice> }) {
  const styles: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-[#2E7D32]',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-[#C0392B]',
  };
  const Icon = notice.kind === 'success' ? CheckCircle2 : notice.kind === 'error' ? AlertCircle : notice.kind === 'warning' ? ShieldAlert : FileText;
  return (
    <div className={`border rounded-md p-3 text-sm flex items-start gap-2 ${styles[notice.kind]}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{notice.text}</span>
    </div>
  );
}

function SourcePreviewPanel({
  preview, committing, onCommit,
}: {
  preview: Exclude<SourcePreview, { kind: 'incidents' }>;
  committing: boolean;
  onCommit: () => void;
}) {
  const title = preview.kind === 'samsara' ? 'Samsara preview' : 'Mileage preview';
  const rowCount = preview.rows.length;
  const unmapped = preview.unmappedTags;
  const upsertNote = preview.kind === 'mileage' ? ` · ${preview.upsertCount} upserts` : '';
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{rowCount} rows parsed{upsertNote}</p>
          </div>
          <button onClick={onCommit} disabled={committing}
            className="flex items-center gap-2 px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d] disabled:opacity-50">
            <GitMerge className="w-4 h-4" />{committing ? 'Merging...' : 'Commit'}
          </button>
        </div>
      </div>
      {unmapped.length > 0 && (
        <div className="px-5 py-3 border-b border-amber-100 bg-amber-50 text-xs text-amber-900">
          Unmapped tags ({unmapped.length}): {unmapped.slice(0, 20).join(', ')}
          {unmapped.length > 20 ? '…' : ''}
          {preview.kind === 'mileage' ? ' — these rows will be skipped.' : ' — map them under Settings → Branch tag maps for charts.'}
        </div>
      )}
      <div className="overflow-x-auto max-h-[320px]">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-600">
              <th className="px-3 py-2">Tag</th>
              {preview.kind === 'samsara' ? (
                <>
                  <th className="px-3 py-2 text-right">Mobile</th>
                  <th className="px-3 py-2 text-right">Inattentive</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2 text-right">Year</th>
                  <th className="px-3 py-2 text-right">Month</th>
                  <th className="px-3 py-2 text-right">Miles</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {preview.kind === 'samsara'
              ? preview.rows.slice(0, 100).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-medium">{r.tag}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.mobile_usage}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.inattentive_driving}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.safety_score ?? '—'}</td>
                  </tr>
                ))
              : preview.rows.slice(0, 100).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-medium">{r.tag}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.year}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.month}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{r.miles.toFixed(1)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewPanel({
  cleaned, acceptConflicts, setAcceptConflicts, committing, onCommit,
}: {
  cleaned: CleanResult;
  acceptConflicts: boolean;
  setAcceptConflicts: (b: boolean) => void;
  committing: boolean;
  onCommit: () => void;
}) {
  const stats = [
    { label: 'New', value: cleaned.newCount, tone: 'green' },
    { label: 'Exact duplicates', value: cleaned.duplicateCount, tone: 'gray' },
    { label: 'Conflicts', value: cleaned.conflictCount, tone: 'amber' },
    { label: 'Follow-ons flagged', value: cleaned.followOnRemoved, tone: 'gray' },
    { label: 'Classifications restored', value: cleaned.classificationsRestored, tone: 'gray' },
  ];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-900">Merge preview</h2>
            <p className="text-xs text-gray-500 mt-0.5">{cleaned.rows.length} rows parsed from upload</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" checked={acceptConflicts} onChange={(e) => setAcceptConflicts(e.target.checked)} />
              Overwrite conflicting rows ({cleaned.conflictCount})
            </label>
            <button onClick={onCommit} disabled={committing}
              className="flex items-center gap-2 px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d] disabled:opacity-50">
              <GitMerge className="w-4 h-4" />{committing ? 'Merging...' : 'Commit merge'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-md border px-3 py-2 ${toneClass(s.tone)}`}>
              <div className="text-[10px] uppercase tracking-wider opacity-70">{s.label}</div>
              <div className="text-lg font-bold mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto max-h-[480px]">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-600">
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Occurrence</th>
              <th className="px-3 py-2">Branch</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Preventable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cleaned.classified.slice(0, 300).map((c, i) => (
              <tr key={i} className={
                c.classification === 'exact-duplicate' ? 'bg-gray-50' :
                c.classification === 'conflict' ? 'bg-amber-50' : ''
              }>
                <td className="px-3 py-1.5"><StatusBadge classification={c.classification} /></td>
                <td className="px-3 py-1.5 font-mono">{c.row.occurrence_number}</td>
                <td className="px-3 py-1.5">{c.row.branch}</td>
                <td className="px-3 py-1.5">{c.row.incident_type}</td>
                <td className="px-3 py-1.5">{c.row.loss_date}</td>
                <td className="px-3 py-1.5">{c.row.preventable}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {cleaned.classified.length > 300 && (
          <p className="text-[11px] text-gray-500 px-3 py-2 border-t border-gray-200">
            Showing first 300 of {cleaned.classified.length} rows.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ classification }: { classification: 'new' | 'exact-duplicate' | 'conflict' }) {
  const map = {
    'new': { label: 'New', cls: 'bg-green-100 text-[#2E7D32]' },
    'exact-duplicate': { label: 'Duplicate', cls: 'bg-gray-200 text-gray-700' },
    'conflict': { label: 'Conflict', cls: 'bg-amber-100 text-amber-900' },
  } as const;
  const m = map[classification];
  return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${m.cls}`}>{m.label}</span>;
}

function HistoryPanel({ batches, files, merges }: { batches: UploadBatch[]; files: UploadFile[]; merges: DatasetMerge[] }) {
  const fileByBatch = new Map(files.map((f) => [f.batch_id, f]));
  const mergeByBatch = new Map(merges.map((m) => [m.source_batch_id, m]));
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <Files className="w-4 h-4 text-gray-500" />
        <h2 className="font-semibold text-gray-900">Upload history</h2>
        <span className="text-xs text-gray-500">({batches.length})</span>
      </div>
      {batches.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-500">No uploads yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-600">
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Uploaded</th>
                <th className="px-3 py-2 text-right">Rows</th>
                <th className="px-3 py-2 text-right">Follow-ons</th>
                <th className="px-3 py-2">Merge result</th>
                <th className="px-3 py-2">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {batches.map((b) => {
                const f = fileByBatch.get(b.id);
                const m = mergeByBatch.get(b.id);
                return (
                  <tr key={b.id}>
                    <td className="px-3 py-2 font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      {b.filename}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                        {b.source_kind ?? 'incidents'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(b.uploaded_at), 'PP p')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{b.row_count}</td>
                    <td className="px-3 py-2 text-right font-mono">{b.follow_on_removed}</td>
                    <td className="px-3 py-2">
                      {m ? (
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          <GitMerge className="w-3 h-3" />
                          {m.duplicate_rows_removed} dup removed · {m.new_rows_added} new
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#2E7D32] bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Clean
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-400 text-[10px]">
                      {f?.file_hash.slice(0, 12) ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function toneClass(tone: string): string {
  switch (tone) {
    case 'green': return 'bg-green-50 border-green-200 text-[#2E7D32]';
    case 'amber': return 'bg-amber-50 border-amber-200 text-amber-900';
    default: return 'bg-gray-50 border-gray-200 text-gray-700';
  }
}
