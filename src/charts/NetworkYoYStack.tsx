import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import ChartCard from '../components/ChartCard';
import { COLORS } from '../lib/colors';
import { supabase, Incident } from '../lib/supabase';
import { classify } from '../lib/queries';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function NetworkYoYStack() {
  const [data, setData] = useState<any[]>([]);
  const [foldPending, setFoldPending] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false).eq('is_injury', false);
      const incidents = (inc as Incident[]) || [];
      const rows = MONTHS.map((m, idx) => {
        const month = idx + 1;
        const monthInc = (yr: number) => incidents.filter((i) => {
          if (!i.loss_date) return false;
          const d = new Date(i.loss_date);
          return d.getFullYear() === yr && d.getMonth() + 1 === month;
        });
        const c2026 = monthInc(2026);
        const prev = c2026.filter((i) => classify(i, foldPending) === 'preventable').length;
        const nonPrev = c2026.filter((i) => classify(i, foldPending) === 'nonpreventable').length;
        const pend = foldPending ? 0 : c2026.filter((i) => classify(i, foldPending) === 'pending').length;
        const prior = monthInc(2025).length;
        return { month: m, preventable: prev, nonpreventable: nonPrev, pending: pend, prior };
      });
      setData(rows);
    })();
  }, [foldPending]);

  return (
    <ChartCard
      title="Network YoY Stacked"
      caption="Monthly preventable / non-preventable totals with prior year overlay"
      controls={
        <label className="flex items-center gap-1.5 text-xs text-ink-muted">
          <input type="checkbox" checked={foldPending} onChange={(e) => setFoldPending(e.target.checked)} />
          Fold pending into preventable
        </label>
      }
    >
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DB" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="preventable" stackId="a" fill={COLORS.preventable} name="Preventable" />
          <Bar dataKey="nonpreventable" stackId="a" fill={COLORS.nonPreventable} name="Non-preventable" />
          {!foldPending && <Bar dataKey="pending" stackId="a" fill={COLORS.pending} name="Pending" />}
          <Line type="monotone" dataKey="prior" stroke={COLORS.prior} strokeWidth={2} name="2025 Total" />
          <Brush dataKey="month" height={24} stroke={COLORS.primary} travellerWidth={8} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
