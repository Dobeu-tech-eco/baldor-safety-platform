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

  const Card = ({ icon, label, value, accent }: { icon: JSX.Element; label: string; value: number; accent: string }) => (
    <div className="si-card p-5 hover:border-baldor-primary/40 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</div>
          <div className="text-3xl md:text-4xl font-semibold tabular-nums text-gray-900 mt-2">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1">Baldor Safety Insights</p>
          <h1 className="si-page-title">Dashboard</h1>
          <p className="si-page-sub">Year-to-date snapshot across the network</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="si-btn-secondary self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {lastSync ? `Synced ${format(lastSync, 'p')}` : 'Sync'}
        </button>
      </div>

      <form onSubmit={submitAsk} className="si-card p-4">
        <label htmlFor="ask-chart" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Ask for a chart</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="ask-chart"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="e.g. Show me YoY preventable with snow attribution"
            className="si-input flex-1"
          />
          <button type="submit" className="si-btn-primary">
            <Send className="w-4 h-4" aria-hidden="true" />Generate
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<Truck className="w-5 h-5 text-white" aria-hidden="true" />} label="Vehicle YTD" value={kpis.vehicle} accent="bg-baldor-primary" />
        <Card icon={<HeartPulse className="w-5 h-5 text-white" aria-hidden="true" />} label="Injuries YTD" value={kpis.injuries} accent="bg-baldor-navy" />
        <Card icon={<AlertTriangle className="w-5 h-5 text-white" aria-hidden="true" />} label="Unclassified" value={kpis.unclass} accent="bg-baldor-alert" />
        <Card icon={<FileCheck2 className="w-5 h-5 text-white" aria-hidden="true" />} label="Recent Batches" value={kpis.batches} accent="bg-baldor-purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PreventabilityPie />

        <div className="si-card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-baldor-cream/60">
            <h2 className="font-semibold text-gray-900">Recent uploads</h2>
          </div>
          <div className="divide-y divide-gray-200 overflow-x-auto">
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-gray-500">No uploads yet</p>
                <p className="text-xs text-gray-400 mt-1">Upload an incident export to start tracking</p>
              </div>
            ) : (
              recent.map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors min-w-[280px]">
                  <div>
                    <div className="font-medium text-gray-900">{b.filename}</div>
                    <div className="text-xs text-gray-500">{format(new Date(b.uploaded_at), 'PP p')}</div>
                  </div>
                  <div className="text-right text-xs text-gray-600">
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
