const euroFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEuro(cents: number): string {
  if (!Number.isFinite(cents)) {
    return euroFormatter.format(0);
  }

  return euroFormatter.format(cents / 100);
}

export function parseEuroToCents(rawValue: string): number | null {
  const compact = rawValue.trim().replace(/\s/g, '').replace(/€/g, '');

  if (compact.length === 0 || compact.startsWith('-')) {
    return null;
  }

  const commaCount = (compact.match(/,/g) ?? []).length;
  const dotCount = (compact.match(/\./g) ?? []).length;
  let normalized = compact;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = compact.lastIndexOf(',');
    const lastDot = compact.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? /\./g : /,/g;

    normalized = compact.replace(thousandsSeparator, '').replace(decimalSeparator, '.');
  } else if (commaCount > 0) {
    if (commaCount > 1) {
      const groups = compact.split(',');
      const lastGroup = groups.at(-1) ?? '';

      normalized =
        lastGroup.length === 2 ? `${groups.slice(0, -1).join('')}.${lastGroup}` : groups.join('');
    } else {
      const [, decimals = ''] = compact.split(',');
      normalized =
        decimals.length === 3 && compact.length > 4
          ? compact.replace(',', '')
          : compact.replace(',', '.');
    }
  } else if (dotCount > 0) {
    if (dotCount > 1) {
      const groups = compact.split('.');
      const lastGroup = groups.at(-1) ?? '';

      normalized =
        lastGroup.length === 2 ? `${groups.slice(0, -1).join('')}.${lastGroup}` : groups.join('');
    } else {
      const [, decimals = ''] = compact.split('.');
      normalized = decimals.length === 3 && compact.length > 4 ? compact.replace('.', '') : compact;
    }
  }

  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}
