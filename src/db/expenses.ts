import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryIconName, CreateExpenseInput, Expense } from '@/domain/models';

interface ExpenseRow {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: CategoryIconName;
  category_color: string;
  amount_cents: number;
  occurred_on: string;
  merchant: string | null;
  note: string | null;
  created_at: string;
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    amountCents: row.amount_cents,
    occurredOn: row.occurred_on,
    merchant: row.merchant,
    note: row.note,
    createdAt: row.created_at,
  };
}

const EXPENSE_SELECT = `
  SELECT
    e.id,
    e.category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    e.amount_cents,
    e.occurred_on,
    e.merchant,
    e.note,
    e.created_at
  FROM expenses e
  INNER JOIN categories c ON c.id = e.category_id
  WHERE e.deleted_at IS NULL
`;

export async function createExpense(db: SQLiteDatabase, input: CreateExpenseInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO expenses (
      id, category_id, amount_cents, occurred_on, merchant, note
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    input.id,
    input.categoryId,
    input.amountCents,
    input.occurredOn,
    input.merchant?.trim() || null,
    input.note?.trim() || null,
  );
}

export async function listExpenses(db: SQLiteDatabase, limit = 250): Promise<Expense[]> {
  const rows = await db.getAllAsync<ExpenseRow>(
    `${EXPENSE_SELECT}
     ORDER BY e.occurred_on DESC, e.created_at DESC
     LIMIT ?`,
    limit,
  );

  return rows.map(mapExpense);
}

export async function listExpensesInRange(
  db: SQLiteDatabase,
  start: string,
  endExclusive: string,
): Promise<Expense[]> {
  const rows = await db.getAllAsync<ExpenseRow>(
    `${EXPENSE_SELECT}
       AND e.occurred_on >= ?
       AND e.occurred_on < ?
     ORDER BY e.occurred_on DESC, e.created_at DESC`,
    start,
    endExclusive,
  );

  return rows.map(mapExpense);
}

export async function deleteExpense(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    `UPDATE expenses
     SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    id,
  );
}
