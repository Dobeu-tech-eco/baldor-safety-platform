import { describe, expect, it } from 'vitest';
import { inRange, parseIsoDate } from './isoDate';

describe('parseIsoDate', () => {
  it('parses YYYY-MM-DD as UTC midnight', () => {
    const d = parseIsoDate('2026-01-01');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(1);
    expect(d.getUTCHours()).toBe(0);
  });
});

describe('inRange', () => {
  it('includes 2026-01-01 in YTD from local Jan 1 through Aug 29', () => {
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 7, 29);
    expect(inRange('2026-01-01', from, to)).toBe(true);
  });

  it('returns false for null loss_date', () => {
    expect(inRange(null, new Date(2026, 0, 1), new Date(2026, 7, 29))).toBe(false);
  });

  it('excludes dates outside the range', () => {
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 7, 29);
    expect(inRange('2025-12-31', from, to)).toBe(false);
    expect(inRange('2026-08-30', from, to)).toBe(false);
  });
});
