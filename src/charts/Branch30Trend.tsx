import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Square } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { BRANCH_ORDER, BRANCH_LABELS } from '../lib/branches';
import { supabase, Incident } from '../lib/supabase';
import { addDays } from 'date-fns';

type Row = { branch: string; current: number; prior: number; delta: number };

export default function Branch30Trend() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data: inc } = await supabase.from('incidents').select('*').eq('is_followon', false);
      const incidents = (inc as Incident[]) || [];
      const today = new Date();
      const cutCurrent = addDays(today, -30);
      const cutPrior = addDays(today, -60);
      const r = BRANCH_ORDER.map((b) => {
        const current = incidents.filter((i) => {
          if (i.branch !== b || !i.loss_date) return false;
          const d = new Date(i.loss_date);
          return d >= cutCurrent && d <= today;
        }).length;
        const prior = incidents.filter((i) => {
          if (i.branch !== b || !i.loss_date) return false;
          const d = new Date(i.loss_date);
          return d >= cutPrior && d < cutCurrent;
        }).length;
        return { branch: b, current, prior, delta: current - prior };
      });
      setRows(r);
    })();
  }, []);

  return (
    <ChartCard title="Branch 30-Day Trend" caption="Last 30 days vs prior 30 days">
      <div className="divide-y divide-hair">
        <div className="grid grid-cols-12 text-xs font-semibold text-ink-muted uppercase tracking-wider py-2">
          <div className="col-span-4">Branch</div>
          <div className="col-span-2 text-right">Last 30</div>
          <div className="col-span-2 text-right">Prior 30</div>
          <div className="col-span-2 text-right">Change</div>
          <div className="col-span-2 text-center">Trend</div>
        </div>
        {rows.map((r) => {
          const icon = r.delta > 0 ? <ArrowUp className="w-4 h-4 text-danger" /> :
                       r.delta < 0 ? <ArrowDown className="w-4 h-4 text-brand-print" /> :
                       <Square className="w-4 h-4 text-ink-muted" />;
          return (
            <div key={r.branch} className="grid grid-cols-12 items-center py-3 text-sm">
              <div className="col-span-4 font-medium text-ink-true">{r.branch} <span className="text-ink-muted text-xs">{BRANCH_LABELS[r.branch]}</span></div>
              <div className="col-span-2 text-right">{r.current}</div>
              <div className="col-span-2 text-right text-ink-muted">{r.prior}</div>
              <div className={`col-span-2 text-right font-semibold ${r.delta > 0 ? 'text-danger' : r.delta < 0 ? 'text-brand-print' : 'text-ink-muted'}`}>{r.delta > 0 ? '+' : ''}{r.delta}</div>
              <div className="col-span-2 flex justify-center">{icon}</div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
