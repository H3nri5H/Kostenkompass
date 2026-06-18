import type { SQLiteDatabase } from 'expo-sqlite';

import type { Asset, CategoryIconName, CreateAssetInput } from '@/domain/models';

interface AssetRow {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: CategoryIconName;
  category_color: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  purchased_on: string;
  purchase_price_cents: number;
  residual_value_cents: number;
  useful_life_months: number;
  note: string | null;
  created_at: string;
}

function mapAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    name: row.name,
    manufacturer: row.manufacturer,
    model: row.model,
    purchasedOn: row.purchased_on,
    purchasePriceCents: row.purchase_price_cents,
    residualValueCents: row.residual_value_cents,
    usefulLifeMonths: row.useful_life_months,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function createAsset(db: SQLiteDatabase, input: CreateAssetInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO assets (
      id,
      category_id,
      name,
      manufacturer,
      model,
      purchased_on,
      purchase_price_cents,
      residual_value_cents,
      useful_life_months,
      note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.categoryId,
    input.name.trim(),
    input.manufacturer?.trim() || null,
    input.model?.trim() || null,
    input.purchasedOn,
    input.purchasePriceCents,
    input.residualValueCents,
    input.usefulLifeMonths,
    input.note?.trim() || null,
  );
}

export async function listAssets(db: SQLiteDatabase): Promise<Asset[]> {
  const rows = await db.getAllAsync<AssetRow>(
    `SELECT
      a.id,
      a.category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      a.name,
      a.manufacturer,
      a.model,
      a.purchased_on,
      a.purchase_price_cents,
      a.residual_value_cents,
      a.useful_life_months,
      a.note,
      a.created_at
     FROM assets a
     INNER JOIN categories c ON c.id = a.category_id
     WHERE a.deleted_at IS NULL
     ORDER BY a.purchased_on DESC, a.created_at DESC`,
  );

  return rows.map(mapAsset);
}

export async function deleteAsset(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    `UPDATE assets
     SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    id,
  );
}
