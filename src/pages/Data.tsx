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
        <h1 className="text-2xl font-bold text-gray-900">Data</h1>
        <p className="text-sm text-gray-500 mt-1">Browse and edit preventability classifications</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search occurrence, employee, location..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006838]" />
        </div>
        <select value={branch} onChange={(e) => setBranch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">All branches</option>
          {['BNY', 'BMA', 'BPA', 'BDC'].map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input type="checkbox" checked={includeFollowons} onChange={(e) => setIncludeFollowons(e.target.checked)} />
          Include follow-ons
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-600">
                <th className="px-3 py-2">Occurrence</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Type</th><th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Preventable</th><th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((r) => (
                <tr key={r.id} className={r.is_followon ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                  <td className="px-3 py-2 font-mono text-xs">{r.occurrence_number}</td>
                  <td className="px-3 py-2">{r.loss_date}</td>
                  <td className="px-3 py-2">{r.branch}</td>
                  <td className="px-3 py-2">{r.incident_type}</td>
                  <td className="px-3 py-2">{r.employee}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.preventable === 'Yes' ? 'bg-red-100 text-[#C0392B]' :
                      r.preventable === 'No' ? 'bg-blue-100 text-[#1F4E79]' :
                      'bg-gray-100 text-gray-600'
                    }`}>{r.preventable || 'Pending'}</span>
                  </td>
                  <td className="px-3 py-2">
                    {!r.is_injury && (
                      <div className="flex gap-1">
                        <button onClick={() => setPreventable(r.occurrence_number, 'Yes')} className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-red-50">Yes</button>
                        <button onClick={() => setPreventable(r.occurrence_number, 'No')} className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-blue-50">No</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">No incidents.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
