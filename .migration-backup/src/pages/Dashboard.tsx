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
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Year-to-date snapshot across the network</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {lastSync ? `Synced ${format(lastSync, 'p')}` : 'Sync'}
        </button>
      </div>

      <form onSubmit={submitAsk} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Ask for a chart</label>
        <div className="flex gap-2">
          <input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="e.g. Show me YoY preventable with snow attribution"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#006838]" />
          <button type="submit" className="px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d] flex items-center gap-2">
            <Send className="w-4 h-4" />Generate
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card icon={<Truck className="w-5 h-5 text-white" />} label="Vehicle YTD" value={kpis.vehicle} accent="bg-[#006838]" />
        <Card icon={<HeartPulse className="w-5 h-5 text-white" />} label="Injuries YTD" value={kpis.injuries} accent="bg-[#1F4E79]" />
        <Card icon={<AlertTriangle className="w-5 h-5 text-white" />} label="Unclassified" value={kpis.unclass} accent="bg-[#C0392B]" />
        <Card icon={<FileCheck2 className="w-5 h-5 text-white" />} label="Recent Batches" value={kpis.batches} accent="bg-[#7B2D8E]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PreventabilityPie />

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Recent uploads</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No uploads yet</p>
                <p className="text-xs text-gray-400 mt-1">Upload an incident export to start tracking</p>
              </div>
            ) : (
              recent.map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors">
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
