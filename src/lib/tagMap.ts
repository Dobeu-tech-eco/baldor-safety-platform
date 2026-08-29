export type TagBranchMap = { tag_pattern: string; branch: string };

export const DEFAULT_TAG_MAPS: TagBranchMap[] = [
  { tag_pattern: 'new york', branch: 'BNY' },
  { tag_pattern: 'boston', branch: 'BMA' },
  { tag_pattern: 'philadelphia', branch: 'BPA' },
  { tag_pattern: 'philly', branch: 'BPA' },
  { tag_pattern: 'dc', branch: 'BDC' },
];

export function mapTagToBranch(tag: string, maps: TagBranchMap[] = DEFAULT_TAG_MAPS): string | null {
  const t = tag.toLowerCase();
  for (const m of maps) {
    if (t.includes(m.tag_pattern.toLowerCase())) return m.branch;
  }
  return null;
}
