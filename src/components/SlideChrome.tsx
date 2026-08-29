import { ReactNode, useRef } from 'react';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { BRANCH_ORDER } from '../lib/branches';
import { COLORS } from '../lib/colors';
import { DateRange, fmt, ytd } from '../lib/dates';

export type SlideScope = 'all' | (typeof BRANCH_ORDER)[number];

type Props = {
  title: string;
  subtitle?: string;
  nLabel?: string;
  footnote?: string;
  scope: SlideScope;
  onScope: (scope: SlideScope) => void;
  range: DateRange;
  onRange: (range: DateRange) => void;
  children: ReactNode;
  onExportError?: (error: unknown) => void;
};

function scopeButtonClass(active: boolean): string {
  return `px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
    active
      ? 'bg-[#006838] text-white border-[#006838]'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
  }`;
}

export default function SlideChrome({
  title,
  subtitle,
  nLabel,
  footnote,
  scope,
  onScope,
  range,
  onRange,
  children,
  onExportError,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  async function exportPng() {
    if (!panelRef.current) return;
    try {
      const dataUrl = await toPng(panelRef.current, {
        backgroundColor: COLORS.slideCream,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'slide'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      onExportError?.(error);
    }
  }

  function setFrom(value: string) {
    if (!value) return;
    const from = new Date(`${value}T00:00:00`);
    if (isNaN(from.getTime())) return;
    onRange({ from, to: range.to, label: 'Custom' });
  }

  function setTo(value: string) {
    if (!value) return;
    const to = new Date(`${value}T00:00:00`);
    if (isNaN(to.getTime())) return;
    onRange({ from: range.from, to, label: 'Custom' });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={scopeButtonClass(scope === 'all')}
          onClick={() => onScope('all')}
        >
          All Company
        </button>
        {BRANCH_ORDER.map((branch) => (
          <button
            key={branch}
            type="button"
            className={scopeButtonClass(scope === branch)}
            onClick={() => onScope(branch)}
          >
            {branch}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden />
        <button
          type="button"
          className={scopeButtonClass(range.label === 'YTD')}
          onClick={() => onRange(ytd())}
        >
          YTD
        </button>
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>From</span>
          <input
            type="date"
            value={fmt(range.from)}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-800"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>To</span>
          <input
            type="date"
            value={fmt(range.to)}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-800"
          />
        </label>
        <button
          type="button"
          onClick={exportPng}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Download className="w-3.5 h-3.5" />
          Export PNG
        </button>
      </div>

      <div
        ref={panelRef}
        className="rounded-lg p-6"
        style={{ backgroundColor: COLORS.slideCream }}
      >
        <div className="mb-4">
          <h2
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: COLORS.slideConfidential }}
          >
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          {nLabel && <p className="mt-1 text-xs font-medium text-gray-500">{nLabel}</p>}
        </div>

        <div>{children}</div>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-gray-300/60 pt-3">
          <p className="text-[11px] text-gray-500 leading-snug">{footnote}</p>
          <p
            className="shrink-0 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: COLORS.slideConfidential }}
          >
            CONFIDENTIAL — Baldor Transportation Safety
          </p>
        </div>
      </div>
    </div>
  );
}
