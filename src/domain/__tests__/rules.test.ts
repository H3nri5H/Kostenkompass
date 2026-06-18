import {
  requireText,
  validateIsoDate,
  validateNonNegativeCents,
  validatePositiveCents,
} from '@/domain/validation';

describe('input rules', () => {
  it('accepts valid values', () => {
    expect(requireText('Laptop', 'Name')).toBeNull();
    expect(validateIsoDate('2026-06-18', 'Datum')).toBeNull();
    expect(validatePositiveCents(1, 'Betrag')).toBeNull();
    expect(validateNonNegativeCents(0, 'Restwert')).toBeNull();
  });

  it('rejects invalid values', () => {
    expect(requireText(' ', 'Name')).not.toBeNull();
    expect(validateIsoDate('invalid', 'Datum')).not.toBeNull();
    expect(validatePositiveCents(null, 'Betrag')).not.toBeNull();
    expect(validateNonNegativeCents(null, 'Restwert')).not.toBeNull();
  });
});
