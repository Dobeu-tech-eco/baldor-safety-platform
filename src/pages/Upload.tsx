import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload as UploadIcon, FileCheck2, AlertCircle, CheckCircle2,
  GitMerge, FileText, Clock, ShieldAlert, RefreshCw, Files,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  parseWorkbook, cleanRows, commitIngest, computeFileHash, checkFileDuplicate,
  CleanResult,
} from '../lib/ingest';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { supabase, UploadFile, UploadBatch, DatasetMerge } from '../lib/supabase';

type Stage = 'idle' | 'parsing' | 'reviewing' | 'committing' | 'done';

type Notice = { kind: 'info' | 'success' | 'warning' | 'error'; text: string } | null;

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [cleaned, setCleaned] = useState<CleanResult | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [notice, setNotice] = useState<Notice>(null);
  const [acceptConflicts, setAcceptConflicts] = useState(true);
  const [duplicateFile, setDuplicateFile] = useState<UploadFile | null>(null);
  const [overrideDup, setOverrideDup] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [merges, setMerges] = useState<DatasetMerge[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

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
    setFile(null); setFileHash(null); setCleaned(null); setStage('idle');
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

      const parsed = parseWorkbook(buf);
      if (parsed.length === 0) {
        setNotice({ kind: 'error', text: 'No incident rows could be parsed from this file.' });
        setStage('idle');
        return;
      }
      const c = await cleanRows(parsed);
      setCleaned(c);
      setStage('reviewing');

      if (c.duplicateCount > 0 || c.conflictCount > 0) {
        setNotice({
          kind: 'info',
          text: `Overlap detected. ${c.newCount} new rows, ${c.duplicateCount} exact duplicates (will be skipped), ${c.conflictCount} conflicting rows (same occurrence, changed content).`,
        });
      } else {
        setNotice({ kind: 'success', text: `Parsed ${c.rows.length} rows. No overlap with existing data.` });
      }
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Parse failed' });
      setStage('idle');
    }
  }

  async function commit() {
    if (!cleaned || !file || !fileHash) return;
    if (duplicateFile && !overrideDup) {
      setNotice({ kind: 'warning', text: 'Confirm you want to re-merge this duplicate file before committing.' });
      return;
    }
    setStage('committing'); setNotice(null);
    try {
      const r = await commitIngest(
        cleaned,
        { name: file.name, size: file.size, hash: fileHash },
        user?.id ?? null,
        { acceptConflicts },
      );
      const msg = `Committed batch ${r.batchId.slice(0, 8)}. ${r.inserted} rows written, ${r.duplicatesSkipped} duplicates removed, ${r.uniqueRowsKept} unique rows kept.`;
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="t-eyebrow mb-1">Ingest</p>
          <h1 className="page-title">Upload incident export</h1>
          <p className="page-sub">XLSX or CSV. Duplicate files and overlapping rows are detected automatically.</p>
        </div>
        <button type="button" onClick={loadHistory} className="btn-secondary">
          <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
          {lastSync ? `Synced ${format(lastSync, 'p')}` : 'Sync'}
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`bg-cream-panel border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
          dragOver ? 'border-brand bg-lime/10' : 'border-hair hover:border-brand'
        }`}
      >
        <UploadIcon className="w-10 h-10 text-ink-muted mx-auto mb-3" />
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-primary">Choose file</button>
        <p className="text-xs text-ink-muted mt-3">
          {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Drag a file here or click to browse'}
        </p>
        {fileHash && (
          <p className="text-[10px] text-ink-muted mt-1 font-mono">SHA-256 {fileHash.slice(0, 16)}…</p>
        )}
      </div>

      {notice && <NoticeBanner notice={notice} />}

      {duplicateFile && stage === 'reviewing' && (
        <div className="bg-gold/10 border border-gold/40 rounded-md p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-true">Duplicate file detected</p>
            <p className="text-xs text-ink-muted mt-1">
              Identical content was uploaded as "{duplicateFile.filename}" on {format(new Date(duplicateFile.uploaded_at), 'PPp')}.
              Re-committing will be deduplicated row-by-row.
            </p>
            <label className="flex items-center gap-2 mt-2 text-xs text-ink-true">
              <input type="checkbox" checked={overrideDup} onChange={(e) => setOverrideDup(e.target.checked)} />
              I understand, proceed with merge anyway
            </label>
          </div>
        </div>
      )}

      {cleaned && stage === 'reviewing' && (
        <PreviewPanel
          cleaned={cleaned}
          acceptConflicts={acceptConflicts}
          setAcceptConflicts={setAcceptConflicts}
          committing={stage === 'committing'}
          onCommit={commit}
        />
      )}

      <HistoryPanel batches={batches} files={files} merges={merges} />
    </div>
  );
}

