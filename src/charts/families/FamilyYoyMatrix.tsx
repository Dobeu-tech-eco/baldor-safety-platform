import { useEffect, useMemo, useState } from 'react';
import SlideChrome, { SlideScope } from '../../components/SlideChrome';
import { BRANCH_ORDER } from '../../lib/branches';
import { DateRange, fmt, monthLabel } from '../../lib/dates';
import { Incident } from '../../lib/supabase';
import { aggregateYoyMatrix, AutoRow } from './aggregate';

export type FamilyRange = { from: Date; to: Date; label?: string };

type Props = {
  incidents: Incident[];
  mileage?: unknown;
  samsara?: unknown;
  range: FamilyRange;
  branch?: string | 'all';
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

function cellBg(a: number, b: number): string | undefined {
  if (b > a) return '#f8d7da';
  if (b < a) return '#d4edda';
  return undefined;
}

export default function FamilyYoyMatrix({ incidents, range, branch }: Props) {
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
  const matrix = useMemo(
    () => aggregateYoyMatrix(rows, yearA, yearB, throughMonth),
    [rows, yearA, yearB, throughMonth],
  );

  const months = Array.from({ length: throughMonth }, (_, i) => i + 1);

  return (
    <SlideChrome
      title="YoY Accident Type Matrix"
      subtitle={`${yearA} → ${yearB} · thru ${fmt(localRange.to)} · type × month`}
      nLabel={matrix.length > 0 ? `${matrix.length} types with activity` : 'No rows'}
      footnote="Red = worse (b > a), green = better (b < a). First-record only; injuries excluded. Type from event description."
      scope={scope}
      onScope={setScope}
      range={localRange}
      onRange={setLocalRange}
    >
      {matrix.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No auto accidents for this YoY window.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="sticky left-0 bg-gray-100 px-2 py-2 text-left font-semibold border border-gray-200">
                  Type
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="px-2 py-2 text-center font-semibold border border-gray-200 whitespace-nowrap"
                  >
                    {monthLabel(m)}
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-semibold border border-gray-200">YTD</th>
                <th className="px-2 py-2 text-center font-semibold border border-gray-200">Δ</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.type}>
                  <td className="sticky left-0 bg-[#F1EFEC] px-2 py-1.5 font-medium text-gray-800 border border-gray-200 whitespace-nowrap">
                    {row.type}
                  </td>
                  {row.months.map((cell, idx) => (
                    <td
                      key={idx}
                      className="px-2 py-1.5 text-center border border-gray-200 tabular-nums"
                      style={{ backgroundColor: cellBg(cell.a, cell.b) }}
                    >
                      {cell.a} → {cell.b}
                    </td>
                  ))}
                  <td
                    className="px-2 py-1.5 text-center border border-gray-200 tabular-nums font-medium"
                    style={{ backgroundColor: cellBg(row.ytdA, row.ytdB) }}
                  >
                    {row.ytdA} → {row.ytdB}
                  </td>
                  <td
                    className="px-2 py-1.5 text-center border border-gray-200 tabular-nums font-semibold"
                    style={{ backgroundColor: cellBg(0, row.delta) }}
                  >
                    {row.delta > 0 ? `+${row.delta}` : row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SlideChrome>
  );
}
