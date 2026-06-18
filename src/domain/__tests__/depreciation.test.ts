import { calculateMonthlyCostCents, projectDepreciation } from '@/domain/depreciation';

describe('depreciation', () => {
  it('calculates linear monthly cost', () => {
    expect(calculateMonthlyCostCents(120000, 10000, 48)).toBe(2292);
  });

  it('projects value and remaining life', () => {
    const result = projectDepreciation(
      {
        purchasePriceCents: 120000,
        residualValueCents: 0,
        usefulLifeMonths: 48,
        purchasedOn: '2024-06-01',
      },
      '2025-06-01',
    );

    expect(result.elapsedMonths).toBe(12);
    expect(result.remainingMonths).toBe(36);
    expect(result.currentValueCents).toBe(90000);
    expect(result.progress).toBe(0.25);
    expect(result.endsOn).toBe('2028-06-01');
    expect(result.isComplete).toBe(false);
  });

  it('never depreciates below the residual value', () => {
    const result = projectDepreciation(
      {
        purchasePriceCents: 120000,
        residualValueCents: 20000,
        usefulLifeMonths: 12,
        purchasedOn: '2020-01-01',
      },
      '2026-01-01',
    );

    expect(result.currentValueCents).toBe(20000);
    expect(result.remainingMonths).toBe(0);
    expect(result.progress).toBe(1);
    expect(result.isComplete).toBe(true);
  });

  it('rejects invalid input', () => {
    expect(() => calculateMonthlyCostCents(-1, 0, 12)).toThrow();
    expect(() => calculateMonthlyCostCents(100, -1, 12)).toThrow();
    expect(() => calculateMonthlyCostCents(100, 200, 12)).toThrow();
    expect(() => calculateMonthlyCostCents(100, 0, 0)).toThrow();
  });
});
