import { describe, expect, it } from 'vitest';
import { mapTagToBranch, DEFAULT_TAG_MAPS } from './tagMap';

describe('mapTagToBranch', () => {
  it('maps the four known tags', () => {
    expect(mapTagToBranch('New York', DEFAULT_TAG_MAPS)).toBe('BNY');
    expect(mapTagToBranch('Boston', DEFAULT_TAG_MAPS)).toBe('BMA');
    expect(mapTagToBranch('Philly', DEFAULT_TAG_MAPS)).toBe('BPA');
    expect(mapTagToBranch('Philadelphia', DEFAULT_TAG_MAPS)).toBe('BPA');
    expect(mapTagToBranch('DC', DEFAULT_TAG_MAPS)).toBe('BDC');
  });
  it('returns null for unknown tags', () => {
    expect(mapTagToBranch('Yard Jockeys', DEFAULT_TAG_MAPS)).toBeNull();
  });
});
