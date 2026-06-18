import {
  addMonthsIso,
  currentMonthRange,
  differenceInCompleteMonths,
  formatDate,
  formatMonth,
  parseIsoDate,
  todayIso,
  toIsoDate,
} from '@/domain/dates';

describe('dates', () => {
  it('round-trips a local ISO date', () => {
    expect(toIsoDate(new Date(2026, 5, 18))).toBe('2026-06-18');
    expect(parseIsoDate('2026-06-18')).not.toBeNull();
  });

  it('rejects impossible dates', () => {
    expect(parseIsoDate('2026-02-31')).toBeNull();
    expect(parseIsoDate('18.06.2026')).toBeNull();
  });

  it('adds months while clamping the day', () => {
    expect(addMonthsIso('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsIso('2024-01-31', 1)).toBe('2024-02-29');
  });

  it('calculates complete months', () => {
    expect(differenceInCompleteMonths('2026-01-15', '2026-02-14')).toBe(0);
    expect(differenceInCompleteMonths('2026-01-15', '2026-02-15')).toBe(1);
    expect(differenceInCompleteMonths('2026-04-01', '2026-03-01')).toBe(-1);
  });

  it('formats dates and month labels', () => {
    expect(formatDate('2026-06-18')).toMatch(/18/);
    expect(formatDate('invalid')).toBe('invalid');
    expect(formatMonth(new Date(2026, 5, 18))).toContain('2026');
  });

  it('returns unchanged or neutral values for invalid inputs', () => {
    expect(addMonthsIso('invalid', 2)).toBe('invalid');
    expect(addMonthsIso('2026-01-01', 1.5)).toBe('2026-01-01');
    expect(differenceInCompleteMonths('invalid', '2026-01-01')).toBe(0);
  });

  it('uses the local current date', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 5, 18, 12));
    expect(todayIso()).toBe('2026-06-18');
    jest.useRealTimers();
  });

  it('returns the current month range', () => {
    expect(currentMonthRange(new Date(2026, 5, 18))).toEqual({
      start: '2026-06-01',
      endExclusive: '2026-07-01',
    });
  });
});
