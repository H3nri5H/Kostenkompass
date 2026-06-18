import type {
  CreateVehicleFuelEntryInput,
  CreateVehicleInput,
  CreateVehiclePartInput,
  Vehicle,
  VehicleFuelEntry,
  VehicleFuelType,
  VehiclePart,
  VehiclePartStatus,
  VehicleSummary,
} from '@/domain/models';
import { getAuthenticatedUserId, supabase } from '@/lib/supabase';

interface VehicleRow {
  id: string;
  display_name: string;
  manufacturer: string | null;
  model: string | null;
  fuel_type: string;
  license_plate: string | null;
  vin: string | null;
  kba: string | null;
  engine_code: string | null;
  transmission_code: string | null;
  first_registration_year: number | null;
  notes: string | null;
  created_at: string;
}

interface FuelEntryRow {
  id: string;
  vehicle_id: string;
  occurred_on: string;
  odometer_km: number;
  distance_km: number | null;
  liters: number | string;
  total_cost_cents: number | string;
  price_per_liter_cents: number | string;
  consumption_l_per_100_km: number | string | null;
  station: string | null;
  full_tank: boolean;
  note: string | null;
  created_at: string;
}

interface PartRow {
  id: string;
  vehicle_id: string;
  name: string;
  manufacturer: string | null;
  part_number: string | null;
  specification: string | null;
  location: string | null;
  quantity_on_hand: number | string | null;
  reorder_threshold: number | string | null;
  status: string;
  note: string | null;
  created_at: string;
}

const VEHICLE_COLUMNS = `
  id,
  display_name,
  manufacturer,
  model,
  fuel_type,
  license_plate,
  vin,
  kba,
  engine_code,
  transmission_code,
  first_registration_year,
  notes,
  created_at
`;

const FUEL_COLUMNS = `
  id,
  vehicle_id,
  occurred_on,
  odometer_km,
  distance_km,
  liters,
  total_cost_cents,
  price_per_liter_cents,
  consumption_l_per_100_km,
  station,
  full_tank,
  note,
  created_at
`;

const PART_COLUMNS = `
  id,
  vehicle_id,
  name,
  manufacturer,
  part_number,
  specification,
  location,
  quantity_on_hand,
  reorder_threshold,
  status,
  note,
  created_at
`;

function mapVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    displayName: row.display_name,
    manufacturer: row.manufacturer,
    model: row.model,
    fuelType: row.fuel_type as VehicleFuelType,
    licensePlate: row.license_plate,
    vin: row.vin,
    kba: row.kba,
    engineCode: row.engine_code,
    transmissionCode: row.transmission_code,
    firstRegistrationYear: row.first_registration_year,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapFuelEntry(row: FuelEntryRow): VehicleFuelEntry {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    occurredOn: row.occurred_on,
    odometerKm: Number(row.odometer_km),
    distanceKm: row.distance_km === null ? null : Number(row.distance_km),
    liters: Number(row.liters),
    totalCostCents: Number(row.total_cost_cents),
    pricePerLiterCents: Number(row.price_per_liter_cents),
    consumptionLitersPer100Km:
      row.consumption_l_per_100_km === null ? null : Number(row.consumption_l_per_100_km),
    station: row.station,
    fullTank: row.full_tank,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapPart(row: PartRow): VehiclePart {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    name: row.name,
    manufacturer: row.manufacturer,
    partNumber: row.part_number,
    specification: row.specification,
    location: row.location,
    quantityOnHand: row.quantity_on_hand === null ? null : Number(row.quantity_on_hand),
    reorderThreshold: row.reorder_threshold === null ? null : Number(row.reorder_threshold),
    status: row.status as VehiclePartStatus,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function createVehicle(input: CreateVehicleInput): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase.from('vehicles').insert({
    id: input.id,
    user_id: userId,
    display_name: input.displayName.trim(),
    manufacturer: input.manufacturer?.trim() || null,
    model: input.model?.trim() || null,
    fuel_type: input.fuelType,
    license_plate: input.licensePlate?.trim() || null,
    vin: input.vin?.trim() || null,
    kba: input.kba?.trim() || null,
    engine_code: input.engineCode?.trim() || null,
    transmission_code: input.transmissionCode?.trim() || null,
    first_registration_year: input.firstRegistrationYear,
    notes: input.notes?.trim() || null,
  });

  if (response.error) {
    throw response.error;
  }
}

export async function listVehicleSummaries(): Promise<VehicleSummary[]> {
  const userId = await getAuthenticatedUserId();
  const vehiclesResponse = await supabase
    .from('vehicles')
    .select(VEHICLE_COLUMNS)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (vehiclesResponse.error) {
    throw vehiclesResponse.error;
  }

  const vehicles = ((vehiclesResponse.data ?? []) as VehicleRow[]).map(mapVehicle);
  if (vehicles.length === 0) {
    return [];
  }

  const vehicleIds = vehicles.map((vehicle) => vehicle.id);
  const [fuelResponse, partsResponse] = await Promise.all([
    supabase
      .from('vehicle_fuel_entries')
      .select(FUEL_COLUMNS)
      .eq('user_id', userId)
      .in('vehicle_id', vehicleIds)
      .is('deleted_at', null),
    supabase
      .from('vehicle_parts')
      .select(PART_COLUMNS)
      .eq('user_id', userId)
      .in('vehicle_id', vehicleIds)
      .is('deleted_at', null),
  ]);

  if (fuelResponse.error) {
    throw fuelResponse.error;
  }

  if (partsResponse.error) {
    throw partsResponse.error;
  }

  const fuelEntries = ((fuelResponse.data ?? []) as FuelEntryRow[]).map(mapFuelEntry);
  const parts = ((partsResponse.data ?? []) as PartRow[]).map(mapPart);

  return vehicles.map((vehicle) => {
    const vehicleFuelEntries = fuelEntries.filter((entry) => entry.vehicleId === vehicle.id);
    const entriesWithConsumption = vehicleFuelEntries.filter(
      (entry) => entry.consumptionLitersPer100Km !== null,
    );
    const openPartCount = parts.filter(
      (part) =>
        part.vehicleId === vehicle.id && ['low_stock', 'needed', 'ordered'].includes(part.status),
    ).length;

    return {
      vehicle,
      lastOdometerKm:
        vehicleFuelEntries.length === 0
          ? null
          : Math.max(...vehicleFuelEntries.map((entry) => entry.odometerKm)),
      averageConsumptionLitersPer100Km:
        entriesWithConsumption.length === 0
          ? null
          : entriesWithConsumption.reduce(
              (sum, entry) => sum + (entry.consumptionLitersPer100Km ?? 0),
              0,
            ) / entriesWithConsumption.length,
      totalFuelCostCents: vehicleFuelEntries.reduce((sum, entry) => sum + entry.totalCostCents, 0),
      totalLiters: vehicleFuelEntries.reduce((sum, entry) => sum + entry.liters, 0),
      fuelEntryCount: vehicleFuelEntries.length,
      openPartCount,
    };
  });
}

export async function getVehicle(vehicleId: string): Promise<Vehicle> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase
    .from('vehicles')
    .select(VEHICLE_COLUMNS)
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (response.error) {
    throw response.error;
  }

  return mapVehicle(response.data as VehicleRow);
}

export async function createVehicleFuelEntry(input: CreateVehicleFuelEntryInput): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase.from('vehicle_fuel_entries').insert({
    id: input.id,
    user_id: userId,
    vehicle_id: input.vehicleId,
    occurred_on: input.occurredOn,
    odometer_km: input.odometerKm,
    distance_km: input.distanceKm,
    liters: input.liters,
    total_cost_cents: input.totalCostCents,
    station: input.station?.trim() || null,
    full_tank: input.fullTank,
    note: input.note?.trim() || null,
  });

  if (response.error) {
    throw response.error;
  }
}

export async function listVehicleFuelEntries(vehicleId: string): Promise<VehicleFuelEntry[]> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase
    .from('vehicle_fuel_entries')
    .select(FUEL_COLUMNS)
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .is('deleted_at', null)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (response.error) {
    throw response.error;
  }

  return ((response.data ?? []) as FuelEntryRow[]).map(mapFuelEntry);
}

export async function createVehiclePart(input: CreateVehiclePartInput): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase.from('vehicle_parts').insert({
    id: input.id,
    user_id: userId,
    vehicle_id: input.vehicleId,
    name: input.name.trim(),
    manufacturer: input.manufacturer?.trim() || null,
    part_number: input.partNumber?.trim() || null,
    specification: input.specification?.trim() || null,
    location: input.location?.trim() || null,
    quantity_on_hand: input.quantityOnHand,
    reorder_threshold: input.reorderThreshold,
    status: input.status,
    note: input.note?.trim() || null,
  });

  if (response.error) {
    throw response.error;
  }
}

export async function listVehicleParts(vehicleId: string): Promise<VehiclePart[]> {
  const userId = await getAuthenticatedUserId();
  const response = await supabase
    .from('vehicle_parts')
    .select(PART_COLUMNS)
    .eq('user_id', userId)
    .eq('vehicle_id', vehicleId)
    .is('deleted_at', null)
    .order('status', { ascending: false })
    .order('name', { ascending: true });

  if (response.error) {
    throw response.error;
  }

  return ((response.data ?? []) as PartRow[]).map(mapPart);
}
