import { describe, expect, it } from 'vitest';
import { aggregateByType, aggregateYoyMatrix, aggregateApmmYearly } from './aggregate';

const base = { is_followon: false, is_injury: false, branch: 'BNY', preventable: 'Yes' };

describe('aggregateByType', () => {
  it('stacks preventable including pending and drops injuries', () => {
    const rows = [
      { ...base, event_description: 'backing into dock', preventable: 'Yes', loss_date: '2026-01-02' },
      { ...base, event_description: 'backing hit', preventable: '', loss_date: '2026-01-03' },
      { ...base, event_description: 'backing other car', preventable: 'No', loss_date: '2026-01-04' },
      { ...base, event_description: 'backing', is_injury: true, loss_date: '2026-01-05' },
    ];
    const bars = aggregateByType(rows);
    const backing = bars.find((b) => b.type === 'Backing');
    expect(backing).toEqual({ type: 'Backing', preventable: 2, nonPreventable: 1, total: 3 });
  });
});

describe('aggregateYoyMatrix', () => {
  it('compares like months across years', () => {
    const rows = [
      { ...base, event_description: 'backing', loss_date: '2025-01-10', preventable: 'Yes' },
      { ...base, event_description: 'backing', loss_date: '2026-01-11', preventable: 'Yes' },
      { ...base, event_description: 'backing', loss_date: '2026-01-12', preventable: 'Yes' },
    ];
    const matrix = aggregateYoyMatrix(rows, 2025, 2026, 1);
    const backing = matrix.find((r) => r.type === 'Backing');
    expect(backing?.months[0]).toEqual({ a: 1, b: 2 });
    expect(backing?.ytdA).toBe(1);
    expect(backing?.ytdB).toBe(2);
    expect(backing?.delta).toBe(1);
  });
});

describe('aggregateApmmYearly', () => {
  it('uses computeApmm per year', () => {
    const rows = [
      { ...base, event_description: 'backing', loss_date: '2026-03-01', preventable: 'Yes' },
      { ...base, event_description: 'sideswipe', loss_date: '2026-03-02', preventable: 'No' },
    ];
    const points = aggregateApmmYearly(rows, { 2026: 1_000_000 });
    expect(points[0].year).toBe(2026);
    expect(points[0].preventableApmm).toBe(1);
    expect(points[0].nonPreventableApmm).toBe(1);
    expect(points[0].totalApmm).toBe(2);
  });
});
