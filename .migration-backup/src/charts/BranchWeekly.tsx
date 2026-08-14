import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfWeek, addDays, format } from 'date-fns';
import ChartCard from '../components/ChartCard';
import { COLORS } from '../lib/colors';
import { BRANCH_ORDER, BRANCH_LABELS } from '../lib/branches';
import { supabase, Incident } from '../lib/supabase';
import { classify } from '../lib/queries';

type Range = { from: Date; to: Date };

export default function BranchWeekly({ range }: { range?: Range }) {
  const [data, setData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    (async () => {
      const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false).eq('is_injury', false);
      const incidents = (inc as Incident[]) || [];
      const to = range?.to ?? new Date();
      const from = range?.from ?? addDays(to, -49);
      const weeks: { start: Date; label: string }[] = [];
      let w = startOfWeek(from, { weekStartsOn: 1 });
      while (w <= to) {
        weeks.push({ start: new Date(w), label: format(w, 'M/d') });
        w = addDays(w, 7);
      }
      const out: Record<string, any[]> = {};
      BRANCH_ORDER.forEach((b) => {
        out[b] = weeks.map((wk) => {
          const wkEnd = addDays(wk.start, 7);
          const rows = incidents.filter((i) => {
            if (i.branch !== b || !i.loss_date) return false;
            const d = new Date(i.loss_date);
            return d >= wk.start && d < wkEnd;
          });
          return {
            week: wk.label,
            preventable: rows.filter((r) => classify(r, true) === 'preventable').length,
            nonpreventable: rows.filter((r) => classify(r, true) === 'nonpreventable').length,
          };
        });
      });
      setData(out);
    })();
  }, [range]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {BRANCH_ORDER.map((b) => {
        const rows = data[b] || [];
        const total = rows.reduce((s, r) => s + r.preventable + r.nonpreventable, 0);
        return (
          <ChartCard key={b} title={`${b} — ${BRANCH_LABELS[b]}`} caption="Weekly preventable / non-preventable" square>
            {total === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="text-5xl font-bold text-[#006838]">0</div>
                  <div className="text-sm text-gray-700 mt-2">No vehicle incidents in range</div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4d2cf" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="preventable" stackId="a" name="Preventable">
                    {rows.map((_, i) => <Cell key={i} fill={COLORS.preventable} />)}
                  </Bar>
                  <Bar dataKey="nonpreventable" stackId="a" name="Non-preventable">
                    {rows.map((_, i) => <Cell key={i} fill={COLORS.nonPreventable} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        );
      })}
    </div>
  );
}
