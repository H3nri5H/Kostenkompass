export type CategoryIconName =
  | 'home-outline'
  | 'car-sport-outline'
  | 'cart-outline'
  | 'flash-outline'
  | 'shield-checkmark-outline'
  | 'heart-outline'
  | 'game-controller-outline'
  | 'laptop-outline'
  | 'ellipsis-horizontal-outline';

export interface Category {
  id: string;
  name: string;
  icon: CategoryIconName;
  color: string;
  sortOrder: number;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: CategoryIconName;
  categoryColor: string;
  amountCents: number;
  occurredOn: string;
  merchant: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreateExpenseInput {
  id: string;
  categoryId: string;
  amountCents: number;
  occurredOn: string;
  merchant: string | null;
  note: string | null;
}

export interface Asset {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: CategoryIconName;
  categoryColor: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  purchasedOn: string;
  purchasePriceCents: number;
  residualValueCents: number;
  usefulLifeMonths: number;
  note: string | null;
  createdAt: string;
}

export interface CreateAssetInput {
  id: string;
  categoryId: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  purchasedOn: string;
  purchasePriceCents: number;
  residualValueCents: number;
  usefulLifeMonths: number;
  note: string | null;
}

export interface CategoryExpenseTotal {
  categoryId: string;
  categoryName: string;
  categoryIcon: CategoryIconName;
  categoryColor: string;
  amountCents: number;
}

export interface DashboardSummary {
  monthLabel: string;
  monthExpenseCents: number;
  monthlyAssetCostCents: number;
  activeAssetValueCents: number;
  categoryTotals: CategoryExpenseTotal[];
  recentExpenses: Expense[];
}
