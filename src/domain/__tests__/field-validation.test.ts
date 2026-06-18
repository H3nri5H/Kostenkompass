import {
  normalizeLicensePlate,
  normalizeVin,
  validateHttpUrl,
  validateKba,
  validateLicensePlate,
  validateVehicleCode,
  validateVin,
  validateYear,
} from '@/domain/field-validation';

describe('field validation', () => {
  it('normalizes and validates German license plates', () => {
    expect(normalizeLicensePlate('b ab 123 e')).toBe('B-AB-123-E');
    expect(validateLicensePlate('B-AB 123E')).toBeNull();
    expect(validateLicensePlate('123 !!!')).not.toBeNull();
    expect(validateLicensePlate('')).toBeNull();
  });

  it('normalizes and validates VIN values', () => {
    expect(normalizeVin('wvw zzz 1j-z3w386752')).toBe('WVWZZZ1JZ3W386752');
    expect(validateVin('WVWZZZ1JZ3W386752')).toBeNull();
    expect(validateVin('WVWZZZ1JZ3W38675O')).not.toBeNull();
    expect(validateVin('ABC')).not.toBeNull();
  });

  it('validates KBA and vehicle codes', () => {
    expect(validateKba('0603 / BNV')).toBeNull();
    expect(validateKba('603')).not.toBeNull();
    expect(validateVehicleCode('CAYC', 'Motorcode')).toBeNull();
    expect(validateVehicleCode('bad code!', 'Motorcode')).not.toBeNull();
  });

  it('validates URLs and years', () => {
    expect(validateHttpUrl('https://example.com/filter')).toBeNull();
    expect(validateHttpUrl('ftp://example.com')).not.toBeNull();
    expect(validateHttpUrl('')).toBeNull();
    expect(validateYear(2020)).toBeNull();
    expect(validateYear(1800)).not.toBeNull();
    expect(validateYear(null)).toBeNull();
  });
});
