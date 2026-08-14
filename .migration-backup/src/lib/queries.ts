import { supabase, Incident } from './supabase';
import { fmt } from './dates';

export async function fetchIncidents(opts: { from?: Date; to?: Date; branch?: string; includeFollowons?: boolean; }): Promise<Incident[]> {
  let q = supabase.from('incidents').select('*');
  if (!opts.includeFollowons) q = q.eq('is_followon', false);
  if (opts.from) q = q.gte('loss_date', fmt(opts.from));
  if (opts.to) q = q.lte('loss_date', fmt(opts.to));
  if (opts.branch) q = q.eq('branch', opts.branch);
  q = q.order('loss_date', { ascending: true });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

export function classify(row: Incident, foldPending = true): 'preventable' | 'nonpreventable' | 'pending' {
  if (row.preventable === 'Yes') return 'preventable';
  if (row.preventable === 'No') return 'nonpreventable';
  if (row.is_injury) return 'nonpreventable';
  if (foldPending) return 'preventable';
  return 'pending';
}
