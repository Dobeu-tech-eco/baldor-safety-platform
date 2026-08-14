import { useEffect, useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard from '../components/ChartCard';
import { COLORS } from '../lib/colors';
import { supabase, Incident } from '../lib/supabase';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function NewHireShare() {
  const [band, setBand] = useState(90);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false);
      const incidents = (inc as Incident[]) || [];
      const rows = MONTHS.map((m, idx) => {
        const month = idx + 1;
        const monthInc = incidents.filter((i) => {
          if (!i.loss_date) return false;
          const d = new Date(i.loss_date);
          return d.getFullYear() === 2026 && d.getMonth() + 1 === month;
        });
        const newHire = monthInc.filter((i) => i.tenure_days != null && i.tenure_days <= band).length;
        const total = monthInc.length;
        return { month: m, share: total ? Math.round((newHire / total) * 100) : 0, newHire, total };
      });
      setData(rows);
    })();
  }, [band]);

  return (
    <ChartCard
      title="New-Hire Incident Share"
      caption={`Percent of incidents involving employees within ${band} days of hire`}
      square
      controls={
        <select value={band} onChange={(e) => setBand(parseInt(e.target.value, 10))}
          className="field w-auto text-xs min-h-[36px]">
          {[60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} days</option>)}
        </select>
      }
    >
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4d2cf" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="%" />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="share" fill={COLORS.lime} name="New-hire %" />
          <Line type="monotone" dataKey="newHire" stroke={COLORS.primary} strokeWidth={2} name="New-hire count" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
