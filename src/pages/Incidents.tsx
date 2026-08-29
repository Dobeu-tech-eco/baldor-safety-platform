import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PageBanner from '../components/PageBanner';
import FamilyType from '../charts/families/FamilyType';
import FamilyYoyMonthly from '../charts/families/FamilyYoyMonthly';
import FamilyYoyMatrix from '../charts/families/FamilyYoyMatrix';
import { fetchIncidents } from '../lib/queries';
import { classifyAccidentType, preventabilityClass } from '../lib/classify';
import { BRANCH_ORDER } from '../lib/branches';
import { ytd } from '../lib/dates';
import { Incident } from '../lib/supabase';

export default function Incidents() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const range = useMemo(() => ytd(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIncidents({});
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load incidents');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    if (branch && r.branch !== branch) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    const type = classifyAccidentType(r.event_description).toLowerCase();
    return (
      r.occurrence_number?.toLowerCase().includes(s) ||
      r.claim_number?.toLowerCase().includes(s) ||
      r.branch?.toLowerCase().includes(s) ||
      type.includes(s) ||
      (r.event_description ?? '').toLowerCase().includes(s)
    );
  });

  function prevLabel(r: Incident): string {
    const c = preventabilityClass(r, false);
    if (c === 'preventable') return 'Yes';
    if (c === 'nonpreventable') return 'No';
    return 'Pending';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
        <p className="text-sm text-gray-500 mt-1">Filterable auto/injury records with type and preventability charts</p>
      </div>

      {error && <PageBanner kind="error" text={error} />}
      {!error && !loading && rows.length === 0 && (
        <PageBanner kind="empty" text="No incidents loaded. Upload an Origami export to begin." to="/upload" />
      )}

      {!error && rows.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search occurrence, claim #, type, description…"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006838]"
              />
            </div>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All branches</option>
              {BRANCH_ORDER.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-600">
                    <th className="px-3 py-2">Occurrence</th>
                    <th className="px-3 py-2">Branch</th>
                    <th className="px-3 py-2">Loss date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Preventable</th>
                    <th className="px-3 py-2">Claim #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((r) => (
                    <tr key={r.id} className={r.is_injury ? 'bg-blue-50/40' : 'hover:bg-gray-50'}>
                      <td className="px-3 py-2 font-mono text-xs">{r.occurrence_number}</td>
                      <td className="px-3 py-2">{r.branch}</td>
                      <td className="px-3 py-2">{r.loss_date ?? '—'}</td>
                      <td className="px-3 py-2">
                        {r.is_injury ? r.incident_type : classifyAccidentType(r.event_description)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          prevLabel(r) === 'Yes' ? 'bg-red-100 text-[#C0392B]' :
                          prevLabel(r) === 'No' ? 'bg-blue-100 text-[#1F4E79]' :
                          'bg-gray-100 text-gray-600'
                        }`}>{prevLabel(r)}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{r.claim_number || '—'}</td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">No matching incidents.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <FamilyType incidents={rows} range={range} branch="all" />
          <FamilyYoyMonthly incidents={rows} range={range} branch="all" />
          <FamilyYoyMatrix incidents={rows} range={range} branch="all" />
        </>
      )}
    </div>
  );
}
