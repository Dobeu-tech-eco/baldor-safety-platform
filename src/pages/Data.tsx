import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase, Incident } from '../lib/supabase';

export default function Data() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [includeFollowons, setIncludeFollowons] = useState(false);

  async function load() {
    let q = supabase.from('incidents').select('*').order('loss_date', { ascending: false }).limit(500);
    if (!includeFollowons) q = q.eq('is_followon', false);
    if (branch) q = q.eq('branch', branch);
    const { data } = await q;
    setRows((data as Incident[]) || []);
  }

  useEffect(() => { load(); }, [branch, includeFollowons]);

  async function setPreventable(occ: string, val: string) {
    await supabase.from('overrides').upsert({ occurrence_number: occ, preventable: val, note: 'Manual override' }, { onConflict: 'occurrence_number' });
    await supabase.from('incidents').update({ preventable: val, updated_at: new Date().toISOString() }).eq('occurrence_number', occ);
    load();
  }

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.occurrence_number?.toLowerCase().includes(s) || r.employee?.toLowerCase().includes(s) || r.location?.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="t-eyebrow mb-1">Classifications</p>
        <h1 className="page-title">Data</h1>
        <p className="page-sub">Browse and edit preventability classifications</p>
      </div>

      <div className="card-surface p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <label htmlFor="data-search" className="sr-only">Search occurrence, employee, location</label>
          <Search className="absolute left-3 top-3 w-4 h-4 text-ink-muted" aria-hidden="true" />
          <input
            id="data-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search occurrence, employee, location..."
            className="field pl-9"
          />
        </div>
        <label htmlFor="data-branch" className="sr-only">Branch</label>
        <select id="data-branch" value={branch} onChange={(e) => setBranch(e.target.value)} className="field w-auto min-w-[140px]">
          <option value="">All branches</option>
          {['BNY', 'BMA', 'BPA', 'BDC'].map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-muted min-h-[44px]">
          <input type="checkbox" checked={includeFollowons} onChange={(e) => setIncludeFollowons(e.target.checked)} />
          Include follow-ons
        </label>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm data-table">
            <thead className="sticky top-0">
              <tr className="text-left">
                <th className="px-3 py-2">Occurrence</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Preventable</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {filtered.map((r) => (
                <tr key={r.id} className={r.is_followon ? 'bg-gold/10' : 'hover:bg-cream-panel'}>
                  <td className="px-3 py-2 font-mono text-xs">{r.occurrence_number}</td>
                  <td className="px-3 py-2">{r.loss_date}</td>
                  <td className="px-3 py-2">{r.branch}</td>
                  <td className="px-3 py-2">{r.incident_type}</td>
                  <td className="px-3 py-2">{r.employee}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.preventable === 'Yes' ? 'bg-danger/10 text-danger' :
                      r.preventable === 'No' ? 'bg-navy/10 text-navy' :
                      'bg-cream-panel text-ink-muted'
                    }`}>{r.preventable || 'Pending'}</span>
                  </td>
                  <td className="px-3 py-2">
                    {!r.is_injury && (
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setPreventable(r.occurrence_number, 'Yes')} className="text-xs px-2 min-h-[32px] border border-hair rounded-sm hover:bg-danger/10">Yes</button>
                        <button type="button" onClick={() => setPreventable(r.occurrence_number, 'No')} className="text-xs px-2 min-h-[32px] border border-hair rounded-sm hover:bg-navy/10">No</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-ink-muted">No incidents.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
