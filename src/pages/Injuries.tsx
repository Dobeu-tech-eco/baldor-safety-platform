import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import PageBanner from '../components/PageBanner';
import { fetchIncidents } from '../lib/queries';
import { COLORS } from '../lib/colors';
import { Incident } from '../lib/supabase';

export default function Injuries() {
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
      setError(e instanceof Error ? e.message : 'Failed to load injuries');
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => all.filter((i) => i.is_injury), [all]);

  const byNature = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of rows) {
      const code = i.injury_type_code?.trim() || 'Unspecified';
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Injuries</h1>
        <p className="text-sm text-gray-500 mt-1">Injury-only rows and counts by injury type code</p>
      </div>

      {error && <PageBanner kind="error" text={error} />}
      {!error && !loading && all.length === 0 && (
        <PageBanner kind="empty" text="No incident data yet. Upload an Origami export that includes injuries." to="/upload" />
      )}
      {!error && !loading && all.length > 0 && rows.length === 0 && (
        <PageBanner kind="info" text="No injury records in the current dataset." />
      )}

      {!error && rows.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1">Injuries by nature</h2>
            <p className="text-xs text-gray-500 mb-4">{rows.length} injury records</p>
            <ResponsiveContainer width="100%" height={Math.max(200, byNature.length * 36)}>
              <BarChart data={byNature} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="code" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.injury} name="Injuries" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-600">
                    <th className="px-3 py-2">Occurrence</th>
                    <th className="px-3 py-2">Loss date</th>
                    <th className="px-3 py-2">Branch</th>
                    <th className="px-3 py-2">Injury type</th>
                    <th className="px-3 py-2">OSHA</th>
                    <th className="px-3 py-2">Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{r.occurrence_number}</td>
                      <td className="px-3 py-2">{r.loss_date ?? '—'}</td>
                      <td className="px-3 py-2">{r.branch}</td>
                      <td className="px-3 py-2">{r.injury_type_code || '—'}</td>
                      <td className="px-3 py-2">{r.osha_recordable || '—'}</td>
                      <td className="px-3 py-2">{r.employee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
