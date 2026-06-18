const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;
const LICENSE_PLATE_PATTERN = /^[A-ZÄÖÜ]{1,3}(?:[- ]?[A-ZÄÖÜ]{1,2})?[- ]?\d{1,4}[EH]?$/;
const KBA_PATTERN = /^\d{4}(?:\s*[/ -]\s*)?[A-Z0-9]{3,8}$/;
const VEHICLE_CODE_PATTERN = /^[A-Z0-9._/-]{2,20}$/;
const HTTP_URL_PATTERN = /^https?:\/\/[^\s.]+(?:\.[^\s.]+)+(?:\/[^\s]*)?$/i;

export function normalizeUppercase(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function normalizeVin(value: string): string {
  return value.trim().toUpperCase().replace(/\s|-/g, '');
}

export function normalizeLicensePlate(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function validateVin(value: string): string | null {
  if (!value.trim()) return null;
  return VIN_PATTERN.test(normalizeVin(value))
    ? null
    : 'Die FIN muss 17 Zeichen enthalten; I, O und Q sind nicht zulässig.';
}

export function validateLicensePlate(value: string): string | null {
  if (!value.trim()) return null;
  return LICENSE_PLATE_PATTERN.test(normalizeLicensePlate(value))
    ? null
    : 'Das Kennzeichen hat kein plausibles Format.';
}

export function validateKba(value: string): string | null {
  if (!value.trim()) return null;
  return KBA_PATTERN.test(normalizeUppercase(value)) ? null : 'KBA bitte als HSN und TSN angeben.';
}

export function validateVehicleCode(value: string, label: string): string | null {
  if (!value.trim()) return null;
  return VEHICLE_CODE_PATTERN.test(normalizeUppercase(value))
    ? null
    : `${label} darf nur Buchstaben, Zahlen, Punkt, Schrägstrich, Unterstrich und Bindestrich enthalten.`;
}

export function validateHttpUrl(value: string): string | null {
  if (!value.trim()) return null;
  return HTTP_URL_PATTERN.test(value.trim())
    ? null
    : 'Die URL muss mit http:// oder https:// beginnen.';
}

export function validateYear(value: number | null): string | null {
  if (value === null) return null;
  return value >= 1900 && value <= 2100 ? null : 'Das Jahr muss zwischen 1900 und 2100 liegen.';
}

export function validateNonNegativeInteger(value: number | null, label: string): string | null {
  return value !== null && Number.isSafeInteger(value) && value >= 0
    ? null
    : `${label} muss eine nicht negative ganze Zahl sein.`;
}
