import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        category_id TEXT NOT NULL,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        occurred_on TEXT NOT NULL,
        merchant TEXT,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY NOT NULL,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        manufacturer TEXT,
        model TEXT,
        purchased_on TEXT NOT NULL,
        purchase_price_cents INTEGER NOT NULL CHECK (purchase_price_cents > 0),
        residual_value_cents INTEGER NOT NULL DEFAULT 0 CHECK (residual_value_cents >= 0),
        useful_life_months INTEGER NOT NULL CHECK (useful_life_months > 0),
        note TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        CHECK (residual_value_cents <= purchase_price_cents)
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_occurred_on
        ON expenses(occurred_on DESC);
      CREATE INDEX IF NOT EXISTS idx_expenses_category
        ON expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_assets_purchased_on
        ON assets(purchased_on DESC);
      CREATE INDEX IF NOT EXISTS idx_assets_category
        ON assets(category_id);

      INSERT OR IGNORE INTO categories (id, name, icon, color, sort_order) VALUES
        ('wohnen', 'Wohnen', 'home-outline', '#6B6ED6', 10),
        ('haushalt', 'Haushalt', 'flash-outline', '#BC6B32', 20),
        ('lebensmittel', 'Lebensmittel', 'cart-outline', '#3B8C6E', 30),
        ('kfz', 'Kfz', 'car-sport-outline', '#3976C2', 40),
        ('technik', 'Technik', 'laptop-outline', '#6E58A6', 50),
        ('versicherungen', 'Versicherungen', 'shield-checkmark-outline', '#397D88', 60),
        ('gesundheit', 'Gesundheit', 'heart-outline', '#BE5869', 70),
        ('freizeit', 'Freizeit', 'game-controller-outline', '#AA7A24', 80),
        ('sonstiges', 'Sonstiges', 'ellipsis-horizontal-outline', '#6A737D', 90);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
