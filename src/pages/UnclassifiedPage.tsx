import { useCallback, useEffect, useState } from 'react';
import PageBanner from '../components/PageBanner';
import { fetchIncidents } from '../lib/queries';
import { isAutoFamilyRow, preventabilityClass, classifyAccidentType } from '../lib/classify';
import { Incident } from '../lib/supabase';

export default function UnclassifiedPage() {
  const [all, setAll] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIncidents({});
      setAll(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load unclassified incidents');
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = all.filter(
    (i) => isAutoFamilyRow(i) && preventabilityClass(i, false) === 'pending',
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Unclassified</h1>
        <p className="text-sm text-gray-500 mt-1">Auto accidents awaiting Yes/No preventability</p>
      </div>

      {error && <PageBanner kind="error" text={error} />}
      {!error && !loading && all.length === 0 && (
        <PageBanner kind="empty" text="No incident data yet. Upload an Origami export to begin." to="/upload" />
      )}
      {!error && !loading && all.length > 0 && rows.length === 0 && (
        <PageBanner kind="info" text="All auto accidents have Yes/No preventability." />
      )}

      {!error && rows.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">{rows.length} pending</h2>
          </div>
          <div className="overflow-x-auto max-h-[560px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-600">
                  <th className="px-3 py-2">Occurrence</th>
                  <th className="px-3 py-2">Loss date</th>
                  <th className="px-3 py-2">Branch</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Employee</th>
                  <th className="px-3 py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{r.occurrence_number}</td>
                    <td className="px-3 py-2">{r.loss_date ?? '—'}</td>
                    <td className="px-3 py-2">{r.branch}</td>
                    <td className="px-3 py-2">{classifyAccidentType(r.event_description)}</td>
                    <td className="px-3 py-2">{r.employee}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-md truncate">{r.event_description}</td>
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
