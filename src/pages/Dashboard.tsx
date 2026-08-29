import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Truck, ShieldAlert, HeartPulse, Percent } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import PageBanner from '../components/PageBanner';
import FamilyType from '../charts/families/FamilyType';
import FamilyApmm from '../charts/families/FamilyApmm';
import { fetchIncidents } from '../lib/queries';
import { preventabilityClass } from '../lib/classify';
import { ytd } from '../lib/dates';
import { inRange } from '../lib/isoDate';
import { COLORS } from '../lib/colors';
import { Incident, Mileage, supabase } from '../lib/supabase';

const QUICK_LINKS: { to: string; label: string }[] = [
  { to: '/apmm', label: 'APMM' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/injuries', label: 'Injuries' },
  { to: '/new-hire', label: 'New-Hire' },
  { to: '/distracted', label: 'Distracted' },
  { to: '/dot', label: 'DOT' },
  { to: '/unclassified', label: 'Unclassified' },
  { to: '/mileage', label: 'Mileage' },
  { to: '/claims', label: 'Claims' },
  { to: '/methodology', label: 'Methodology' },
];

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [mileage, setMileage] = useState<Mileage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const range = useMemo(() => ytd(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inc, ml] = await Promise.all([
        fetchIncidents({}),
        supabase.from('mileage').select('*'),
      ]);
      if (ml.error) throw new Error(ml.error.message);
      setIncidents(inc);
      setMileage((ml.data as Mileage[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data');
      setIncidents([]);
      setMileage([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ytdRows = incidents.filter((i) => inRange(i.loss_date, range.from, range.to));
  const autoYtd = ytdRows.filter((i) => !i.is_injury);
  const injuriesYtd = ytdRows.filter((i) => i.is_injury);
  const preventable = autoYtd.filter((i) => preventabilityClass(i, true) === 'preventable').length;
  const nonPreventable = autoYtd.filter((i) => preventabilityClass(i, true) === 'nonpreventable').length;
  const oshaYes = injuriesYtd.filter((i) => i.osha_recordable === 'Yes').length;
  const oshaPct = injuriesYtd.length ? Math.round((oshaYes / injuriesYtd.length) * 100) : 0;

  const injuryByNature = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of injuriesYtd) {
      const code = i.injury_type_code?.trim() || 'Unspecified';
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }, [injuriesYtd]);

  const Card = ({ icon, label, value, accent }: { icon: JSX.Element; label: string; value: string | number; accent: string }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Year-to-date snapshot across the network</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <PageBanner kind="error" text={error} />}
      {!error && !loading && incidents.length === 0 && (
        <PageBanner kind="empty" text="No incident data yet. Upload an Origami export to populate the dashboard." to="/upload" />
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card icon={<Truck className="w-5 h-5 text-white" />} label="YTD Preventable" value={preventable} accent="bg-[#A63626]" />
            <Card icon={<ShieldAlert className="w-5 h-5 text-white" />} label="YTD Non-Preventable" value={nonPreventable} accent="bg-[#1F4E79]" />
            <Card icon={<HeartPulse className="w-5 h-5 text-white" />} label="YTD Injuries" value={injuriesYtd.length} accent="bg-[#7B2D8E]" />
            <Card icon={<Percent className="w-5 h-5 text-white" />} label="OSHA %" value={`${oshaPct}%`} accent="bg-[#006838]" />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Quick links</h2>
            <div className="flex flex-wrap gap-2">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 hover:border-[#006838]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {incidents.length > 0 && (
            <div className="space-y-6">
              <FamilyType incidents={incidents} range={range} branch="all" />

              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-1">Injuries by nature (YTD)</h2>
                <p className="text-xs text-gray-500 mb-4">Counts by injury type code</p>
                {injuryByNature.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">No injuries YTD.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(180, injuryByNature.length * 36)}>
                    <BarChart data={injuryByNature} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="code" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={COLORS.injury} name="Injuries" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {mileage.length > 0 && (
                <FamilyApmm incidents={incidents} mileage={mileage} range={range} branch="all" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
