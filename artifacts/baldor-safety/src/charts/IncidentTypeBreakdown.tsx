import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartCard from '../components/ChartCard';
import { COLORS } from '../lib/colors';
import { BRANCH_ORDER } from '../lib/branches';
import { getIncidents, type Incident } from '../lib/api';

export default function IncidentTypeBreakdown() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const inc = await getIncidents();
      const incidents: Incident[] = inc;
      const map = new Map<string, any>();
      incidents.forEach((i) => {
        const type = i.incident_type || 'Unspecified';
        if (!map.has(type)) {
          const obj: any = { type, total: 0 };
          BRANCH_ORDER.forEach((b) => (obj[b] = 0));
          map.set(type, obj);
        }
        const row = map.get(type);
        const b = BRANCH_ORDER.includes(i.branch as any) ? i.branch : null;
        if (b) row[b]++;
        row.total++;
      });
      setData(Array.from(map.values()).sort((a, b) => b.total - a.total));
    })();
  }, []);

  const palette = [COLORS.primary, COLORS.lime, COLORS.navy, COLORS.purple];

  return (
    <ChartCard title="Incident Type Breakdown" caption="By type, stacked by branch">
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={150} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {BRANCH_ORDER.map((b, i) => (
            <Bar key={b} dataKey={b} stackId="a" fill={palette[i]} name={b} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
