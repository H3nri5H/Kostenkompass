import { formatEuro, parseEuroToCents } from '@/domain/money';

describe('money', () => {
  it.each([
    ['49,90', 4990],
    ['49.90', 4990],
    ['1.299,00', 129900],
    ['1,299.00', 129900],
    ['1299', 129900],
    ['1.299', 129900],
    ['0,01 €', 1],
  ])('parses %s as %i cents', (input, expected) => {
    expect(parseEuroToCents(input)).toBe(expected);
  });

  it.each([
    ['1,234,567', 123456700],
    ['1,234,56', 123456],
    ['1.234.567', 123456700],
    ['1.234.56', 123456],
  ])('handles repeated separators in %s', (input, expected) => {
    expect(parseEuroToCents(input)).toBe(expected);
  });

  it.each(['', '-1', 'abc', '12,3456'])('rejects invalid value %s', (input) => {
    expect(parseEuroToCents(input)).toBeNull();
  });

  it('formats cents as German Euro currency', () => {
    expect(formatEuro(129900)).toContain('1.299,00');
    expect(formatEuro(Number.NaN)).toContain('0,00');
  });
});
