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
        <p className="t-eyebrow mb-1">Admin</p>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Overrides, snow attribution, and admin</p>
      </div>

      <section className="card-surface">
        <div className="card-header-bar">
          <h2 className="t-headline text-lg text-ink-true">Preventability overrides</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input value={ovOcc} onChange={(e) => setOvOcc(e.target.value)} placeholder="Occurrence number"
              className="field flex-1 min-w-[200px]" />
            <select value={ovVal} onChange={(e) => setOvVal(e.target.value)} className="field w-auto">
              <option>Yes</option><option>No</option>
            </select>
            <input value={ovNote} onChange={(e) => setOvNote(e.target.value)} placeholder="Note (optional)"
              className="field flex-1 min-w-[160px]" />
            <button type="button" onClick={addOverride} className="btn-primary">Add</button>
          </div>
          <div className="divide-y divide-hair max-h-64 overflow-y-auto border border-hair rounded-sm">
            {overrides.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div><span className="font-mono">{o.occurrence_number}</span> <span className="ml-2 text-ink-muted">→ {o.preventable}</span> {o.note && <span className="ml-2 text-xs text-ink-muted">{o.note}</span>}</div>
                <button type="button" onClick={() => removeOverride(o.id)} className="text-ink-muted hover:text-danger min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Remove override">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!overrides.length && <div className="px-3 py-4 text-sm text-ink-muted">No overrides.</div>}
          </div>
        </div>
      </section>

      <section className="card-surface">
        <div className="card-header-bar">
          <h2 className="t-headline text-lg text-ink-true">Snow attribution</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input type="number" value={snowYear} onChange={(e) => setSnowYear(parseInt(e.target.value, 10))} className="field w-24" aria-label="Snow year" />
            <select value={snowMonth} onChange={(e) => setSnowMonth(parseInt(e.target.value, 10))} className="field w-auto" aria-label="Snow month">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <input type="number" value={snowCount} onChange={(e) => setSnowCount(parseInt(e.target.value, 10))} placeholder="Count" className="field w-32" aria-label="Attributable count" />
            <button type="button" onClick={addSnow} className="btn-primary">Add</button>
          </div>
          <div className="divide-y divide-hair max-h-64 overflow-y-auto border border-hair rounded-sm">
            {snow.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>{s.year}-{String(s.month).padStart(2, '0')} → <span className="font-medium">{s.attributable_count}</span></div>
                <button type="button" onClick={() => removeSnow(s.id)} className="text-ink-muted hover:text-danger min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Remove snow event">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!snow.length && <div className="px-3 py-4 text-sm text-ink-muted">No snow events.</div>}
          </div>
        </div>
      </section>

      {profile?.is_admin && (
        <section className="card-surface">
          <div className="card-header-bar">
            <h2 className="t-headline text-lg text-ink-true">Users</h2>
          </div>
          <div className="divide-y divide-hair">
            {users.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-ink-true">{u.email}</div>
                  {u.is_admin && <div className="chip-admin mt-1">Admin</div>}
                </div>
                <button type="button" onClick={() => toggleAdmin(u)} className="btn-secondary min-h-[36px] text-[11px]">
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
