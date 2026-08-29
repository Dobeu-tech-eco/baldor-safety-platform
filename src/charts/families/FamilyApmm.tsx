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
import { computeApmm } from '../../lib/apmm';
import { BRANCH_ORDER } from '../../lib/branches';
import { preventabilityClass } from '../../lib/classify';
import { COLORS } from '../../lib/colors';
import { DateRange, fmt } from '../../lib/dates';
import { inRange, parseIsoDate } from '../../lib/isoDate';
import { Incident, Mileage } from '../../lib/supabase';
import { aggregateApmmYearly, autoRows, AutoRow } from './aggregate';

export type FamilyRange = { from: Date; to: Date; label?: string };

type Props = {
  incidents: Incident[];
  mileage?: Mileage[];
  samsara?: unknown;
  range: FamilyRange;
  branch?: string | 'all';
};

type QuarterPoint = {
  key: string;
  label: string;
  preventableApmm: number | null;
  nonPreventableApmm: number | null;
  totalApmm: number | null;
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

function filterMileage(mileage: Mileage[], scope: SlideScope): Mileage[] {
  if (scope === 'all') return mileage;
  return mileage.filter((m) => m.branch === scope);
}

function milesByYear(mileage: Mileage[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const m of mileage) {
    out[m.year] = (out[m.year] ?? 0) + m.miles;
  }
  return out;
}

function quarterOf(d: Date): number {
  return Math.floor(d.getUTCMonth() / 3);
}

function aggregateApmmQuarterly(
  rows: AutoRow[],
  mileage: Mileage[],
  through: Date,
): QuarterPoint[] {
  const throughYear = through.getUTCFullYear();
  const throughQ = quarterOf(through);
  const milesMap = new Map<string, number>();
  for (const m of mileage) {
    if (m.year > throughYear) continue;
    const q = Math.floor((m.month - 1) / 3);
    if (m.year === throughYear && q > throughQ) continue;
    const key = `${m.year}-Q${q + 1}`;
    milesMap.set(key, (milesMap.get(key) ?? 0) + m.miles);
  }

  const years = [...new Set(mileage.map((m) => m.year))].sort();
  const points: QuarterPoint[] = [];
  for (const year of years) {
    const maxQ = year === throughYear ? throughQ : 3;
    for (let q = 0; q <= maxQ; q++) {
      const ofQ = autoRows(rows).filter((r) => {
        const d = parseIsoDate(r.loss_date as string);
        return d.getUTCFullYear() === year && quarterOf(d) === q;
      });
      let p = 0;
      let n = 0;
      for (const r of ofQ) {
        if (preventabilityClass(r, true) === 'nonpreventable') n += 1;
        else p += 1;
      }
      const key = `${year}-Q${q + 1}`;
      const miles = milesMap.get(key) ?? 0;
      const incomplete = year === throughYear && q === throughQ;
      const label = incomplete
        ? `${year} Q${q + 1} QTD`
        : `${year} Q${q + 1}`;
      points.push({
        key,
        label,
        preventableApmm: computeApmm(p, miles),
        nonPreventableApmm: computeApmm(n, miles),
        totalApmm: computeApmm(p + n, miles),
      });
    }
  }
  return points.filter((p) => p.totalApmm != null);
}

function ApmmSegmentLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number | null;
}) {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  if (value == null || height < 16) return null;
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
      {value.toFixed(1)}
    </text>
  );
}

function TotalLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  index?: number;
  payload?: { totalApmm: number | null; preventableApmm: number | null };
}) {
  const { x = 0, y = 0, width = 0, payload } = props;
  if (!payload || payload.totalApmm == null) return null;
  const prevShare =
    payload.totalApmm > 0 && payload.preventableApmm != null
      ? Math.round((payload.preventableApmm / payload.totalApmm) * 100)
      : null;
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={11} fill={COLORS.primary}>
      <tspan fontWeight={700}>Total {payload.totalApmm.toFixed(1)}</tspan>
      {prevShare != null && (
        <tspan x={x + width / 2} dy={14} fill={COLORS.purple} fontSize={10}>
          {prevShare}% preventable
        </tspan>
      )}
    </text>
  );
}

export default function FamilyApmm({ incidents, mileage = [], range, branch }: Props) {
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
  const scopedMiles = useMemo(() => filterMileage(mileage, scope), [mileage, scope]);
  const yearly = useMemo(() => {
    const byYear = milesByYear(scopedMiles);
    return aggregateApmmYearly(rows, byYear).map((p) => {
      const incomplete = p.year === localRange.to.getUTCFullYear();
      return {
        ...p,
        label: incomplete ? `${p.year} YTD` : String(p.year),
      };
    });
  }, [rows, scopedMiles, localRange.to]);

  const quarterly = useMemo(
    () => aggregateApmmQuarterly(rows, scopedMiles, localRange.to),
    [rows, scopedMiles, localRange.to],
  );

  const thru = fmt(localRange.to);

  return (
    <SlideChrome
      title="Accidents Per Million Miles"
      subtitle={`Preventable vs non-preventable · thru ${thru}`}
      nLabel={mileage.length === 0 ? 'Upload mileage to compute APMM' : undefined}
      footnote="Auto-related accidents only. Injuries and follow-ons excluded. Rate = accidents ÷ miles × 1,000,000. Incomplete periods labeled YTD / QTD."
      scope={scope}
      onScope={setScope}
      range={localRange}
      onRange={setLocalRange}
    >
      {scopedMiles.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No mileage rows for this scope.</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Yearly</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={yearly} margin={{ top: 36, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{
                    value: 'APMM',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 11, fill: '#6b7280' },
                  }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="nonPreventableApmm"
                  stackId="a"
                  fill={COLORS.lime}
                  name="Non-preventable"
                  isAnimationActive={false}
                >
                  <LabelList content={<ApmmSegmentLabel />} />
                </Bar>
                <Bar
                  dataKey="preventableApmm"
                  stackId="a"
                  fill={COLORS.purple}
                  name="Preventable"
                  isAnimationActive={false}
                >
                  <LabelList content={<ApmmSegmentLabel />} />
                  <LabelList content={<TotalLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Quarterly</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={quarterly} margin={{ top: 36, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="nonPreventableApmm"
                  stackId="a"
                  fill={COLORS.lime}
                  name="Non-preventable"
                  isAnimationActive={false}
                >
                  <LabelList content={<ApmmSegmentLabel />} />
                </Bar>
                <Bar
                  dataKey="preventableApmm"
                  stackId="a"
                  fill={COLORS.purple}
                  name="Preventable"
                  isAnimationActive={false}
                >
                  <LabelList content={<ApmmSegmentLabel />} />
                  <LabelList content={<TotalLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </SlideChrome>
  );
}
