import type { VehicleFuelType, VehiclePartStatus } from '@/domain/models';

export function parseDecimalInput(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

  if (!/^\d+(\.\d{0,3})?$/.test(normalized)) {
    return null;
  }

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function parseIntegerInput(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) {
    return null;
  }

  const numberValue = Number(value.trim());
  return Number.isSafeInteger(numberValue) ? numberValue : null;
}

export function formatLiters(value: number): string {
  return `${value.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} l`;
}

export function formatConsumption(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }

  return `${value.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} l/100 km`;
}

export function formatFuelPrice(cents: number): string {
  return `${(cents / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} €/l`;
}

export function getFuelTypeLabel(type: VehicleFuelType): string {
  const labels: Record<VehicleFuelType, string> = {
    diesel: 'Diesel',
    petrol: 'Benzin',
    hybrid: 'Hybrid',
    electric: 'Elektro',
    other: 'Sonstiges',
  };

  return labels[type];
}

export function getPartStatusLabel(status: VehiclePartStatus): string {
  const labels: Record<VehiclePartStatus, string> = {
    ok: 'Kein Handlungsbedarf',
    low_stock: 'Bald benötigt',
    needed: 'Benötigt',
    ordered: 'Bestellt',
    installed: 'Verbaut',
  };

  return labels[status];
}
