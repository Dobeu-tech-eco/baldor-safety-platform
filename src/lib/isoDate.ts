/** Parse a date-only `YYYY-MM-DD` string as UTC midnight. */
export function parseIsoDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s).trim());
  if (!m) {
    const fallback = new Date(s);
    if (isNaN(fallback.getTime())) throw new Error(`Invalid ISO date: ${s}`);
    return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate()));
  }
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function utcYmdKey(d: Date): number {
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

/**
 * True if `lossDate` (YYYY-MM-DD) falls on a UTC calendar day within [from, to].
 * Range endpoints are compared by their local calendar Y-M-D so date-picker /
 * date-fns local midnights align with ISO date-only strings in every timezone.
 */
export function inRange(lossDate: string | null, from: Date, to: Date): boolean {
  if (!lossDate) return false;
  let loss: Date;
  try {
    loss = parseIsoDate(lossDate);
  } catch {
    return false;
  }
  const lossKey = utcYmdKey(loss);
  const fromKey = from.getFullYear() * 10000 + (from.getMonth() + 1) * 100 + from.getDate();
  const toKey = to.getFullYear() * 10000 + (to.getMonth() + 1) * 100 + to.getDate();
  return lossKey >= fromKey && lossKey <= toKey;
}