function NoticeBanner({ notice }: { notice: NonNullable<Notice> }) {
  const styles: Record<string, string> = {
    info: 'bg-sky/10 border-sky/40 text-navy',
    success: 'bg-brand/10 border-brand/30 text-brand-print',
    warning: 'bg-gold/10 border-gold/40 text-ink-true',
    error: 'bg-danger/10 border-danger/30 text-danger',
  };
  const Icon = notice.kind === 'success' ? CheckCircle2 : notice.kind === 'error' ? AlertCircle : notice.kind === 'warning' ? ShieldAlert : FileText;
  return (
    <div className={`border rounded-md p-3 text-sm flex items-start gap-2 ${styles[notice.kind]}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{notice.text}</span>
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
    <div className="card-surface">
      <div className="px-5 py-4 border-b border-hair bg-cream-panel">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="t-headline text-lg text-ink-true">Merge preview</h2>
            <p className="text-xs text-ink-muted mt-0.5">{cleaned.rows.length} rows parsed from upload</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" checked={acceptConflicts} onChange={(e) => setAcceptConflicts(e.target.checked)} />
              Overwrite conflicting rows ({cleaned.conflictCount})
            </label>
            <button type="button" onClick={onCommit} disabled={committing} className="btn-primary">
              <GitMerge className="w-4 h-4" />{committing ? 'Merging…' : 'Commit merge'}
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
          <thead className="bg-cream-panel sticky top-0">
            <tr className="text-left text-[10px] uppercase tracking-wider text-ink-muted">
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Occurrence</th>
              <th className="px-3 py-2">Branch</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Preventable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {cleaned.classified.slice(0, 300).map((c, i) => (
              <tr key={i} className={
                c.classification === 'exact-duplicate' ? 'bg-cream-panel' :
                c.classification === 'conflict' ? 'bg-gold/10' : ''
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
          <p className="text-[11px] text-ink-muted px-3 py-2 border-t border-hair">
            Showing first 300 of {cleaned.classified.length} rows.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ classification }: { classification: 'new' | 'exact-duplicate' | 'conflict' }) {
  const map = {
    'new': { label: 'New', cls: 'bg-brand/10 text-brand-print' },
    'exact-duplicate': { label: 'Duplicate', cls: 'bg-cream-panel text-ink-muted' },
    'conflict': { label: 'Conflict', cls: 'bg-gold/20 text-ink-true' },
  } as const;
  const m = map[classification];
  return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${m.cls}`}>{m.label}</span>;
}

function HistoryPanel({ batches, files, merges }: { batches: UploadBatch[]; files: UploadFile[]; merges: DatasetMerge[] }) {
  const fileByBatch = new Map(files.map((f) => [f.batch_id, f]));
  const mergeByBatch = new Map(merges.map((m) => [m.source_batch_id, m]));
  return (
    <div className="card-surface">
      <div className="card-header-bar">
        <div className="flex items-center gap-2">
          <Files className="w-4 h-4 text-ink-muted" />
          <h2 className="t-headline text-lg text-ink-true">Upload history</h2>
          <span className="text-xs text-ink-muted">({batches.length})</span>
        </div>
      </div>
      {batches.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-ink-muted">No uploads yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs data-table">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Uploaded</th>
                <th className="px-3 py-2 text-right">Rows</th>
                <th className="px-3 py-2 text-right">Follow-ons</th>
                <th className="px-3 py-2">Merge result</th>
                <th className="px-3 py-2">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {batches.map((b) => {
                const f = fileByBatch.get(b.id);
                const m = mergeByBatch.get(b.id);
                return (
                  <tr key={b.id}>
                    <td className="px-3 py-2 font-medium text-ink-true flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-ink-muted" />
                      {b.filename}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(b.uploaded_at), 'PP p')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{b.row_count}</td>
                    <td className="px-3 py-2 text-right font-mono">{b.follow_on_removed}</td>
                    <td className="px-3 py-2">
                      {m ? (
                        <span className="inline-flex items-center gap-1 text-ink-true bg-gold/10 border border-gold/40 rounded px-1.5 py-0.5">
                          <GitMerge className="w-3 h-3" />
                          {m.duplicate_rows_removed} dup removed · {m.new_rows_added} new
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-brand-print bg-brand/10 border border-brand/30 rounded px-1.5 py-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Clean
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-ink-muted text-[10px]">
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
    case 'green': return 'bg-brand/10 border-brand/30 text-brand-print';
    case 'amber': return 'bg-gold/10 border-gold/40 text-ink-true';
    default: return 'bg-cream-panel border-hair text-ink-muted';
  }
}
