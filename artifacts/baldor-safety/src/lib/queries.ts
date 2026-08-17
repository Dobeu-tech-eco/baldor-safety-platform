import { getIncidents, type Incident } from './api';
import { fmt } from './dates';

export async function fetchIncidents(opts: { from?: Date; to?: Date; branch?: string; includeFollowons?: boolean; }): Promise<Incident[]> {
  return getIncidents({
    from: opts.from ? fmt(opts.from) : undefined,
    to: opts.to ? fmt(opts.to) : undefined,
    branch: opts.branch,
    includeFollowons: opts.includeFollowons,
    order: 'asc',
  });
}

export function classify(row: Incident, foldPending = true): 'preventable' | 'nonpreventable' | 'pending' {
  if (row.preventable === 'Yes') return 'preventable';
  if (row.preventable === 'No') return 'nonpreventable';
  if (row.is_injury) return 'nonpreventable';
  if (foldPending) return 'preventable';
  return 'pending';
}
