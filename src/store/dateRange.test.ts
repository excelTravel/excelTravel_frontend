import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { useDateRange, rangeToQuery } from './dateRange';

describe('rangeToQuery', () => {
  it('converts both bounds to ISO strings', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-01-31T23:59:59Z');
    expect(rangeToQuery({ from, to })).toEqual({ from: from.toISOString(), to: to.toISOString() });
  });

  it('leaves both bounds undefined for an unbounded (all-time) range', () => {
    expect(rangeToQuery({})).toEqual({ from: undefined, to: undefined });
  });
});

// Presets resolve against the machine's local calendar day (date-fns startOfDay/endOfDay), not UTC — so
// expectations are computed the same way here rather than hardcoded, to stay correct under any timezone.
describe('useDateRange store', () => {
  const now = new Date('2026-03-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to "all time" with both bounds unset', () => {
    const { preset, range } = useDateRange.getState();
    expect(preset).toBe('all');
    expect(range.from).toBeUndefined();
    expect(range.to).toBeUndefined();
  });

  it('"today" bounds the range to the start and end of the local calendar day', () => {
    useDateRange.getState().setPreset('today');
    const { range, label } = useDateRange.getState();
    expect(range.from).toEqual(startOfDay(now));
    expect(range.to).toEqual(endOfDay(now));
    expect(label).toBe('Today');
  });

  it('"7d" spans today plus the 6 preceding calendar days', () => {
    useDateRange.getState().setPreset('7d');
    const { range } = useDateRange.getState();
    expect(range.from).toEqual(startOfDay(subDays(now, 6)));
    expect(range.to).toEqual(endOfDay(now));
  });

  it('setCustom stores an explicit range and a formatted label', () => {
    const from = new Date('2026-02-01T00:00:00Z');
    const to = new Date('2026-02-10T00:00:00Z');
    useDateRange.getState().setCustom(from, to);
    const state = useDateRange.getState();
    expect(state.preset).toBe('custom');
    expect(state.range).toEqual({ from, to });
  });
});
