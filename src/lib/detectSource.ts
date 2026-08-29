export type SourceKind = 'incidents' | 'samsara' | 'mileage' | 'unrecognized';

function norm(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function detectSource(headers: string[]): SourceKind {
  const h = headers.map(norm);
  const has = (part: string) => h.some((x) => x.includes(part));
  if (has('occurrence number') && has('loss date')) return 'incidents';
  if (has('driver tag') && (has('mobile usage') || has('inattentive driving'))) return 'samsara';
  if (has('asset tag') && has('distance')) return 'mileage';
  return 'unrecognized';
}
