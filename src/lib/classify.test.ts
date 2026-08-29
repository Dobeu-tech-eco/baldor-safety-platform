import { describe, expect, it } from 'vitest';
import { classifyAccidentType, isAutoFamilyRow, preventabilityClass } from './classify';

describe('classifyAccidentType', () => {
  it('classifies backing from description', () => {
    expect(classifyAccidentType('Driver was backing into the dock')).toBe('Backing');
  });
  it('classifies sideswipe', () => {
    expect(classifyAccidentType('Sideswipe while changing lanes')).toBe('Sideswipe');
  });
  it('prefers backing over other when both appear (maneuver-first)', () => {
    expect(classifyAccidentType('Backing into a parked vehicle')).toBe('Backing');
  });
  it('maps unknown text to Other', () => {
    expect(classifyAccidentType('Mysterious incident')).toBe('Other');
  });
  it('classifies rear-end, fixed object, parked, turning, overhead, merge, cargo, pedestrian', () => {
    expect(classifyAccidentType('rear-ended the car ahead')).toBe('Rear-End');
    expect(classifyAccidentType('struck a fixed object pole')).toBe('Fixed Object');
    expect(classifyAccidentType('hit a parked vehicle')).toBe('Parked Vehicle');
    expect(classifyAccidentType('turning left at the light')).toBe('Turning');
    expect(classifyAccidentType('overhead clearance strike')).toBe('Overhead/Clearance');
    expect(classifyAccidentType('merge / lane change contact')).toBe('Merge/Lane Change');
    expect(classifyAccidentType('equipment/cargo shift')).toBe('Equipment/Cargo');
    expect(classifyAccidentType('pedestrian / cyclist')).toBe('Pedestrian/Cyclist');
  });
});

describe('isAutoFamilyRow', () => {
  it('drops follow-ons and injuries', () => {
    expect(isAutoFamilyRow({ is_followon: true, is_injury: false })).toBe(false);
    expect(isAutoFamilyRow({ is_followon: false, is_injury: true })).toBe(false);
    expect(isAutoFamilyRow({ is_followon: false, is_injury: false })).toBe(true);
  });
});

describe('preventabilityClass', () => {
  it('folds pending into preventable when foldPending is true', () => {
    expect(preventabilityClass({ preventable: '', is_injury: false }, true)).toBe('preventable');
  });
  it('returns pending when foldPending is false', () => {
    expect(preventabilityClass({ preventable: '', is_injury: false }, false)).toBe('pending');
  });
  it('maps Yes and No', () => {
    expect(preventabilityClass({ preventable: 'Yes', is_injury: false }, true)).toBe('preventable');
    expect(preventabilityClass({ preventable: 'No', is_injury: false }, true)).toBe('nonpreventable');
  });
});
