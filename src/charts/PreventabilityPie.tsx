import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase, Incident } from '../lib/supabase';
import { classify } from '../lib/queries';
import { COLORS } from '../lib/colors';

type Slice = { name: string; value: number; color: string };

export default function PreventabilityPie() {
  const [slices, setSlices] = useState<Slice[]>([]);

  useEffect(() => {
    (async () => {
      const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false).eq('is_injury', false);
      const incidents = (inc as Incident[]) || [];
      const year = new Date().getFullYear();
      const ytd = incidents.filter((i) => i.loss_date && new Date(i.loss_date).getFullYear() === year);
      const prev = ytd.filter((i) => classify(i, false) === 'preventable').length;
      const nonPrev = ytd.filter((i) => classify(i, false) === 'nonpreventable').length;
      const pending = ytd.filter((i) => classify(i, false) === 'pending').length;
      setSlices([
        { name: 'Preventable', value: prev, color: COLORS.preventable },
        { name: 'Non-preventable', value: nonPrev, color: COLORS.nonPreventable },
        { name: 'Pending', value: pending, color: COLORS.pending },
      ]);
    })();
  }, []);

  const total = slices.reduce((a, s) => a + s.value, 0);

  return (
    <div className="card-surface p-5">
      <h3 className="t-headline text-lg text-ink-true">Preventability breakdown (YTD)</h3>
      <p className="text-xs text-ink-muted mt-0.5">Vehicle incidents by classification</p>
      {total === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-ink-muted">No data</div>
      ) : (
        <div className="flex items-center gap-4 mt-2 rounded-lg bg-cream-panel border border-hair p-3">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v} (${total ? Math.round((v / total) * 100) : 0}%)`} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
