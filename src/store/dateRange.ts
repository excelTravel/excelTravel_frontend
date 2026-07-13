import { create } from 'zustand';
import { endOfDay, format, startOfDay, startOfMonth, startOfYear, subDays } from 'date-fns';

export type RangePreset = 'all' | 'today' | '7d' | 'month' | '30d' | 'year' | 'custom';

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangeState {
  preset: RangePreset;
  range: DateRange;
  label: string;
  setPreset: (p: Exclude<RangePreset, 'custom'>) => void;
  setCustom: (from: Date, to: Date) => void;
}

export const PRESETS: { id: Exclude<RangePreset, 'custom'>; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'year', label: 'This year' },
];

function computePreset(p: Exclude<RangePreset, 'custom'>): { range: DateRange; label: string } {
  const now = new Date();
  switch (p) {
    case 'today':
      return { range: { from: startOfDay(now), to: endOfDay(now) }, label: 'Today' };
    case '7d':
      return { range: { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }, label: 'Last 7 days' };
    case 'month':
      return { range: { from: startOfMonth(now), to: endOfDay(now) }, label: 'This month' };
    case '30d':
      return { range: { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }, label: 'Last 30 days' };
    case 'year':
      return { range: { from: startOfYear(now), to: endOfDay(now) }, label: 'This year' };
    case 'all':
    default:
      return { range: {}, label: 'All time' };
  }
}

const initial = computePreset('all');

// Global date range — every screen's KPIs, charts, deltas, and lists read from this. Default: all time.
export const useDateRange = create<DateRangeState>((set) => ({
  preset: 'all',
  range: initial.range,
  label: initial.label,
  setPreset: (p) => {
    const c = computePreset(p);
    set({ preset: p, range: c.range, label: c.label });
  },
  setCustom: (from, to) => set({ preset: 'custom', range: { from, to }, label: `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}` }),
}));

// Backend analytics take a `since` timestamptz; convert the selected range's start (undefined = all time).
export function rangeToSince(range: DateRange): string | undefined {
  return range.from?.toISOString();
}
