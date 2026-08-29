export const ACCIDENT_TYPES = [
  'Backing',
  'Sideswipe',
  'Rear-End',
  'Fixed Object',
  'Parked Vehicle',
  'Turning',
  'Overhead/Clearance',
  'Merge/Lane Change',
  'Equipment/Cargo',
  'Pedestrian/Cyclist',
  'Other',
] as const;

export type AccidentType = (typeof ACCIDENT_TYPES)[number];

const RULES: { type: AccidentType; pattern: RegExp }[] = [
  { type: 'Backing', pattern: /\bback(?:ing|ed|s)?\b/i },
  { type: 'Sideswipe', pattern: /\bsideswipe\b/i },
  { type: 'Rear-End', pattern: /\brear[-\s]?end/i },
  { type: 'Parked Vehicle', pattern: /\bparked\b/i },
  { type: 'Fixed Object', pattern: /\bfixed object\b|\bpole\b|\bguardrail\b/i },
  { type: 'Overhead/Clearance', pattern: /\boverhead\b|\bclearance\b/i },
  { type: 'Merge/Lane Change', pattern: /\bmerge\b|\blane change\b/i },
  { type: 'Equipment/Cargo', pattern: /\bequipment\b|\bcargo\b/i },
  { type: 'Pedestrian/Cyclist', pattern: /\bpedestrian\b|\bcyclist\b|\bbicycl/i },
  { type: 'Turning', pattern: /\bturn(?:ing|ed)?\b/i },
];

export function classifyAccidentType(description: string): AccidentType {
  const text = description ?? '';
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.type;
  }
  return 'Other';
}

export function isAutoFamilyRow(row: { is_followon: boolean; is_injury: boolean }): boolean {
  return !row.is_followon && !row.is_injury;
}

export function preventabilityClass(
  row: { preventable: string; is_injury: boolean },
  foldPending: boolean,
): 'preventable' | 'nonpreventable' | 'pending' {
  if (row.preventable === 'Yes') return 'preventable';
  if (row.preventable === 'No') return 'nonpreventable';
  if (row.is_injury) return 'nonpreventable';
  if (foldPending) return 'preventable';
  return 'pending';
}
