import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { parseRequest, chartTitle, ChartId } from '../lib/parser';
import { trailing30, ytd, lastWeek, DateRange } from '../lib/dates';
import ChartRouter from '../charts/ChartRouter';

const CHARTS: { id: ChartId; label: string }[] = [
  { id: 'network-yoy-snow', label: 'Network YoY + Snow' },
  { id: 'network-yoy-stack', label: 'Network YoY Stacked' },
  { id: 'branch-weekly', label: 'Per-Branch Weekly' },
  { id: 'branch-injury', label: 'Per-Branch Injuries' },
  { id: 'network-injuries-ytd', label: 'Network Injuries YTD' },
  { id: 'incident-type-breakdown', label: 'Incident Type Breakdown' },
  { id: 'new-hire-share', label: 'New-Hire Share' },
  { id: 'branch-30-trend', label: 'Branch 30-Day Trend' },
  { id: 'apmm', label: 'Accidents Per Million Miles' },
  { id: 'unclassified', label: 'Unclassified' },
];

export default function Charts() {
  const [params] = useSearchParams();
  const [ask, setAsk] = useState(params.get('q') ?? '');
  const [chartId, setChartId] = useState<ChartId>('network-yoy-stack');
  const [range, setRange] = useState<DateRange | undefined>(ytd());
  const [notes, setNotes] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = params.get('q');
    if (q) {
      const r = parseRequest(q);
      setChartId(r.chartId);
      if (r.range) setRange(r.range);
      setNotes(r.notes);
    }
  }, [params]);

  function submitAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!ask.trim()) return;
    const r = parseRequest(ask);
    setChartId(r.chartId);
    if (r.range) setRange(r.range);
    setNotes(r.notes);
  }

  async function exportAll() {
    if (!chartAreaRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(chartAreaRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${chartTitle(chartId).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-export.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="si-page-title">Charts</h1>
          <p className="si-page-sub">{chartTitle(chartId)} · {range?.label ?? 'Full data'}</p>
        </div>
        <button
          type="button"
          onClick={exportAll}
          disabled={exporting}
          className="si-btn-secondary self-start"
        >
          <Download className="w-4 h-4" aria-hidden="true" />{exporting ? 'Exporting...' : 'Export PNG'}
        </button>
      </div>

      <form onSubmit={submitAsk} className="si-card p-4">
        <label htmlFor="ask-chart" className="sr-only">Describe the chart you want</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="ask-chart"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="Describe the chart you want..."
            className="si-input flex-1"
          />
          <button type="submit" className="si-btn-primary">
            <Send className="w-4 h-4" aria-hidden="true" />Generate
          </button>
        </div>
        {notes.length > 0 && <div className="text-xs text-gray-500 mt-2">{notes.join(' ')}</div>}
      </form>

      <div className="si-card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider mr-2">Chart</span>
          {CHARTS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChartId(c.id)}
              aria-pressed={chartId === c.id}
              className={`min-h-11 px-3 text-xs font-medium rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-baldor-primary ${
                chartId === c.id ? 'bg-baldor-primary text-white border-baldor-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >{c.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider mr-2">Range</span>
          {[
            { label: 'Last Week', fn: lastWeek },
            { label: 'Trailing 30', fn: trailing30 },
            { label: 'YTD', fn: ytd },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setRange(p.fn())}
              aria-pressed={range?.label === p.fn().label}
              className={`min-h-11 px-3 text-xs font-medium rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-baldor-primary ${
                range?.label === p.fn().label ? 'bg-baldor-primary text-white border-baldor-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      <div ref={chartAreaRef}>
        <ChartRouter chartId={chartId} range={range} />
      </div>
    </div>
  );
}
