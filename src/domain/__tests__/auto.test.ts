import {
  formatConsumption,
  formatFuelPrice,
  formatLiters,
  getFuelTypeLabel,
  getPartStatusLabel,
  parseDecimalInput,
  parseIntegerInput,
} from '@/domain/vehicles';

describe('auto helpers', () => {
  it('parses numeric form input', () => {
    expect(parseDecimalInput('42,51')).toBe(42.51);
    expect(parseDecimalInput('42.510')).toBe(42.51);
    expect(parseDecimalInput('abc')).toBeNull();
    expect(parseIntegerInput('137200')).toBe(137200);
    expect(parseIntegerInput('137,2')).toBeNull();
  });

  it('formats fuel metrics', () => {
    expect(formatConsumption(4.8236)).toContain('4,82');
    expect(formatConsumption(null)).toBe('—');
    expect(formatLiters(42.5)).toContain('42,50');
    expect(formatFuelPrice(153)).toContain('1,530');
  });

  it('returns user-facing labels', () => {
    expect(getFuelTypeLabel('diesel')).toBe('Diesel');
    expect(getFuelTypeLabel('petrol')).toBe('Benzin');
    expect(getFuelTypeLabel('hybrid')).toBe('Hybrid');
    expect(getFuelTypeLabel('electric')).toBe('Elektro');
    expect(getFuelTypeLabel('other')).toBe('Sonstiges');
    expect(getPartStatusLabel('needed')).toBe('Benötigt');
    expect(getPartStatusLabel('ordered')).toBe('Bestellt');
  });
});
