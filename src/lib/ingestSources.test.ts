import * as XLSX from 'xlsx';
import { describe, expect, it, vi } from 'vitest';
import { detectSource } from './detectSource';

vi.mock('./supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({ select: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      upsert: async () => ({ error: null }),
    }),
  },
}));

import {
  UNRECOGNIZED_MESSAGE,
  parseMilesWorkbook,
  parseSamsaraWorkbook,
  readFirstSheetHeaders,
} from './ingestSources';

function workbookBuffer(aoa: unknown[][]): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  if (out instanceof ArrayBuffer) return out;
  if (out instanceof Uint8Array) {
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  }
  return Uint8Array.from(out as number[]).buffer;
}

describe('ingestSources', () => {
  it('exports the exact unrecognized message', () => {
    expect(UNRECOGNIZED_MESSAGE).toBe(
      'Unrecognized workbook. Expected one of: Incidents (Occurrence Number + Loss Date), Samsara Driver Safety (Driver Tag + Mobile Usage or Inattentive Driving), or Miles by Jurisdiction (Asset Tag Name + Distance).'
    );
  });

  it('reads headers and detects a Samsara workbook', () => {
    const buf = workbookBuffer([
      ['Driver Tag', 'Mobile Usage', 'Inattentive Driving', 'Drowsy', 'Harsh Brake', 'Harsh Turn', 'Harsh Accel', 'Rolling Stop', 'No Seat Belt'],
      ['New York', '2', '1', '0', '3', '0', '0', '1', '0'],
    ]);
    const headers = readFirstSheetHeaders(buf);
    expect(detectSource(headers)).toBe('samsara');
    const rows = parseSamsaraWorkbook(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].tag).toBe('New York');
    expect(rows[0].mobile_usage).toBe(2);
    expect(rows[0].inattentive_driving).toBe(1);
    expect(rows[0].harsh_brake).toBe(3);
    expect(rows[0].rolling_stop).toBe(1);
  });

  it('reads headers and detects a miles workbook', () => {
    const buf = workbookBuffer([
      ['Asset Tag Name', 'Start Time (Start)', 'Distance (mi)'],
      ['Boston', 'Jun 1 2026 12:00:00AM EDT', '1000'],
    ]);
    const headers = readFirstSheetHeaders(buf);
    expect(detectSource(headers)).toBe('mileage');
    const rows = parseMilesWorkbook(buf);
    expect(rows).toHaveLength(1);
    expect(rows[0].tag).toBe('Boston');
    expect(rows[0].year).toBe(2026);
    expect(rows[0].month).toBe(6);
    expect(rows[0].miles).toBe(1000);
  });

  it('skips preamble rows when finding the header', () => {
    const buf = workbookBuffer([
      ['Report Title'],
      ['Generated'],
      ['Asset Tag Name', 'Start Time (Start)', 'Distance (mi) (mi) [Sum]'],
      ['Philadelphia', 'Jul 15 2025 12:00:00AM EDT', '250.5'],
    ]);
    const headers = readFirstSheetHeaders(buf);
    expect(detectSource(headers)).toBe('mileage');
    expect(parseMilesWorkbook(buf)).toHaveLength(1);
  });
});
