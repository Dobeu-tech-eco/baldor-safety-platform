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
        <h1 className="si-page-title">Mileage</h1>
        <p className="si-page-sub">Monthly miles per branch for APMM calculation</p>
      </div>

      <div className="si-card p-5">
        <div className="flex gap-3 mb-5">
          <label htmlFor="mileage-year" className="sr-only">Year</label>
          <select
            id="mileage-year"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="si-select"
          >
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <label htmlFor="mileage-month" className="sr-only">Month</label>
          <select
            id="mileage-month"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="si-select"
          >
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BRANCH_ORDER.map((b) => (
            <div key={b}>
              <label htmlFor={`miles-${b}`} className="block text-sm font-medium text-gray-700 mb-1">{b}</label>
              <input
                id={`miles-${b}`}
                type="number"
                value={vals[b] ?? ''}
                onChange={(e) => setVals({ ...vals, [b]: e.target.value })}
                className="si-input w-full"
                placeholder="Miles"
              />
            </div>
          ))}
        </div>
        <button type="button" onClick={save} disabled={saving} className="si-btn-primary mt-5">
          {saving ? 'Saving...' : 'Save mileage'}
        </button>
      </div>
    </div>
  );
}
