import { parseIsoDate, todayIso } from '@/domain/dates';
import type { VehiclePart } from '@/domain/models';

export type DueState = 'not_configured' | 'ok' | 'soon' | 'due';

export interface PartServiceState {
  state: DueState;
  nextDueOdometerKm: number | null;
  remainingKm: number | null;
}

export function formatKilometers(value: number | null): string {
  return value === null ? '—' : `${value.toLocaleString('de-DE')} km`;
}

export function getPartServiceState(
  part: Pick<VehiclePart, 'lastReplacedOdometerKm' | 'replacementIntervalKm'>,
  currentOdometerKm: number | null,
): PartServiceState {
  if (
    part.lastReplacedOdometerKm === null ||
    part.replacementIntervalKm === null ||
    currentOdometerKm === null
  ) {
    return { state: 'not_configured', nextDueOdometerKm: null, remainingKm: null };
  }

  const nextDueOdometerKm = part.lastReplacedOdometerKm + part.replacementIntervalKm;
  const remainingKm = nextDueOdometerKm - currentOdometerKm;
  const warningDistance = Math.min(
    2000,
    Math.max(500, Math.round(part.replacementIntervalKm * 0.1)),
  );

  return {
    state: remainingKm <= 0 ? 'due' : remainingKm <= warningDistance ? 'soon' : 'ok',
    nextDueOdometerKm,
    remainingKm,
  };
}

export function getInspectionState(nextInspectionOn: string | null, asOf = todayIso()): DueState {
  if (!nextInspectionOn) {
    return 'not_configured';
  }

  const dueDate = parseIsoDate(nextInspectionOn);
  const currentDate = parseIsoDate(asOf);

  if (!dueDate || !currentDate) {
    return 'not_configured';
  }

  const dayInMilliseconds = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((dueDate.getTime() - currentDate.getTime()) / dayInMilliseconds);
  return daysRemaining < 0 ? 'due' : daysRemaining <= 60 ? 'soon' : 'ok';
}
