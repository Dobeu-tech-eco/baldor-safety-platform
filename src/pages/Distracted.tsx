import { useCallback, useEffect, useMemo, useState } from 'react';
import PageBanner from '../components/PageBanner';
import FamilyDistracted from '../charts/families/FamilyDistracted';
import { fetchIncidents } from '../lib/queries';
import { ytd } from '../lib/dates';
import { Incident, SamsaraTagSummary, supabase } from '../lib/supabase';

export default function Distracted() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [samsara, setSamsara] = useState<SamsaraTagSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const range = useMemo(() => ytd(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inc, sam] = await Promise.all([
        fetchIncidents({}),
        supabase.from('samsara_tag_summaries').select('*'),
      ]);
      if (sam.error) throw new Error(sam.error.message);
      setIncidents(inc);
      setSamsara((sam.data as SamsaraTagSummary[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load distracted-driving data');
      setIncidents([]);
      setSamsara([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Distracted</h1>
        <p className="text-sm text-gray-500 mt-1">Samsara coaching behaviors for accident-involved drivers</p>
      </div>

      {error && <PageBanner kind="error" text={error} />}
      {!error && !loading && incidents.length === 0 && samsara.length === 0 && (
        <PageBanner
          kind="empty"
          text="No incidents or Samsara summaries yet. Upload Origami and a Samsara Driver Safety Report."
          to="/upload"
        />
      )}
      {!error && (incidents.length > 0 || samsara.length > 0) && (
        <FamilyDistracted incidents={incidents} samsara={samsara} range={range} branch="all" />
      )}
    </div>
  );
}
