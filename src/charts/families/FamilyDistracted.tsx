import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageBanner from '../../components/PageBanner';
import SlideChrome, { SlideScope } from '../../components/SlideChrome';
import { BRANCH_ORDER } from '../../lib/branches';
import { COLORS } from '../../lib/colors';
import { DateRange, fmt } from '../../lib/dates';
import { parseIsoDate } from '../../lib/isoDate';
import { Incident, SamsaraTagSummary } from '../../lib/supabase';
import { mapTagToBranch } from '../../lib/tagMap';

export type FamilyRange = { from: Date; to: Date; label?: string };

type Props = {
  incidents: Incident[];
  mileage?: unknown;
  samsara?: SamsaraTagSummary[];
  range: FamilyRange;
  branch?: string | 'all';
};

const BEHAVIORS = [
  { key: 'mobile_usage', label: 'Mobile Usage' },
  { key: 'inattentive_driving', label: 'Inattentive' },
  { key: 'drowsy', label: 'Drowsy' },
  { key: 'harsh_brake', label: 'Harsh Brake' },
  { key: 'harsh_turn', label: 'Harsh Turn' },
  { key: 'harsh_accel', label: 'Harsh Accel' },
  { key: 'rolling_stop', label: 'Rolling Stop' },
  { key: 'no_seat_belt', label: 'No Seat Belt' },
] as const;

type BehaviorKey = (typeof BEHAVIORS)[number]['key'];

const BEHAVIOR_COLORS: Record<BehaviorKey, string> = {
  mobile_usage: COLORS.purple,
  inattentive_driving: '#A56BB5',
  drowsy: COLORS.navy,
  harsh_brake: COLORS.preventable,
  harsh_turn: '#D4A017',
  harsh_accel: COLORS.lime,
  rolling_stop: COLORS.gray,
  no_seat_belt: COLORS.darkRed,
};

function toDateRange(range: FamilyRange): DateRange {
  return { from: range.from, to: range.to, label: range.label ?? '' };
}

function toScope(branch?: string | 'all'): SlideScope {
  if (!branch || branch === 'all') return 'all';
  if ((BRANCH_ORDER as readonly string[]).includes(branch)) return branch as SlideScope;
  return 'all';
}

function behaviorCount(row: SamsaraTagSummary, key: BehaviorKey): number {
  switch (key) {
    case 'mobile_usage':
      return row.mobile_usage;
    case 'inattentive_driving':
      return row.inattentive_driving;
    case 'drowsy':
      return row.drowsy;
    case 'harsh_brake':
      return row.harsh_brake;
    case 'harsh_turn':
      return row.harsh_turn;
    case 'harsh_accel':
      return row.harsh_accel;
    case 'rolling_stop':
      return row.rolling_stop;
    case 'no_seat_belt':
      return row.no_seat_belt;
    default: {
      const _exhaustive: never = key;
      throw new Error(`Unhandled behavior: ${String(_exhaustive)}`);
    }
  }
}

function calendarKeyLocal(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function calendarKeyIso(s: string): number {
  const d = parseIsoDate(s);
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

function filterSamsara(
  samsara: SamsaraTagSummary[],
  range: FamilyRange,
  scope: SlideScope,
): SamsaraTagSummary[] {
  const fromKey = calendarKeyLocal(range.from);
  const toKey = calendarKeyLocal(range.to);
  return samsara.filter((row) => {
    const start = calendarKeyIso(row.period_start);
    const end = calendarKeyIso(row.period_end);
    if (end < fromKey || start > toKey) return false;
    if (scope !== 'all') {
      const mapped = mapTagToBranch(row.tag);
      if (mapped !== scope) return false;
    }
    return true;
  });
}

function PctLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  if (value == null || value <= 0) return null;
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      textAnchor="start"
      dominantBaseline="central"
      fontSize={11}
      fill="#1f2937"
      fontWeight={600}
    >
      {value}%
    </text>
  );
}

export default function FamilyDistracted({
  incidents,
  samsara = [],
  range,
  branch,
}: Props) {
  const [scope, setScope] = useState<SlideScope>(() => toScope(branch));
  const [localRange, setLocalRange] = useState<DateRange>(() => toDateRange(range));

  useEffect(() => {
    setScope(toScope(branch));
  }, [branch]);

  useEffect(() => {
    setLocalRange(toDateRange(range));
  }, [range]);

  const scoped = useMemo(
    () => (samsara.length === 0 ? [] : filterSamsara(samsara, localRange, scope)),
    [samsara, localRange, scope],
  );

  const shareBars = useMemo(() => {
    const tagCount = scoped.length;
    return BEHAVIORS.map((b) => {
      const withBehavior = scoped.filter((row) => behaviorCount(row, b.key) > 0).length;
      const pct = tagCount > 0 ? Math.round((withBehavior / tagCount) * 100) : 0;
      return {
        behavior: b.label,
        key: b.key,
        pct,
        count: withBehavior,
        fill: BEHAVIOR_COLORS[b.key],
      };
    }).filter((b) => b.pct > 0);
  }, [scoped]);

  const tagRows = useMemo(() => {
    return scoped
      .map((row) => {
        const point: Record<string, string | number> = { tag: row.tag };
        let total = 0;
        for (const b of BEHAVIORS) {
          const n = behaviorCount(row, b.key);
          point[b.key] = n;
          total += n;
        }
        point.total = total;
        return point;
      })
      .filter((r) => (r.total as number) > 0)
      .sort((a, b) => (b.total as number) - (a.total as number));
  }, [scoped]);

  if (samsara.length === 0) {
    return (
      <PageBanner
        kind="empty"
        text="Upload a Samsara Driver Safety Report to see distracted / coaching behavior charts."
        to="/upload"
      />
    );
  }

  return (
    <SlideChrome
      title="Distracted / Coaching Behaviors"
      subtitle={`${fmt(localRange.from)} – ${fmt(localRange.to)} · tag-level Samsara summaries`}
      nLabel={`${scoped.length} tags · ${shareBars.length} behaviors with activity · ${incidents.filter((i) => i.loss_date).length} origami incidents loaded`}
      footnote="Source: Samsara tag summaries — per-driver lead-up requires driver-level exports, not in this file."
      scope={scope}
      onScope={setScope}
      range={localRange}
      onRange={setLocalRange}
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Share of tags with each behavior
          </h3>
          {shareBars.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No behavior counts in this range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, shareBars.length * 36)}>
              <BarChart
                data={shareBars}
                layout="vertical"
                margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="behavior" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
                <Bar dataKey="pct" name="Share of tags" isAnimationActive={false}>
                  {shareBars.map((b) => (
                    <Cell key={b.key} fill={b.fill} />
                  ))}
                  <LabelList content={<PctLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Behavior counts by tag</h3>
          <p className="text-xs text-gray-500 mb-2">
            Tag rows shown (not named drivers). Source: Samsara tag summaries — per-driver lead-up
            requires driver-level exports, not in this file.
          </p>
          {tagRows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No tag behavior totals in this range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, Math.min(tagRows.length, 25) * 28)}>
              <BarChart
                data={tagRows.slice(0, 25)}
                layout="vertical"
                margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="tag" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {BEHAVIORS.map((b) => (
                  <Bar
                    key={b.key}
                    dataKey={b.key}
                    stackId="behaviors"
                    fill={BEHAVIOR_COLORS[b.key]}
                    name={b.label}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </SlideChrome>
  );
}
