import { addMonthsIso, differenceInCompleteMonths, todayIso } from '@/domain/dates';
import type { Asset } from '@/domain/models';

export interface DepreciationProjection {
  monthlyCostCents: number;
  currentValueCents: number;
  elapsedMonths: number;
  remainingMonths: number;
  progress: number;
  endsOn: string;
  isComplete: boolean;
}

export function calculateMonthlyCostCents(
  purchasePriceCents: number,
  residualValueCents: number,
  usefulLifeMonths: number,
): number {
  if (!Number.isInteger(purchasePriceCents) || purchasePriceCents < 0) {
    throw new Error('Der Kaufpreis muss ein nicht negativer Cent-Betrag sein.');
  }

  if (!Number.isInteger(residualValueCents) || residualValueCents < 0) {
    throw new Error('Der Restwert muss ein nicht negativer Cent-Betrag sein.');
  }

  if (residualValueCents > purchasePriceCents) {
    throw new Error('Der Restwert darf den Kaufpreis nicht überschreiten.');
  }

  if (!Number.isInteger(usefulLifeMonths) || usefulLifeMonths <= 0) {
    throw new Error('Die Nutzungsdauer muss mindestens einen Monat betragen.');
  }

  return Math.round((purchasePriceCents - residualValueCents) / usefulLifeMonths);
}

export function projectDepreciation(
  asset: Pick<
    Asset,
    'purchasePriceCents' | 'residualValueCents' | 'usefulLifeMonths' | 'purchasedOn'
  >,
  asOf = todayIso(),
): DepreciationProjection {
  const elapsedMonths = Math.min(
    asset.usefulLifeMonths,
    Math.max(0, differenceInCompleteMonths(asset.purchasedOn, asOf)),
  );
  const depreciableCents = asset.purchasePriceCents - asset.residualValueCents;
  const depreciationToDate = Math.round(
    (depreciableCents * elapsedMonths) / asset.usefulLifeMonths,
  );
  const currentValueCents = Math.max(
    asset.residualValueCents,
    asset.purchasePriceCents - depreciationToDate,
  );

  return {
    monthlyCostCents: calculateMonthlyCostCents(
      asset.purchasePriceCents,
      asset.residualValueCents,
      asset.usefulLifeMonths,
    ),
    currentValueCents,
    elapsedMonths,
    remainingMonths: Math.max(0, asset.usefulLifeMonths - elapsedMonths),
    progress: elapsedMonths / asset.usefulLifeMonths,
    endsOn: addMonthsIso(asset.purchasedOn, asset.usefulLifeMonths),
    isComplete: elapsedMonths >= asset.usefulLifeMonths,
  };
}
