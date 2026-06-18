import type { Asset, CategoryIconName, CreateAssetInput } from '@/domain/models';
import { getAuthenticatedUserId, supabase } from '@/lib/supabase';

interface CategoryRelation {
  name: string;
  icon: string;
  color: string;
}

interface AssetRow {
  id: string;
  category_id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  purchased_on: string;
  purchase_price_cents: number | string;
  residual_value_cents: number | string;
  useful_life_months: number;
  note: string | null;
  created_at: string;
  category: CategoryRelation | CategoryRelation[] | null;
}

const ASSET_SELECT = `
  id,
  category_id,
  name,
  manufacturer,
  model,
  purchased_on,
  purchase_price_cents,
  residual_value_cents,
  useful_life_months,
  note,
  created_at,
  category:categories!inner(name, icon, color)
`;

function mapAsset(row: AssetRow): Asset {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  if (!category) {
    throw new Error('Die Kategorie eines Produkts konnte nicht geladen werden.');
  }

  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: category.name,
    categoryIcon: category.icon as CategoryIconName,
    categoryColor: category.color,
    name: row.name,
    manufacturer: row.manufacturer,
    model: row.model,
    purchasedOn: row.purchased_on,
    purchasePriceCents: Number(row.purchase_price_cents),
    residualValueCents: Number(row.residual_value_cents),
    usefulLifeMonths: Number(row.useful_life_months),
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function createAsset(input: CreateAssetInput): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase.from('assets').insert({
    id: input.id,
    user_id: userId,
    category_id: input.categoryId,
    name: input.name.trim(),
    manufacturer: input.manufacturer?.trim() || null,
    model: input.model?.trim() || null,
    purchased_on: input.purchasedOn,
    purchase_price_cents: input.purchasePriceCents,
    residual_value_cents: input.residualValueCents,
    useful_life_months: input.usefulLifeMonths,
    note: input.note?.trim() || null,
  });

  if (response.error) {
    throw response.error;
  }
}

export async function listAssets(): Promise<Asset[]> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase
    .from('assets')
    .select(ASSET_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('purchased_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (response.error) {
    throw response.error;
  }

  return ((response.data ?? []) as unknown as AssetRow[]).map(mapAsset);
}

export async function deleteAsset(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase
    .from('assets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (response.error) {
    throw response.error;
  }
}
