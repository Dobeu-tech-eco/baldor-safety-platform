import { useState, useRef } from 'react';
import { Upload as UploadIcon, FileCheck2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseWorkbook, cleanRows, commitIngest, CleanResult } from '../lib/ingest';
import { useAuth } from '../lib/auth';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [cleaned, setCleaned] = useState<CleanResult | null>(null);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  async function handleFile(f: File) {
    setError(null); setResult(null); setFile(f);
    try {
      const buf = await f.arrayBuffer();
      const parsed = parseWorkbook(buf);
      const c = await cleanRows(parsed);
      setCleaned(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse failed');
    }
  }

  async function commit() {
    if (!cleaned || !file) return;
    setCommitting(true); setError(null);
    try {
      const r = await commitIngest(cleaned, file.name, user?.id ?? null);
      setResult(`Inserted/updated ${r.inserted} incidents (batch ${r.batchId.slice(0, 8)})`);
      setCleaned(null); setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Commit failed');
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload incident export</h1>
        <p className="text-sm text-gray-500 mt-1">XLSX or CSV from the carrier system</p>
      </div>

      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-[#006838] transition-colors">
        <UploadIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <button onClick={() => inputRef.current?.click()}
          className="px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d]">Choose file</button>
        <p className="text-xs text-gray-500 mt-3">{file?.name ?? 'No file selected'}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-[#C0392B] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
        </div>
      )}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-[#2E7D32] flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5" /><span>{result}</span>
        </div>
      )}

      {cleaned && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Preview</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {cleaned.rows.length} rows · {cleaned.followOnRemoved} follow-ons flagged · {cleaned.classificationsRestored} classifications restored
              </p>
            </div>
            <button onClick={commit} disabled={committing}
              className="flex items-center gap-2 px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d] disabled:opacity-50">
              <FileCheck2 className="w-4 h-4" />{committing ? 'Committing...' : 'Commit to database'}
            </button>
          </div>
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-600">
                  <th className="px-3 py-2">Occurrence</th><th className="px-3 py-2">Branch</th><th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Date</th><th className="px-3 py-2">Preventable</th><th className="px-3 py-2">Follow-on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cleaned.rows.slice(0, 200).map((r, i) => (
                  <tr key={i} className={r.is_followon ? 'bg-yellow-50' : ''}>
                    <td className="px-3 py-1.5 font-mono">{r.occurrence_number}</td>
                    <td className="px-3 py-1.5">{r.branch}</td>
                    <td className="px-3 py-1.5">{r.incident_type}</td>
                    <td className="px-3 py-1.5">{r.loss_date}</td>
                    <td className="px-3 py-1.5">{r.preventable}</td>
                    <td className="px-3 py-1.5">{r.is_followon ? 'Yes' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
