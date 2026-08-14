import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { supabase, Incident } from '../lib/supabase';

export default function Unclassified() {
  const [rows, setRows] = useState<Incident[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('incidents').select('*').eq('is_followon', false).eq('is_injury', false);
      const list = (data as Incident[]) || [];
      setRows(list.filter((i) => i.preventable !== 'Yes' && i.preventable !== 'No'));
    })();
  }, []);

  function exportCsv() {
    const headers = ['Occurrence', 'Date', 'Branch', 'Type', 'Employee', 'Location', 'Description'];
    const lines = [headers.join(',')];
    rows.forEach((r) => {
      const fields = [r.occurrence_number, r.loss_date, r.branch, r.incident_type, r.employee, r.location, r.event_description]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`);
      lines.push(fields.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'unclassified.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ChartCard
      title="Unclassified Vehicle Incidents"
      caption={`${rows.length} incidents awaiting Yes/No preventability`}
      controls={
        <button type="button" onClick={exportCsv} className="btn-secondary min-h-[36px] text-[11px] px-3">
          <Download className="w-3.5 h-3.5" />Export CSV
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-panel">
            <tr className="text-left text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-3 py-2">Occurrence</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Branch</th>
              <th className="px-3 py-2">Type</th><th className="px-3 py-2">Employee</th><th className="px-3 py-2">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hair">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-cream-panel">
                <td className="px-3 py-2 font-mono text-xs">{r.occurrence_number}</td>
                <td className="px-3 py-2">{r.loss_date}</td>
                <td className="px-3 py-2">{r.branch}</td>
                <td className="px-3 py-2">{r.incident_type}</td>
                <td className="px-3 py-2">{r.employee}</td>
                <td className="px-3 py-2 text-ink-muted">{r.location}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-ink-muted">All vehicle incidents are classified.</td></tr>}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
