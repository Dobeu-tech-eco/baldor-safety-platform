import { useCallback, useEffect, useMemo, useState } from 'react';
import PageBanner from '../components/PageBanner';
import { fetchIncidents } from '../lib/queries';
import { isAutoFamilyRow, preventabilityClass } from '../lib/classify';
import { Incident } from '../lib/supabase';

const NEW_HIRE_DAYS = 90;

export default function NewHire() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const { preventables, newHire, share } = useMemo(() => {
    const preventables = rows.filter(
      (i) => isAutoFamilyRow(i) && preventabilityClass(i, true) === 'preventable',
    );
    const newHire = preventables.filter(
      (i) => i.tenure_days !== null && i.tenure_days < NEW_HIRE_DAYS,
    );
    const share = preventables.length
      ? Math.round((newHire.length / preventables.length) * 1000) / 10
      : 0;
    return { preventables, newHire, share };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New-Hire</h1>
        <p className="text-sm text-gray-500 mt-1">
          Share of auto preventables with tenure under {NEW_HIRE_DAYS} days at loss date
        </p>
      </div>

      {error && <PageBanner kind="error" text={error} />}
      {!error && !loading && rows.length === 0 && (
        <PageBanner kind="empty" text="No incident data yet. Upload an Origami export to see new-hire share." to="/upload" />
      )}

      {!error && rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Auto preventables</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{preventables.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wider">New-hire (&lt;{NEW_HIRE_DAYS}d)</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{newHire.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wider">New-hire share</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{share}%</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">New-hire preventables</h2>
            </div>
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-600">
                    <th className="px-3 py-2">Occurrence</th>
                    <th className="px-3 py-2">Loss date</th>
                    <th className="px-3 py-2">Branch</th>
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Tenure (days)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {newHire.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{r.occurrence_number}</td>
                      <td className="px-3 py-2">{r.loss_date ?? '—'}</td>
                      <td className="px-3 py-2">{r.branch}</td>
                      <td className="px-3 py-2">{r.employee}</td>
                      <td className="px-3 py-2">{r.tenure_days}</td>
                    </tr>
                  ))}
                  {!newHire.length && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">No new-hire preventables in the current data.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
