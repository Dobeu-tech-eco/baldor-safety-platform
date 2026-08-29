import { useEffect, useState } from 'react';
import { supabase, Mileage } from '../lib/supabase';
import { BRANCH_ORDER } from '../lib/branches';

export default function MileagePage() {
  const [rows, setRows] = useState<Mileage[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from('mileage').select('*').eq('year', year).eq('month', month);
    setRows((data as Mileage[]) || []);
    const v: Record<string, string> = {};
    BRANCH_ORDER.forEach((b) => {
      const r = (data as Mileage[] || []).find((x) => x.branch === b);
      v[b] = r ? String(r.miles) : '';
    });
    setVals(v);
  }

  useEffect(() => { load(); }, [year, month]);

  async function save() {
    setSaving(true);
    const payload = BRANCH_ORDER.map((b) => ({
      branch: b, year, month, miles: parseInt(vals[b] || '0', 10) || 0,
    }));
    for (const p of payload) {
      const existing = rows.find((r) => r.branch === p.branch);
      if (existing) await supabase.from('mileage').update({ miles: p.miles }).eq('id', existing.id);
      else await supabase.from('mileage').insert(p);
    }
    setSaving(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mileage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monthly miles per branch for APMM (accidents ÷ miles × 1,000,000). Jurisdiction miles can also arrive via Upload.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex gap-3 mb-5">
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BRANCH_ORDER.map((b) => (
            <div key={b}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{b}</label>
              <input type="number" value={vals[b] ?? ''} onChange={(e) => setVals({ ...vals, [b]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Miles" />
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving}
          className="mt-5 px-4 py-2 bg-[#006838] text-white rounded-md hover:bg-[#00532d] disabled:opacity-50">
          {saving ? 'Saving...' : 'Save mileage'}
        </button>
      </div>
    </div>
  );
}
