import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SlideChrome, { SlideScope } from '../../components/SlideChrome';
import { BRANCH_ORDER } from '../../lib/branches';
import { COLORS } from '../../lib/colors';
import { DateRange, fmt } from '../../lib/dates';
import { inRange } from '../../lib/isoDate';
import { Incident } from '../../lib/supabase';
import { aggregateByType, AutoRow } from './aggregate';

export type FamilyRange = { from: Date; to: Date; label?: string };

type Props = {
  incidents: Incident[];
  mileage?: unknown;
  samsara?: unknown;
  range: FamilyRange;
  branch?: string | 'all';
};

type ChartRow = {
  type: string;
  preventable: number;
  nonPreventable: number;
  total: number;
  pct: number;
};

function toDateRange(range: FamilyRange): DateRange {
  return { from: range.from, to: range.to, label: range.label ?? '' };
}

function toScope(branch?: string | 'all'): SlideScope {
  if (!branch || branch === 'all') return 'all';
  if ((BRANCH_ORDER as readonly string[]).includes(branch)) return branch as SlideScope;
  return 'all';
}

function filterRows(incidents: Incident[], range: FamilyRange, scope: SlideScope): AutoRow[] {
  return incidents.filter((i) => {
    if (!inRange(i.loss_date, range.from, range.to)) return false;
    if (scope !== 'all' && i.branch !== scope) return false;
    return true;
  });
}

function InBarLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  if (!value || width < 18) return null;
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#fff"
      fontSize={11}
      fontWeight={600}
    >
      {value}
    </text>
  );
}

function makeEndTotalLabel(data: ChartRow[]) {
  return function EndTotalLabel(props: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
  }) {
    const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props;
    const row = data[index];
    if (!row) return null;
    return (
      <text
        x={x + width + 8}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="central"
        fill="#1f2937"
        fontSize={12}
        fontWeight={600}
      >
        {row.total} ({row.pct}%)
      </text>
    );
  };
}

export default function FamilyType({ incidents, range, branch }: Props) {
  const [scope, setScope] = useState<SlideScope>(() => toScope(branch));
  const [localRange, setLocalRange] = useState<DateRange>(() => toDateRange(range));

  useEffect(() => {
    setScope(toScope(branch));
  }, [branch]);

  useEffect(() => {
    setLocalRange(toDateRange(range));
  }, [range]);

  const rows = useMemo(
    () => filterRows(incidents, localRange, scope),
    [incidents, localRange, scope],
  );
  const bars = useMemo(() => aggregateByType(rows), [rows]);
  const grandTotal = bars.reduce((s, b) => s + b.total, 0);
  const chartData: ChartRow[] = bars.map((b) => ({
    ...b,
    pct: grandTotal > 0 ? Math.round((b.total / grandTotal) * 100) : 0,
  }));
  const preventableN = bars.reduce((s, b) => s + b.preventable, 0);
  const nonN = bars.reduce((s, b) => s + b.nonPreventable, 0);
  const height = Math.max(220, chartData.length * 36 + 60);
  const EndTotalLabel = makeEndTotalLabel(chartData);

  return (
    <SlideChrome
      title="Accidents by Type"
      subtitle={`${fmt(localRange.from)} – ${fmt(localRange.to)} · type from event description`}
      nLabel={
        grandTotal > 0
          ? `n = ${grandTotal} (${preventableN} preventable / ${nonN} non-preventable)`
          : 'n = 0'
      }
      footnote="Suffixed follow-ons and injuries excluded. Preventable includes pending/blank. Type from event description."
      scope={scope}
      onScope={setScope}
      range={localRange}
      onRange={setLocalRange}
    >
      {chartData.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No auto accidents in this range.</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 72, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="type"
              width={130}
              tick={{ fontSize: 12, fill: '#374151' }}
            />
            <Tooltip />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) =>
                value === 'Preventable' ? 'Preventable (incl. pending/blank)' : String(value)
              }
            />
            <Bar
              dataKey="preventable"
              stackId="a"
              fill={COLORS.typePreventable}
              name="Preventable"
              isAnimationActive={false}
            >
              <LabelList content={<InBarLabel />} />
            </Bar>
            <Bar
              dataKey="nonPreventable"
              stackId="a"
              fill={COLORS.typeNonPreventable}
              name="Non-preventable"
              isAnimationActive={false}
            >
              <LabelList content={<InBarLabel />} />
              <LabelList content={EndTotalLabel as never} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </SlideChrome>
  );
}
