import { listAssets } from '@/db/assets';
import { listExpensesInRange } from '@/db/expenses';
import { listVehicleFuelEntriesInRange } from '@/db/vehicles';
import { currentMonthRange, formatMonth, toIsoDate } from '@/domain/dates';
import { projectDepreciation } from '@/domain/depreciation';
import type { CategoryExpenseTotal, CategoryIconName, DashboardSummary } from '@/domain/models';

interface CategoryCost {
  categoryId: string;
  categoryName: string;
  categoryIcon: CategoryIconName;
  categoryColor: string;
  amountCents: number;
}

export async function getDashboardSummary(now: Date = new Date()): Promise<DashboardSummary> {
  const range = currentMonthRange(now);
  const [expenses, assets, fuelEntries] = await Promise.all([
    listExpensesInRange(range.start, range.endExclusive),
    listAssets(),
    listVehicleFuelEntriesInRange(range.start, range.endExclusive),
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

  const assetPurchases = assets.filter(
    (asset) => asset.purchasedOn >= range.start && asset.purchasedOn < range.endExclusive,
  );
  const categoryMap = new Map<string, CategoryExpenseTotal>();

  function addCategoryCost(cost: CategoryCost) {
    const existing = categoryMap.get(cost.categoryId);

    if (existing) {
      existing.amountCents += cost.amountCents;
    } else {
      categoryMap.set(cost.categoryId, { ...cost });
    }
  }

  for (const expense of expenses) {
    addCategoryCost({
      categoryId: expense.categoryId,
      categoryName: expense.categoryName,
      categoryIcon: expense.categoryIcon,
      categoryColor: expense.categoryColor,
      amountCents: expense.amountCents,
    });
  }

  for (const asset of assetPurchases) {
    addCategoryCost({
      categoryId: asset.categoryId,
      categoryName: asset.categoryName,
      categoryIcon: asset.categoryIcon,
      categoryColor: asset.categoryColor,
      amountCents: asset.purchasePriceCents,
    });
  }

  for (const fuelEntry of fuelEntries) {
    addCategoryCost({
      categoryId: 'kfz',
      categoryName: 'Kfz',
      categoryIcon: 'car-sport-outline',
      categoryColor: '#3976C2',
      amountCents: fuelEntry.totalCostCents,
    });
  }

  const categoryTotals = [...categoryMap.values()].sort(
    (left, right) => right.amountCents - left.amountCents,
  );
  const expenseTotal = expenses.reduce((total, expense) => total + expense.amountCents, 0);
  const assetPurchaseTotal = assetPurchases.reduce(
    (total, asset) => total + asset.purchasePriceCents,
    0,
  );
  const fuelTotal = fuelEntries.reduce((total, entry) => total + entry.totalCostCents, 0);

  return {
    monthLabel: formatMonth(now),
    monthExpenseCents: expenseTotal + assetPurchaseTotal + fuelTotal,
    monthlyAssetCostCents,
    activeAssetValueCents,
    categoryTotals,
    recentExpenses: expenses.slice(0, 4),
  };
}
