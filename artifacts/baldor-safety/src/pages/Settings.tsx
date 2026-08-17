import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, type Override, type SnowEvent, type AppUser } from '../lib/api';
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
  const [newEmail, setNewEmail] = useState('');

  async function load() {
    const [o, s] = await Promise.all([
      api<Override[]>('/overrides'),
      api<SnowEvent[]>('/snow-events'),
    ]);
    setOverrides(o);
    setSnow(s);
    if (profile?.is_admin) {
      try {
        setUsers(await api<AppUser[]>('/users'));
      } catch {
        setUsers([]);
      }
    }
  }
  useEffect(() => { load(); }, [profile?.is_admin]);

  async function addOverride() {
    if (!ovOcc.trim()) return;
    await api('/overrides', {
      method: 'POST',
      body: JSON.stringify({ occurrence_number: ovOcc.trim(), preventable: ovVal, note: ovNote }),
    });
    setOvOcc(''); setOvNote(''); load();
  }
  async function removeOverride(id: string) { await api(`/overrides/${id}`, { method: 'DELETE' }); load(); }

  async function addSnow() {
    await api('/snow-events', {
      method: 'POST',
      body: JSON.stringify({ year: snowYear, month: snowMonth, attributable_count: snowCount, note: '' }),
    });
    setSnowCount(0); load();
  }
  async function removeSnow(id: string) { await api(`/snow-events/${id}`, { method: 'DELETE' }); load(); }

  async function toggleAdmin(u: AppUser) {
    await api(`/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ is_admin: !u.is_admin }) });
    load();
  }

  async function addAllowedEmail() {
    if (!newEmail.trim()) return;
    await api('/users', { method: 'POST', body: JSON.stringify({ email: newEmail.trim() }) });
    setNewEmail('');
    load();
  }

  async function toggleAllowed(u: AppUser) {
    await api(`/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ allowlisted: !u.allowlisted }) });
    load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Overrides, snow attribution, and admin</p>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Preventability overrides</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input value={ovOcc} onChange={(e) => setOvOcc(e.target.value)} placeholder="Occurrence number"
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <select value={ovVal} onChange={(e) => setOvVal(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option>Yes</option><option>No</option>
            </select>
            <input value={ovNote} onChange={(e) => setOvNote(e.target.value)} placeholder="Note (optional)"
              className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <button onClick={addOverride} className="px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d] text-sm">Add</button>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto border border-gray-200 rounded">
            {overrides.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div><span className="font-mono">{o.occurrence_number}</span> <span className="ml-2 text-gray-600">→ {o.preventable}</span> {o.note && <span className="ml-2 text-xs text-gray-500">{o.note}</span>}</div>
                <button onClick={() => removeOverride(o.id)} className="text-gray-400 hover:text-[#C0392B]"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {!overrides.length && <div className="px-3 py-4 text-sm text-gray-500">No overrides.</div>}
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Snow attribution</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input type="number" value={snowYear} onChange={(e) => setSnowYear(parseInt(e.target.value, 10))} className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <select value={snowMonth} onChange={(e) => setSnowMonth(parseInt(e.target.value, 10))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <input type="number" value={snowCount} onChange={(e) => setSnowCount(parseInt(e.target.value, 10))} placeholder="Count" className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <button onClick={addSnow} className="px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d] text-sm">Add</button>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto border border-gray-200 rounded">
            {snow.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>{s.year}-{String(s.month).padStart(2, '0')} → <span className="font-medium">{s.attributable_count}</span></div>
                <button onClick={() => removeSnow(s.id)} className="text-gray-400 hover:text-[#C0392B]"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {!snow.length && <div className="px-3 py-4 text-sm text-gray-500">No snow events.</div>}
          </div>
        </div>
      </section>

      {profile?.is_admin && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Users & access list</h2>
          </div>
          <div className="p-5 pb-0 flex gap-2">
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email to allow"
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <button onClick={addAllowedEmail}
              className="px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d] text-sm">Allow access</button>
          </div>
          <div className="divide-y divide-gray-200 mt-4">
            {users.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{u.email}</div>
                  <div className="text-xs">
                    {u.is_admin && <span className="text-[#8DC63F] mr-2">Admin</span>}
                    {u.allowlisted
                      ? <span className="text-gray-500">Access granted</span>
                      : <span className="text-amber-600">Access pending</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleAllowed(u)} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    {u.allowlisted ? 'Revoke access' : 'Grant access'}
                  </button>
                  <button onClick={() => toggleAdmin(u)} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    {u.is_admin ? 'Revoke admin' : 'Make admin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
