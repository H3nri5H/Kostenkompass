import { parseIsoDate } from '@/domain/dates';

export function requireText(value: string, label: string): string | null {
  return value.trim().length > 0 ? null : `${label} ist erforderlich.`;
}

export function validateIsoDate(value: string, label: string): string | null {
  return parseIsoDate(value) ? null : `${label} ist ungültig.`;
}

export function validatePositiveCents(value: number | null, label: string): string | null {
  return value !== null && value > 0 ? null : `${label} muss größer als 0 € sein.`;
}

export function validateNonNegativeCents(value: number | null, label: string): string | null {
  return value !== null && value >= 0 ? null : `${label} darf nicht negativ sein.`;
}
