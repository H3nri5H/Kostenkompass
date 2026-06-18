import type { SQLiteDatabase } from 'expo-sqlite';

import { listAssets } from '@/db/assets';
import { listExpensesInRange } from '@/db/expenses';
import { currentMonthRange, formatMonth, todayIso } from '@/domain/dates';
import { projectDepreciation } from '@/domain/depreciation';
import type { CategoryExpenseTotal, CategoryIconName, DashboardSummary } from '@/domain/models';

interface CategoryTotalRow {
  category_id: string;
  category_name: string;
  category_icon: CategoryIconName;
  category_color: string;
  amount_cents: number;
}

export async function getDashboardSummary(
  db: SQLiteDatabase,
  now: Date = new Date(),
): Promise<DashboardSummary> {
  const range = currentMonthRange(now);

  const [expenses, assets, categoryRows] = await Promise.all([
    listExpensesInRange(db, range.start, range.endExclusive),
    listAssets(db),
    db.getAllAsync<CategoryTotalRow>(
      `SELECT
        e.category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        SUM(e.amount_cents) AS amount_cents
       FROM expenses e
       INNER JOIN categories c ON c.id = e.category_id
       WHERE e.deleted_at IS NULL
         AND e.occurred_on >= ?
         AND e.occurred_on < ?
       GROUP BY e.category_id, c.name, c.icon, c.color
       ORDER BY amount_cents DESC`,
      range.start,
      range.endExclusive,
    ),
  ]);

  const asOf = todayIso();
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

  const categoryTotals: CategoryExpenseTotal[] = categoryRows.map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    amountCents: row.amount_cents,
  }));

  return {
    monthLabel: formatMonth(now),
    monthExpenseCents: expenses.reduce((total, expense) => total + expense.amountCents, 0),
    monthlyAssetCostCents,
    activeAssetValueCents,
    categoryTotals,
    recentExpenses: expenses.slice(0, 4),
  };
}
