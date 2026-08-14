import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard from '../components/ChartCard';
import { COLORS } from '../lib/colors';
import { BRANCH_ORDER, BRANCH_LABELS } from '../lib/branches';
import { supabase, Incident } from '../lib/supabase';

export default function BranchInjury() {
  const [data, setData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    (async () => {
      const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false).eq('is_injury', true);
      const incidents = (inc as Incident[]) || [];
      const out: Record<string, any[]> = {};
      BRANCH_ORDER.forEach((b) => {
        const types = new Map<string, { count: number; osha: number }>();
        incidents.filter((i) => i.branch === b).forEach((i) => {
          const t = i.injury_type_code || 'Other';
          const cur = types.get(t) || { count: 0, osha: 0 };
          cur.count++;
          if (i.osha_recordable === 'Yes') cur.osha++;
          types.set(t, cur);
        });
        out[b] = Array.from(types.entries()).map(([type, v]) => ({ type, count: v.count, osha: v.osha })).sort((a, b) => b.count - a.count);
      });
      setData(out);
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {BRANCH_ORDER.map((b) => {
        const rows = data[b] || [];
        const total = rows.reduce((s, r) => s + r.count, 0);
        return (
          <ChartCard key={b} title={`${b} — ${BRANCH_LABELS[b]} Injuries`} caption="By injury type with OSHA overlay" square>
            {total === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="t-headline text-5xl text-brand-print">0</div>
                  <div className="text-sm text-ink-muted mt-2">No injuries</div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4d2cf" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" fill={COLORS.injury} name="Injuries" />
                  <Line type="monotone" dataKey="osha" stroke={COLORS.osha} strokeWidth={2} name="OSHA" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        );
      })}
    </div>
  );
}
