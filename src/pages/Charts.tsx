import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Charts</h1>
        <p className="text-sm text-gray-500 mt-1">{chartTitle(chartId)} · {range?.label ?? 'Full data'}</p>
      </div>

      <form onSubmit={submitAsk} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex gap-2">
          <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Describe the chart you want..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006838]" />
          <button type="submit" className="px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d] flex items-center gap-2">
            <Send className="w-4 h-4" />Generate
          </button>
        </div>
        {notes.length > 0 && <div className="text-xs text-gray-500 mt-2">{notes.join(' ')}</div>}
      </form>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider mr-2">Chart</span>
          {CHARTS.map((c) => (
            <button key={c.id} onClick={() => setChartId(c.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                chartId === c.id ? 'bg-[#006838] text-white border-[#006838]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>{c.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider mr-2">Range</span>
          {[
            { label: 'Last Week', fn: lastWeek },
            { label: 'Trailing 30', fn: trailing30 },
            { label: 'YTD', fn: ytd },
          ].map((p) => (
            <button key={p.label} onClick={() => setRange(p.fn())}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                range?.label === p.fn().label ? 'bg-[#006838] text-white border-[#006838]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      <ChartRouter chartId={chartId} range={range} />
    </div>
  );
}
