import type { Category, CategoryIconName } from '@/domain/models';
import { supabase } from '@/lib/supabase';

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

export async function listCategories(): Promise<Category[]> {
  const response = await supabase
    .from('categories')
    .select('id, name, icon, color, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

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
  }));
}
