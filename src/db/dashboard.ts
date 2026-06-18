import { listAssets } from '@/db/assets';
import { listExpensesInRange } from '@/db/expenses';
import { currentMonthRange, formatMonth, toIsoDate } from '@/domain/dates';
import { projectDepreciation } from '@/domain/depreciation';
import type { CategoryExpenseTotal, DashboardSummary } from '@/domain/models';

export async function getDashboardSummary(now: Date = new Date()): Promise<DashboardSummary> {
  const range = currentMonthRange(now);
  const [expenses, assets] = await Promise.all([
    listExpensesInRange(range.start, range.endExclusive),
    listAssets(),
  ]);

  const asOf = toIsoDate(now);
  let monthlyAssetCostCents = 0;
  let activeAssetValueCents = 0;

  for (const asset of assets) {
    const projection = projectDepreciation(asset, asOf);

    if (asset.purchasedOn <= asOf) {
      activeAssetValueCents += projection.currentValueCents;

      if (!projection.isComplete) {
        monthlyAssetCostCents += projection.monthlyCostCents;
      }
    }
  }

  const categoryMap = new Map<string, CategoryExpenseTotal>();

  for (const expense of expenses) {
    const existing = categoryMap.get(expense.categoryId);

    if (existing) {
      existing.amountCents += expense.amountCents;
    } else {
      categoryMap.set(expense.categoryId, {
        categoryId: expense.categoryId,
        categoryName: expense.categoryName,
        categoryIcon: expense.categoryIcon,
        categoryColor: expense.categoryColor,
        amountCents: expense.amountCents,
      });
    }
  }

  const categoryTotals = [...categoryMap.values()].sort(
    (left, right) => right.amountCents - left.amountCents,
  );

  return {
    monthLabel: formatMonth(now),
    monthExpenseCents: expenses.reduce((total, expense) => total + expense.amountCents, 0),
    monthlyAssetCostCents,
    activeAssetValueCents,
    categoryTotals,
    recentExpenses: expenses.slice(0, 4),
  };
}
