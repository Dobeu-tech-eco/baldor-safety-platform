import { useEffect, useMemo, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from '../components/ChartCard';
import { COLORS } from '../lib/colors';
import { supabase, Incident, SnowEvent } from '../lib/supabase';
import { classify } from '../lib/queries';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function NetworkYoYSnow() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false).eq('is_injury', false);
      const { data: snow } = await supabase.from('snow_events').select('*');
      const incidents = (inc as Incident[]) || [];
      const snowEvents = (snow as SnowEvent[]) || [];
      const rows = MONTHS.map((m, idx) => {
        const month = idx + 1;
        const count = (yr: number) => incidents.filter((i) => {
          if (!i.loss_date) return false;
          const d = new Date(i.loss_date);
          if (d.getFullYear() !== yr || d.getMonth() + 1 !== month) return false;
          return classify(i, true) === 'preventable';
        }).length;
        const snowCount = (yr: number) => snowEvents.filter((s) => s.year === yr && s.month === month).reduce((a, b) => a + b.attributable_count, 0);
        return {
          month: m,
          '2025': count(2025),
          '2026': count(2026),
          snow2025: snowCount(2025),
          snow2026: snowCount(2026),
          target: 8,
          normal: 12,
        };
      });
      setData(rows);
    })();
  }, []);

  return (
    <ChartCard title="Network YoY Preventable + Snow" caption="Monthly preventable vehicle incidents with snow days">
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="snow2026" fill={COLORS.snow} name="Snow days 2026" />
          <Line type="monotone" dataKey="2025" stroke={COLORS.prior} strokeWidth={2} name="2025" />
          <Line type="monotone" dataKey="2026" stroke={COLORS.primary} strokeWidth={3} name="2026" />
          <Line type="monotone" dataKey="target" stroke={COLORS.target} strokeWidth={1.5} strokeDasharray="5 5" name="Target" />
          <Line type="monotone" dataKey="normal" stroke={COLORS.normal} strokeWidth={1.5} strokeDasharray="3 3" name="Normal" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
