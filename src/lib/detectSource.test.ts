import { describe, expect, it } from 'vitest';
import { detectSource } from './detectSource';

describe('detectSource', () => {
  it('detects incidents', () => {
    expect(detectSource(['Occurrence Number', 'Loss Date', 'Employee'])).toBe('incidents');
  });
  it('detects samsara', () => {
    expect(detectSource(['Driver Tag', 'Mobile Usage', 'Inattentive Driving'])).toBe('samsara');
  });
  it('detects mileage', () => {
    expect(detectSource(['Asset Tag Name', 'Distance (mi) (mi) [Sum]'])).toBe('mileage');
  });
  it('rejects unknown sheets', () => {
    expect(detectSource(['Foo', 'Bar'])).toBe('unrecognized');
  });
});
