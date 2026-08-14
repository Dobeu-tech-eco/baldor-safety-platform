export const BRANCH_ORDER = ['BNY', 'BMA', 'BPA', 'BDC'] as const;
export const BRANCH_LABELS: Record<string, string> = {
  BNY: 'Bronx HQ',
  BMA: 'Chelsea/Boston',
  BPA: 'Philadelphia',
  BDC: 'Lanham/DC',
  BFS: 'Other',
};

export function deriveBranch(location: string | null | undefined): string {
  if (!location) return '';
  const s = String(location).trim().toUpperCase();
  if (s.startsWith('BB')) return 'BMA';
  return s.slice(0, 3);
}

export function orderedBranches(branches: string[]): string[] {
  const set = new Set(branches);
  const ordered = BRANCH_ORDER.filter((b) => set.has(b));
  const extras = branches.filter((b) => !BRANCH_ORDER.includes(b as any)).sort();
  return [...ordered, ...extras];
}
