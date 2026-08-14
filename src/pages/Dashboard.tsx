import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, HeartPulse, AlertTriangle, FileCheck2, Send, RefreshCw, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase, Incident, UploadBatch } from '../lib/supabase';
import { classify } from '../lib/queries';
import PreventabilityPie from '../charts/PreventabilityPie';

export default function Dashboard() {
  const [kpis, setKpis] = useState({ vehicle: 0, injuries: 0, unclass: 0, batches: 0 });
  const [recent, setRecent] = useState<UploadBatch[]>([]);
  const [ask, setAsk] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false);
    const { data: batches } = await supabase.from('upload_batches').select('*').order('uploaded_at', { ascending: false }).limit(5);
    const incidents = (inc as Incident[]) || [];
    const year = new Date().getFullYear();
    const ytd = incidents.filter((i) => i.loss_date && new Date(i.loss_date).getFullYear() === year);
    const vehicle = ytd.filter((i) => !i.is_injury);
    const injuries = ytd.filter((i) => i.is_injury);
    const unclass = vehicle.filter((i) => classify(i, false) === 'pending').length;
    setKpis({ vehicle: vehicle.length, injuries: injuries.length, unclass, batches: batches?.length ?? 0 });
    setRecent((batches as UploadBatch[]) || []);
    setLastSync(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function submitAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!ask.trim()) return;
    navigate(`/charts?q=${encodeURIComponent(ask)}`);
  }

  const Card = ({ icon, label, value }: { icon: JSX.Element; label: string; value: number }) => (
    <div className="card-surface p-6 hover:border-lime transition-all duration-150">
      <div className="flex items-start justify-between mb-4">
        <div className="t-eyebrow leading-snug max-w-[80%]">{label}</div>
        <div className="w-8 h-8 rounded-lg bg-cream-panel flex items-center justify-center shrink-0">{icon}</div>
      </div>
      <div className="t-headline text-5xl text-lime tabular-nums leading-none">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="t-eyebrow mb-1">Year to date</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Network snapshot across vehicle and injury incidents</p>
        </div>
        <button type="button" onClick={load} className="btn-secondary">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {lastSync ? `Synced ${format(lastSync, 'p')}` : 'Sync'}
        </button>
      </div>

      <form onSubmit={submitAsk} className="card-surface p-4">
        <label htmlFor="ask-chart" className="t-eyebrow block mb-2">Ask for a chart</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="ask-chart"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="e.g. Show me YoY preventable with snow attribution"
            className="field flex-1"
          />
          <button type="submit" className="btn-lime shrink-0">
            <Send className="w-4 h-4" />Generate
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<Truck className="w-4 h-4 text-ink-muted" />} label="Vehicle YTD" value={kpis.vehicle} />
        <Card icon={<HeartPulse className="w-4 h-4 text-ink-muted" />} label="Injuries YTD" value={kpis.injuries} />
        <Card icon={<AlertTriangle className="w-4 h-4 text-ink-muted" />} label="Unclassified" value={kpis.unclass} />
        <Card icon={<FileCheck2 className="w-4 h-4 text-ink-muted" />} label="Recent Batches" value={kpis.batches} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PreventabilityPie />

        <div className="card-surface">
          <div className="card-header-bar">
            <h2 className="t-headline text-lg text-ink-true">Recent uploads</h2>
          </div>
          <div className="divide-y divide-hair">
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <BarChart3 className="w-8 h-8 text-hair mx-auto mb-2" />
                <p className="text-sm text-ink-muted">No uploads yet</p>
                <p className="text-xs text-ink-muted/80 mt-1">Upload an incident export to start tracking</p>
              </div>
            ) : (
              recent.map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between text-sm hover:bg-cream-panel transition-colors">
                  <div>
                    <div className="font-medium text-ink-true">{b.filename}</div>
                    <div className="text-xs text-ink-muted">{format(new Date(b.uploaded_at), 'PP p')}</div>
                  </div>
                  <div className="text-right text-xs text-ink-muted">
                    <div>{b.row_count} rows</div>
                    <div>{b.follow_on_removed} follow-ons removed</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
