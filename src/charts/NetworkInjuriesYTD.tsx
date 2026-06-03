import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard from '../components/ChartCard';
import { COLORS } from '../lib/colors';
import { supabase, Incident } from '../lib/supabase';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function NetworkInjuriesYTD() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false).eq('is_injury', true);
      const incidents = (inc as Incident[]) || [];
      const rows = MONTHS.map((m, idx) => {
        const month = idx + 1;
        const monthInc = incidents.filter((i) => {
          if (!i.loss_date) return false;
          const d = new Date(i.loss_date);
          return d.getFullYear() === 2026 && d.getMonth() + 1 === month;
        });
        const osha = monthInc.filter((i) => i.osha_recordable === 'Yes').length;
        return { month: m, injuries: monthInc.length, osha, oshaPct: monthInc.length ? Math.round((osha / monthInc.length) * 100) : 0 };
      });
      setData(rows);
    })();
  }, []);

  return (
    <ChartCard title="Network Injuries YTD" caption="Monthly injuries with OSHA recordable percentage">
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit="%" />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="left" dataKey="injuries" fill={COLORS.injury} name="Injuries" />
          <Bar yAxisId="left" dataKey="osha" fill={COLORS.osha} name="OSHA" />
          <Line yAxisId="right" type="monotone" dataKey="oshaPct" stroke={COLORS.darkRed} strokeWidth={2} name="OSHA %" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
