import { formatKilometers, getInspectionState, getPartServiceState } from '@/domain/vehicle-due';

describe('vehicle due calculations', () => {
  it('calculates the next replacement odometer and due state', () => {
    expect(
      getPartServiceState(
        { lastReplacedOdometerKm: 100000, replacementIntervalKm: 15000 },
        112000,
      ),
    ).toEqual({ state: 'ok', nextDueOdometerKm: 115000, remainingKm: 3000 });

    expect(
      getPartServiceState(
        { lastReplacedOdometerKm: 100000, replacementIntervalKm: 15000 },
        114000,
      ).state,
    ).toBe('soon');

    expect(
      getPartServiceState(
        { lastReplacedOdometerKm: 100000, replacementIntervalKm: 15000 },
        115001,
      ).state,
    ).toBe('due');
  });

  it('returns not configured without required values', () => {
    expect(
      getPartServiceState(
        { lastReplacedOdometerKm: null, replacementIntervalKm: 15000 },
        120000,
      ),
    ).toEqual({ state: 'not_configured', nextDueOdometerKm: null, remainingKm: null });
  });

  it('calculates inspection urgency', () => {
    expect(getInspectionState(null, '2026-06-18')).toBe('not_configured');
    expect(getInspectionState('2026-06-17', '2026-06-18')).toBe('due');
    expect(getInspectionState('2026-07-18', '2026-06-18')).toBe('soon');
    expect(getInspectionState('2027-06-18', '2026-06-18')).toBe('ok');
    expect(getInspectionState('invalid', '2026-06-18')).toBe('not_configured');
  });

  it('formats odometer values', () => {
    expect(formatKilometers(123456)).toContain('123.456');
    expect(formatKilometers(null)).toBe('—');
  });
});
