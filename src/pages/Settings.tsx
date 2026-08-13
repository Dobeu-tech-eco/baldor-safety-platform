import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase, Override, SnowEvent, AppUser } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function Settings() {
  const { profile } = useAuth();
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [snow, setSnow] = useState<SnowEvent[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  const [ovOcc, setOvOcc] = useState('');
  const [ovVal, setOvVal] = useState('Yes');
  const [ovNote, setOvNote] = useState('');

  const [snowYear, setSnowYear] = useState(2026);
  const [snowMonth, setSnowMonth] = useState(1);
  const [snowCount, setSnowCount] = useState(0);

  async function load() {
    const { data: o } = await supabase.from('overrides').select('*').order('occurrence_number');
    const { data: s } = await supabase.from('snow_events').select('*').order('year').order('month');
    const { data: u } = await supabase.from('app_users').select('*').order('email');
    setOverrides((o as Override[]) || []);
    setSnow((s as SnowEvent[]) || []);
    setUsers((u as AppUser[]) || []);
  }
  useEffect(() => { load(); }, []);

  async function addOverride() {
    if (!ovOcc.trim()) return;
    await supabase.from('overrides').upsert({ occurrence_number: ovOcc.trim(), preventable: ovVal, note: ovNote }, { onConflict: 'occurrence_number' });
    setOvOcc(''); setOvNote(''); load();
  }
  async function removeOverride(id: string) { await supabase.from('overrides').delete().eq('id', id); load(); }

  async function addSnow() {
    await supabase.from('snow_events').insert({ year: snowYear, month: snowMonth, attributable_count: snowCount, note: '' });
    setSnowCount(0); load();
  }
  async function removeSnow(id: string) { await supabase.from('snow_events').delete().eq('id', id); load(); }

  async function toggleAdmin(u: AppUser) {
    await supabase.from('app_users').update({ is_admin: !u.is_admin }).eq('id', u.id);
    load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="si-page-title">Settings</h1>
        <p className="si-page-sub">Overrides, snow attribution, and admin</p>
      </div>

      <section className="si-card">
        <div className="px-5 py-3 border-b border-gray-200 bg-baldor-cream/60">
          <h2 className="font-semibold text-gray-900">Preventability overrides</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <label htmlFor="override-occ" className="sr-only">Occurrence number</label>
            <input
              id="override-occ"
              value={ovOcc}
              onChange={(e) => setOvOcc(e.target.value)}
              placeholder="Occurrence number"
              className="si-input flex-1 min-w-[200px] text-sm"
            />
            <label htmlFor="override-val" className="sr-only">Preventable</label>
            <select
              id="override-val"
              value={ovVal}
              onChange={(e) => setOvVal(e.target.value)}
              className="si-select"
            >
              <option>Yes</option><option>No</option>
            </select>
            <label htmlFor="override-note" className="sr-only">Note</label>
            <input
              id="override-note"
              value={ovNote}
              onChange={(e) => setOvNote(e.target.value)}
              placeholder="Note (optional)"
              className="si-input flex-1 min-w-[160px] text-sm"
            />
            <button type="button" onClick={addOverride} className="si-btn-primary text-sm">Add</button>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
            {overrides.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div><span className="font-mono">{o.occurrence_number}</span> <span className="ml-2 text-gray-600">→ {o.preventable}</span> {o.note && <span className="ml-2 text-xs text-gray-500">{o.note}</span>}</div>
                <button type="button" onClick={() => removeOverride(o.id)} aria-label={`Remove override ${o.occurrence_number}`} className="min-h-touch min-w-touch inline-flex items-center justify-center text-gray-400 hover:text-baldor-alert">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            {!overrides.length && <div className="px-3 py-4 text-sm text-gray-500">No overrides.</div>}
          </div>
        </div>
      </section>

      <section className="si-card">
        <div className="px-5 py-3 border-b border-gray-200 bg-baldor-cream/60">
          <h2 className="font-semibold text-gray-900">Snow attribution</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <label htmlFor="snow-year" className="sr-only">Year</label>
            <input id="snow-year" type="number" value={snowYear} onChange={(e) => setSnowYear(parseInt(e.target.value, 10))} className="si-input w-24 text-sm" />
            <label htmlFor="snow-month" className="sr-only">Month</label>
            <select id="snow-month" value={snowMonth} onChange={(e) => setSnowMonth(parseInt(e.target.value, 10))} className="si-select">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <label htmlFor="snow-count" className="sr-only">Count</label>
            <input id="snow-count" type="number" value={snowCount} onChange={(e) => setSnowCount(parseInt(e.target.value, 10))} placeholder="Count" className="si-input w-32 text-sm" />
            <button type="button" onClick={addSnow} className="si-btn-primary text-sm">Add</button>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
            {snow.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>{s.year}-{String(s.month).padStart(2, '0')} → <span className="font-medium">{s.attributable_count}</span></div>
                <button type="button" onClick={() => removeSnow(s.id)} aria-label={`Remove snow event ${s.year}-${String(s.month).padStart(2, '0')}`} className="min-h-touch min-w-touch inline-flex items-center justify-center text-gray-400 hover:text-baldor-alert">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            {!snow.length && <div className="px-3 py-4 text-sm text-gray-500">No snow events.</div>}
          </div>
        </div>
      </section>

      {profile?.is_admin && (
        <section className="si-card">
          <div className="px-5 py-3 border-b border-gray-200 bg-baldor-cream/60">
            <h2 className="font-semibold text-gray-900">Users</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {users.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{u.email}</div>
                  {u.is_admin && <div className="text-xs text-baldor-primary font-semibold">Admin</div>}
                </div>
                <button type="button" onClick={() => toggleAdmin(u)} className="si-btn-secondary text-xs">
                  {u.is_admin ? 'Revoke admin' : 'Make admin'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
