import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category, CategoryIconName } from '@/domain/models';

interface CategoryRow {
  id: string;
  name: string;
  icon: CategoryIconName;
  color: string;
  sort_order: number;
}

export async function listCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT id, name, icon, color, sort_order
     FROM categories
     ORDER BY sort_order ASC, name ASC`,
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
  }));
}
