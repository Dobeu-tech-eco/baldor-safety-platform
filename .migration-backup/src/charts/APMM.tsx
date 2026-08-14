import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Brush } from 'recharts';
import ChartCard from '../components/ChartCard';
import { COLORS } from '../lib/colors';
import { BRANCH_ORDER } from '../lib/branches';
import { supabase, Incident, Mileage } from '../lib/supabase';
import { classify } from '../lib/queries';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function APMM() {
  const [dotOnly, setDotOnly] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false).eq('is_injury', false);
      const { data: ml } = await supabase.from('mileage').select('*');
      const incidents = (inc as Incident[]) || [];
      const mileage = (ml as Mileage[]) || [];
      const rows = MONTHS.map((m, idx) => {
        const month = idx + 1;
        const monthInc = incidents.filter((i) => {
          if (!i.loss_date) return false;
          const d = new Date(i.loss_date);
          if (d.getFullYear() !== 2026 || d.getMonth() + 1 !== month) return false;
          if (dotOnly && i.dot_recordable !== 'Yes') return false;
          return classify(i, true) === 'preventable';
        });
        const obj: any = { month: m };
        let totalAccidents = 0;
        let totalMiles = 0;
        BRANCH_ORDER.forEach((b) => {
          const c = monthInc.filter((i) => i.branch === b).length;
          obj[b] = c;
          totalAccidents += c;
          const mi = mileage.find((x) => x.branch === b && x.year === 2026 && x.month === month);
          totalMiles += mi?.miles ?? 0;
        });
        obj.apmm = totalMiles > 0 ? (totalAccidents / totalMiles) * 1_000_000 : 0;
        return obj;
      });
      setData(rows);
    })();
  }, [dotOnly]);

  const palette = [COLORS.primary, COLORS.lime, COLORS.navy, COLORS.purple];

  return (
    <ChartCard
      title="Accidents per Million Miles"
      caption="Stacked branch counts with APMM line"
      controls={
        <label className="flex items-center gap-1.5 text-xs text-gray-700">
          <input type="checkbox" checked={dotOnly} onChange={(e) => setDotOnly(e.target.checked)} />
          DOT recordable only
        </label>
      }
    >
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {BRANCH_ORDER.map((b, i) => (
            <Bar key={b} yAxisId="left" dataKey={b} stackId="a" fill={palette[i]} name={b} />
          ))}
          <Line yAxisId="right" type="monotone" dataKey="apmm" stroke={COLORS.darkRed} strokeWidth={2} name="APMM" />
          <ReferenceLine yAxisId="right" y={0.5} stroke={COLORS.target} strokeDasharray="4 4" label={{ value: 'Target 0.5', fontSize: 10, fill: COLORS.target, position: 'right' }} />
          <ReferenceLine yAxisId="right" y={1.0} stroke={COLORS.darkRed} strokeDasharray="4 4" label={{ value: 'Industry 1.0', fontSize: 10, fill: COLORS.darkRed, position: 'right' }} />
          <Brush dataKey="month" height={24} stroke={COLORS.primary} travellerWidth={8} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
