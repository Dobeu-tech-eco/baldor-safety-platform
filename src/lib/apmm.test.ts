import { describe, expect, it } from 'vitest';
import { computeApmm } from './apmm';

describe('computeApmm', () => {
  it('computes the known fixture rate', () => {
    expect(computeApmm(51.3, 1_000_000)).toBe(51.3);
    expect(computeApmm(10, 500_000)).toBe(20);
  });
  it('returns null when miles are 0', () => {
    expect(computeApmm(10, 0)).toBeNull();
  });
});
