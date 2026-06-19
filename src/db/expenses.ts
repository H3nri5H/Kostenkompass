import type {
  CategoryIconName,
  CreateExpenseInput,
  CreateImportedExpenseInput,
  Expense,
} from '@/domain/models';
import { getAuthenticatedUserId, supabase } from '@/lib/supabase';

interface CategoryRelation {
  name: string;
  icon: string;
  color: string;
}

interface ExpenseRow {
  id: string;
  category_id: string;
  amount_cents: number | string;
  occurred_on: string;
  merchant: string | null;
  note: string | null;
  created_at: string;
  category: CategoryRelation | CategoryRelation[] | null;
}

const EXPENSE_SELECT = `
  id,
  category_id,
  amount_cents,
  occurred_on,
  merchant,
  note,
  created_at,
  category:categories!inner(name, icon, color)
`;

function mapExpense(row: ExpenseRow): Expense {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;

  if (!category) {
    throw new Error('Die Kategorie einer Ausgabe konnte nicht geladen werden.');
  }

  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: category.name,
    categoryIcon: category.icon as CategoryIconName,
    categoryColor: category.color,
    amountCents: Number(row.amount_cents),
    occurredOn: row.occurred_on,
    merchant: row.merchant,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function createExpense(input: CreateExpenseInput): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase.from('expenses').insert({
    id: input.id,
    user_id: userId,
    category_id: input.categoryId,
    amount_cents: input.amountCents,
    occurred_on: input.occurredOn,
    merchant: input.merchant?.trim() || null,
    note: input.note?.trim() || null,
  });

  if (response.error) {
    throw response.error;
  }
}

export async function listExpenses(limit = 250): Promise<Expense[]> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase
    .from('expenses')
    .select(EXPENSE_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (response.error) {
    throw response.error;
  }

  return ((response.data ?? []) as unknown as ExpenseRow[]).map(mapExpense);
}

export async function listExpensesInRange(start: string, endExclusive: string): Promise<Expense[]> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase
    .from('expenses')
    .select(EXPENSE_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('occurred_on', start)
    .lt('occurred_on', endExclusive)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (response.error) {
    throw response.error;
  }

  return ((response.data ?? []) as unknown as ExpenseRow[]).map(mapExpense);
}

export async function deleteExpense(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (response.error) {
    throw response.error;
  }
}

interface ImportFingerprintRow {
  import_fingerprint: string | null;
}

const IMPORT_FINGERPRINT_CHUNK_SIZE = 50;

export async function listExistingExpenseImportFingerprints(
  fingerprints: string[],
): Promise<Set<string>> {
  const uniqueFingerprints = [...new Set(fingerprints.filter(Boolean))];
  const existing = new Set<string>();

  if (uniqueFingerprints.length === 0) {
    return existing;
  }

  const userId = await getAuthenticatedUserId();

  for (let index = 0; index < uniqueFingerprints.length; index += IMPORT_FINGERPRINT_CHUNK_SIZE) {
    const chunk = uniqueFingerprints.slice(index, index + IMPORT_FINGERPRINT_CHUNK_SIZE);
    const response = await supabase
      .from('expenses')
      .select('import_fingerprint')
      .eq('user_id', userId)
      .eq('import_source', 'ing_csv')
      .in('import_fingerprint', chunk);

    if (response.error) {
      throw response.error;
    }

    for (const row of (response.data ?? []) as ImportFingerprintRow[]) {
      if (row.import_fingerprint) {
        existing.add(row.import_fingerprint);
      }
    }
  }

  return existing;
}

export async function createImportedExpenses(
  inputs: CreateImportedExpenseInput[],
): Promise<number> {
  if (inputs.length === 0) {
    return 0;
  }

  const userId = await getAuthenticatedUserId();
  const rows = inputs.map((input) => ({
    id: input.id,
    user_id: userId,
    category_id: input.categoryId,
    amount_cents: input.amountCents,
    occurred_on: input.occurredOn,
    merchant: input.merchant?.trim() || null,
    note: input.note?.trim() || null,
    import_source: input.importSource,
    import_fingerprint: input.importFingerprint,
  }));
  const response = await supabase
    .from('expenses')
    .upsert(rows, {
      onConflict: 'user_id,import_source,import_fingerprint',
      ignoreDuplicates: true,
    })
    .select('import_fingerprint');

  if (response.error) {
    throw response.error;
  }

  return response.data?.length ?? 0;
}
