import { useCallback, useEffect, useMemo, useState } from 'react';
import PageBanner from '../components/PageBanner';
import FamilyApmm from '../charts/families/FamilyApmm';
import { fetchIncidents } from '../lib/queries';
import { ytd } from '../lib/dates';
import { Incident, Mileage, supabase } from '../lib/supabase';

export default function ApmmPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [mileage, setMileage] = useState<Mileage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const range = useMemo(() => ytd(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inc, ml] = await Promise.all([
        fetchIncidents({}),
        supabase.from('mileage').select('*'),
      ]);
      if (ml.error) throw new Error(ml.error.message);
      setIncidents(inc);
      setMileage((ml.data as Mileage[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load APMM data');
      setIncidents([]);
      setMileage([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">APMM</h1>
        <p className="text-sm text-gray-500 mt-1">Accidents per million miles — yearly and quarterly</p>
      </div>

      {error && <PageBanner kind="error" text={error} />}
      {!error && !loading && incidents.length === 0 && (
        <PageBanner kind="empty" text="No incident data yet. Upload incidents and enter mileage to compute APMM." to="/upload" />
      )}
      {!error && !loading && incidents.length > 0 && mileage.length === 0 && (
        <PageBanner kind="empty" text="Mileage is required for APMM. Enter miles on the Mileage page or upload a jurisdiction miles file." to="/upload" />
      )}
      {!error && incidents.length > 0 && mileage.length > 0 && (
        <FamilyApmm incidents={incidents} mileage={mileage} range={range} branch="all" />
      )}
    </div>
  );
}
