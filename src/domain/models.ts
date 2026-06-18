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

export type VehicleFuelType = 'diesel' | 'petrol' | 'hybrid' | 'electric' | 'other';

export interface Vehicle {
  id: string;
  displayName: string;
  manufacturer: string | null;
  model: string | null;
  fuelType: VehicleFuelType;
  licensePlate: string | null;
  vin: string | null;
  kba: string | null;
  engineCode: string | null;
  transmissionCode: string | null;
  firstRegistrationYear: number | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateVehicleInput {
  id: string;
  displayName: string;
  manufacturer: string | null;
  model: string | null;
  fuelType: VehicleFuelType;
  licensePlate: string | null;
  vin: string | null;
  kba: string | null;
  engineCode: string | null;
  transmissionCode: string | null;
  firstRegistrationYear: number | null;
  notes: string | null;
}

export interface VehicleFuelEntry {
  id: string;
  vehicleId: string;
  occurredOn: string;
  odometerKm: number;
  distanceKm: number | null;
  liters: number;
  totalCostCents: number;
  pricePerLiterCents: number;
  consumptionLitersPer100Km: number | null;
  station: string | null;
  fullTank: boolean;
  note: string | null;
  createdAt: string;
}

export interface CreateVehicleFuelEntryInput {
  id: string;
  vehicleId: string;
  occurredOn: string;
  odometerKm: number;
  distanceKm: number | null;
  liters: number;
  totalCostCents: number;
  station: string | null;
  fullTank: boolean;
  note: string | null;
}

export type VehiclePartStatus = 'ok' | 'low_stock' | 'needed' | 'ordered' | 'installed';

export interface VehiclePart {
  id: string;
  vehicleId: string;
  name: string;
  manufacturer: string | null;
  partNumber: string | null;
  specification: string | null;
  location: string | null;
  quantityOnHand: number | null;
  reorderThreshold: number | null;
  status: VehiclePartStatus;
  note: string | null;
  createdAt: string;
}

export interface CreateVehiclePartInput {
  id: string;
  vehicleId: string;
  name: string;
  manufacturer: string | null;
  partNumber: string | null;
  specification: string | null;
  location: string | null;
  quantityOnHand: number | null;
  reorderThreshold: number | null;
  status: VehiclePartStatus;
  note: string | null;
}

export interface VehicleSummary {
  vehicle: Vehicle;
  lastOdometerKm: number | null;
  averageConsumptionLitersPer100Km: number | null;
  totalFuelCostCents: number;
  totalLiters: number;
  fuelEntryCount: number;
  openPartCount: number;
}
