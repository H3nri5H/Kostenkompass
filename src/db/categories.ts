import type { Category, CategoryIconName, CategoryScope } from '@/domain/models';
import { supabase } from '@/lib/supabase';

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  parent_id: string | null;
  is_selectable: boolean;
  expense_enabled: boolean;
  asset_enabled: boolean;
  search_terms: string[] | null;
}

export async function listCategories(scope?: CategoryScope): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select(
      'id, name, icon, color, sort_order, parent_id, is_selectable, expense_enabled, asset_enabled, search_terms',
    )
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (scope === 'expense') {
    query = query.eq('expense_enabled', true);
  } else if (scope === 'asset') {
    query = query.eq('asset_enabled', true);
  }

  const response = await query;

  if (response.error) {
    throw response.error;
  }

  const rows = (response.data ?? []) as CategoryRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon as CategoryIconName,
    color: row.color,
    sortOrder: Number(row.sort_order),
    parentId: row.parent_id,
    isSelectable: row.is_selectable,
    expenseEnabled: row.expense_enabled,
    assetEnabled: row.asset_enabled,
    searchTerms: row.search_terms ?? [],
  }));
}
