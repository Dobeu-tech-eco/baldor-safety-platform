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
import { DateRange, fmt, monthLabel } from '../../lib/dates';
import { Incident } from '../../lib/supabase';
import { aggregateYoyMonthly, AutoRow } from './aggregate';

export type FamilyRange = { from: Date; to: Date; label?: string };

type Props = {
  incidents: Incident[];
  mileage?: unknown;
  samsara?: unknown;
  range: FamilyRange;
  branch?: string | 'all';
};

type GroupedMonth = {
  month: number;
  label: string;
  aPreventable: number;
  aNonPreventable: number;
  aTotal: number;
  bPreventable: number;
  bNonPreventable: number;
  bTotal: number;
};

function toDateRange(range: FamilyRange): DateRange {
  return { from: range.from, to: range.to, label: range.label ?? '' };
}

function toScope(branch?: string | 'all'): SlideScope {
  if (!branch || branch === 'all') return 'all';
  if ((BRANCH_ORDER as readonly string[]).includes(branch)) return branch as SlideScope;
  return 'all';
}

function filterRows(incidents: Incident[], scope: SlideScope): AutoRow[] {
  return incidents.filter((i) => {
    if (!i.loss_date) return false;
    if (scope !== 'all' && i.branch !== scope) return false;
    return true;
  });
}

function SegmentLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  if (!value || height < 14) return null;
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#fff"
      fontSize={10}
      fontWeight={600}
    >
      {value}
    </text>
  );
}

function TopTotal(props: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
}) {
  const { x = 0, y = 0, width = 0, value } = props;
  if (!value) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 4}
      textAnchor="middle"
      fontSize={11}
      fontWeight={700}
      fill="#1f2937"
    >
      {value}
    </text>
  );
}

export default function FamilyYoyMonthly({ incidents, range, branch }: Props) {
  const [scope, setScope] = useState<SlideScope>(() => toScope(branch));
  const [localRange, setLocalRange] = useState<DateRange>(() => toDateRange(range));

  useEffect(() => {
    setScope(toScope(branch));
  }, [branch]);

  useEffect(() => {
    setLocalRange(toDateRange(range));
  }, [range]);

  const yearB = localRange.to.getUTCFullYear();
  const yearA = yearB - 1;
  const throughMonth = localRange.to.getUTCMonth() + 1;

  const rows = useMemo(() => filterRows(incidents, scope), [incidents, scope]);
  const raw = useMemo(
    () => aggregateYoyMonthly(rows, yearA, yearB, throughMonth),
    [rows, yearA, yearB, throughMonth],
  );

  const grouped: GroupedMonth[] = useMemo(() => {
    const out: GroupedMonth[] = [];
    for (let month = 1; month <= throughMonth; month++) {
      const a = raw.find((r) => r.year === yearA && r.month === month);
      const b = raw.find((r) => r.year === yearB && r.month === month);
      out.push({
        month,
        label: monthLabel(month),
        aPreventable: a?.preventable ?? 0,
        aNonPreventable: a?.nonPreventable ?? 0,
        aTotal: a?.total ?? 0,
        bPreventable: b?.preventable ?? 0,
        bNonPreventable: b?.nonPreventable ?? 0,
        bTotal: b?.total ?? 0,
      });
    }
    return out;
  }, [raw, throughMonth, yearA, yearB]);

  const nA = grouped.reduce((s, g) => s + g.aTotal, 0);
  const nB = grouped.reduce((s, g) => s + g.bTotal, 0);

  return (
    <SlideChrome
      title="Year-over-Year Monthly"
      subtitle={`${yearA} (hatched) vs ${yearB} (solid) · thru ${fmt(localRange.to)}`}
      nLabel={`${yearA} n=${nA} · ${yearB} n=${nB}`}
      footnote="pending/unclassified preventability excluded. First-record only; injuries excluded."
      scope={scope}
      onScope={setScope}
      range={localRange}
      onRange={setLocalRange}
    >
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={grouped} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="aNonPreventable"
            stackId="a"
            fill={COLORS.nonPreventable}
            fillOpacity={0.45}
            name={`${yearA} Non-preventable`}
            isAnimationActive={false}
          >
            <LabelList content={<SegmentLabel />} />
          </Bar>
          <Bar
            dataKey="aPreventable"
            stackId="a"
            fill={COLORS.preventable}
            fillOpacity={0.45}
            name={`${yearA} Preventable`}
            isAnimationActive={false}
          >
            <LabelList content={<SegmentLabel />} />
            <LabelList dataKey="aTotal" content={<TopTotal />} />
          </Bar>
          <Bar
            dataKey="bNonPreventable"
            stackId="b"
            fill={COLORS.nonPreventable}
            name={`${yearB} Non-preventable`}
            isAnimationActive={false}
          >
            <LabelList content={<SegmentLabel />} />
          </Bar>
          <Bar
            dataKey="bPreventable"
            stackId="b"
            fill={COLORS.preventable}
            name={`${yearB} Preventable`}
            isAnimationActive={false}
          >
            <LabelList content={<SegmentLabel />} />
            <LabelList dataKey="bTotal" content={<TopTotal />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </SlideChrome>
  );
}
