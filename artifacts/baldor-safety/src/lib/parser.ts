import { trailing30, ytd, lastWeek, monthRange, DateRange } from './dates';
import { subDays, parseISO } from 'date-fns';

export type ChartId =
  | 'network-yoy-snow' | 'network-yoy-stack' | 'branch-weekly' | 'branch-injury'
  | 'network-injuries-ytd' | 'incident-type-breakdown' | 'new-hire-share'
  | 'branch-30-trend' | 'apmm' | 'unclassified';

export type ParsedRequest = { chartId: ChartId; range?: DateRange; branch?: string; notes: string[]; };

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

function detectDate(input: string, today = new Date()): DateRange | undefined {
  const s = input.toLowerCase();
  if (s.includes('last week') || s.includes('past week')) return lastWeek(today);
  if (s.includes('ytd') || s.includes('year to date') || s.includes('year-to-date')) return ytd(today);
  if (s.includes('trailing 30') || s.includes('last 30') || s.includes('past 30') || s.includes('30 day') || s.includes('30-day')) return trailing30(today);
  if (s.includes('trailing 60') || s.includes('last 60') || s.includes('60 day')) return { from: subDays(today, 60), to: today, label: 'Trailing 60 Days' };
  if (s.includes('trailing 90') || s.includes('last 90') || s.includes('90 day')) return { from: subDays(today, 90), to: today, label: 'Trailing 90 Days' };

  const ddRange = s.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*(?:to|-|–)\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
  if (ddRange) {
    const parse = (str: string) => {
      const parts = str.split('/');
      const year = parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : today.getFullYear();
      return new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
    };
    return { from: parse(ddRange[1]), to: parse(ddRange[2]), label: `${ddRange[1]} to ${ddRange[2]}` };
  }
  const isoRange = s.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|-|–)\s*(\d{4}-\d{2}-\d{2})/);
  if (isoRange) return { from: parseISO(isoRange[1]), to: parseISO(isoRange[2]), label: `${isoRange[1]} to ${isoRange[2]}` };

  for (let i = 0; i < MONTHS.length; i++) {
    if (s.includes(MONTHS[i])) {
      const yMatch = s.match(/(20\d{2})/);
      const y = yMatch ? parseInt(yMatch[1]) : today.getFullYear();
      return monthRange(y, i + 1);
    }
  }
  return undefined;
}

function detectBranch(s: string): string | undefined {
  const up = s.toUpperCase();
  if (up.includes('BNY') || /\bbronx\b/i.test(s)) return 'BNY';
  if (up.includes('BMA') || /\bchelsea\b/i.test(s) || /\bboston\b/i.test(s)) return 'BMA';
  if (up.includes('BPA') || /\bphiladelphia\b/i.test(s) || /\bphilly\b/i.test(s)) return 'BPA';
  if (up.includes('BDC') || /\blanham\b/i.test(s) || /\bdc\b/i.test(s) || /\bwashington\b/i.test(s)) return 'BDC';
  return undefined;
}

export function parseRequest(input: string, today = new Date()): ParsedRequest {
  const s = input.toLowerCase();
  const notes: string[] = [];
  const range = detectDate(input, today);
  const branch = detectBranch(input);
  let chartId: ChartId = 'incident-type-breakdown';

  if ((s.includes('year over year') || s.includes('yoy')) && s.includes('snow')) chartId = 'network-yoy-snow';
  else if ((s.includes('year over year') || s.includes('yoy')) && (s.includes('stack') || s.includes('preventable'))) chartId = 'network-yoy-stack';
  else if (s.includes('weekly') && s.includes('accident')) chartId = 'branch-weekly';
  else if ((s.includes('branch') || s.includes('per branch')) && s.includes('injur')) chartId = 'branch-injury';
  else if (s.includes('injur') && (s.includes('ytd') || s.includes('network'))) chartId = 'network-injuries-ytd';
  else if (s.includes('incident type') || s.includes('breakdown')) chartId = 'incident-type-breakdown';
  else if (s.includes('new hire') || s.includes('new-hire') || s.includes('tenure')) chartId = 'new-hire-share';
  else if (s.includes('30 day') && (s.includes('trend') || s.includes('arrow'))) chartId = 'branch-30-trend';
  else if (s.includes('per million miles') || s.includes('apmm') || s.includes('million miles')) chartId = 'apmm';
  else if (s.includes('unclassified') || s.includes('pending')) chartId = 'unclassified';
  else if (s.includes('yoy') || s.includes('year over year')) chartId = 'network-yoy-stack';

  if (!range) notes.push('Using default date range for this chart.');
  return { chartId, range, branch, notes };
}

export function chartTitle(id: ChartId): string {
  const map: Record<ChartId, string> = {
    'network-yoy-snow': 'Network Preventable YoY (Snow Attribution)',
    'network-yoy-stack': 'Network YoY — Preventable + Non-Preventable',
    'branch-weekly': 'Per-Branch Weekly Accidents',
    'branch-injury': 'Per-Branch Injuries by Type',
    'network-injuries-ytd': 'Network YTD Injuries',
    'incident-type-breakdown': 'Incident Type Breakdown',
    'new-hire-share': 'New-Hire Share of Preventables',
    'branch-30-trend': 'Branch 30-Day Trend',
    'apmm': 'Accidents Per Million Miles',
    'unclassified': 'Unclassified Incidents',
  };
  return map[id];
}
