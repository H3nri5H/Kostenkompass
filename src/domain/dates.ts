function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

export function formatDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMonth(value: Date = new Date()): string {
  const label = new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric',
  }).format(value);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function currentMonthRange(now: Date = new Date()): {
  start: string;
  endExclusive: string;
} {
  return {
    start: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    endExclusive: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
  };
}

export function addMonthsIso(value: string, numberOfMonths: number): string {
  const source = parseIsoDate(value);
  if (!source || !Number.isInteger(numberOfMonths)) {
    return value;
  }

  const originalDay = source.getDate();
  source.setDate(1);
  source.setMonth(source.getMonth() + numberOfMonths);

  const lastDay = new Date(source.getFullYear(), source.getMonth() + 1, 0).getDate();
  source.setDate(Math.min(originalDay, lastDay));

  return toIsoDate(source);
}

export function differenceInCompleteMonths(startValue: string, endValue: string): number {
  const start = parseIsoDate(startValue);
  const end = parseIsoDate(endValue);

  if (!start || !end) {
    return 0;
  }

  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();

  const anniversary = parseIsoDate(addMonthsIso(startValue, months));
  if (anniversary && end.getTime() < anniversary.getTime()) {
    months -= 1;
  }

  return months;
}
