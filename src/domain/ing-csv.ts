const ING_HEADER = [
  'Buchung',
  'Wertstellungsdatum',
  'Auftraggeber/Empfänger',
  'Buchungstext',
  'Verwendungszweck',
  'Saldo',
  'Währung',
  'Betrag',
  'Währung',
] as const;

const WINDOWS_1252_EXTENSION: Record<number, string> = {
  0x80: '€',
  0x82: '‚',
  0x83: 'ƒ',
  0x84: '„',
  0x85: '…',
  0x86: '†',
  0x87: '‡',
  0x88: 'ˆ',
  0x89: '‰',
  0x8a: 'Š',
  0x8b: '‹',
  0x8c: 'Œ',
  0x8e: 'Ž',
  0x91: '‘',
  0x92: '’',
  0x93: '“',
  0x94: '”',
  0x95: '•',
  0x96: '–',
  0x97: '—',
  0x98: '˜',
  0x99: '™',
  0x9a: 'š',
  0x9b: '›',
  0x9c: 'œ',
  0x9e: 'ž',
  0x9f: 'Ÿ',
};

interface CsvRow {
  cells: string[];
  lineNumber: number;
}

export interface IngCsvMetadata {
  createdAtLabel: string | null;
  iban: string;
  accountName: string | null;
  bank: string;
  customer: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  closingBalanceCents: number | null;
  currency: string;
}

export interface IngCsvTransaction {
  sourceLine: number;
  bookingDate: string;
  valueDate: string;
  counterparty: string | null;
  bookingText: string;
  purpose: string | null;
  balanceCents: number;
  amountCents: number;
  currency: string;
  reference: string | null;
}

export interface IngCsvWarning {
  lineNumber: number;
  message: string;
}

export interface IngCsvParseResult {
  metadata: IngCsvMetadata;
  transactions: IngCsvTransaction[];
  warnings: IngCsvWarning[];
}

export class IngCsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IngCsvParseError';
  }
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeHeaderCell(value: string): string {
  return normalizeWhitespace(value.replace(/^\uFEFF/, '')).toLocaleLowerCase('de-DE');
}

function decodeWindows1252(bytes: Uint8Array): string {
  let output = '';

  for (const byte of bytes) {
    output += WINDOWS_1252_EXTENSION[byte] ?? String.fromCharCode(byte);
  }

  return output;
}

function decodeUtf8(bytes: Uint8Array): string | null {
  let output = '';
  let index = 0;

  while (index < bytes.length) {
    const first = bytes[index];
    if (first === undefined) return null;

    if (first <= 0x7f) {
      output += String.fromCharCode(first);
      index += 1;
      continue;
    }

    let codePoint = 0;
    let continuationCount = 0;
    let minimum = 0;

    if (first >= 0xc2 && first <= 0xdf) {
      codePoint = first & 0x1f;
      continuationCount = 1;
      minimum = 0x80;
    } else if (first >= 0xe0 && first <= 0xef) {
      codePoint = first & 0x0f;
      continuationCount = 2;
      minimum = 0x800;
    } else if (first >= 0xf0 && first <= 0xf4) {
      codePoint = first & 0x07;
      continuationCount = 3;
      minimum = 0x10000;
    } else {
      return null;
    }

    if (index + continuationCount >= bytes.length) {
      return null;
    }

    for (let offset = 1; offset <= continuationCount; offset += 1) {
      const next = bytes[index + offset];
      if (next === undefined || (next & 0xc0) !== 0x80) {
        return null;
      }
      codePoint = (codePoint << 6) | (next & 0x3f);
    }

    if (
      codePoint < minimum ||
      codePoint > 0x10ffff ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff)
    ) {
      return null;
    }

    output += String.fromCodePoint(codePoint);
    index += continuationCount + 1;
  }

  return output;
}

export function decodeIngCsvBytes(bytes: Uint8Array): string {
  const withoutBom =
    bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.slice(3) : bytes;

  return decodeUtf8(withoutBom) ?? decodeWindows1252(withoutBom);
}

function parseDelimitedRows(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let lineNumber = 1;
  let rowStartLine = 1;

  function finishRow() {
    row.push(field);
    rows.push({ cells: row, lineNumber: rowStartLine });
    row = [];
    field = '';
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (inQuotes || field.length === 0) {
        inQuotes = !inQuotes;
      } else {
        field += character;
      }
      continue;
    }

    if (!inQuotes && character === ';') {
      row.push(field);
      field = '';
      continue;
    }

    if (!inQuotes && (character === '\n' || character === '\r')) {
      finishRow();

      if (character === '\r' && text[index + 1] === '\n') {
        index += 1;
      }

      lineNumber += 1;
      rowStartLine = lineNumber;
      continue;
    }

    field += character;
  }

  if (inQuotes) {
    throw new IngCsvParseError('Die CSV-Datei enthält ein nicht abgeschlossenes Textfeld.');
  }

  if (field.length > 0 || row.length > 0) {
    finishRow();
  }

  return rows;
}

function parseGermanDate(value: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseGermanSignedCents(value: string): number | null {
  const compact = value.trim().replace(/\s/g, '').replace(/€/g, '');

  if (!/^[+-]?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/.test(compact)) {
    return null;
  }

  const normalized = compact.replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  const cents = Math.round(amount * 100);

  return Number.isFinite(amount) && Number.isSafeInteger(cents) ? cents : null;
}

function extractReference(bookingText: string, purpose: string | null): string | null {
  const combined = `${bookingText} ${purpose ?? ''}`;
  const arn = /\bARN\s*([0-9A-Z]{12,})\b/i.exec(combined);
  if (arn?.[1]) return `ARN:${arn[1].toUpperCase()}`;

  const paypal = /^\s*(\d{10,})(?:\/|\s)/.exec(purpose ?? '');
  if (paypal?.[1]) return `PAYPAL:${paypal[1]}`;

  const securities = /\bWP-ABRECHNUNG\s+(\d+)\b/i.exec(combined);
  if (securities?.[1]) return `SECURITIES:${securities[1]}`;

  return null;
}

function findMetadataRow(rows: CsvRow[], headerIndex: number, label: string): CsvRow | undefined {
  const normalizedLabel = label.toLocaleLowerCase('de-DE');

  return rows
    .slice(0, headerIndex)
    .find((row) => normalizeHeaderCell(row.cells[0] ?? '') === normalizedLabel);
}

function parsePeriod(value: string): { start: string | null; end: string | null } {
  const match = /^(\d{2}\.\d{2}\.\d{4})\s*-\s*(\d{2}\.\d{2}\.\d{4})$/.exec(value.trim());

  return {
    start: match?.[1] ? parseGermanDate(match[1]) : null,
    end: match?.[2] ? parseGermanDate(match[2]) : null,
  };
}

export function parseIngCsv(bytes: Uint8Array): IngCsvParseResult {
  const rows = parseDelimitedRows(decodeIngCsvBytes(bytes));
  const expectedHeader = ING_HEADER.map(normalizeHeaderCell);
  const headerIndex = rows.findIndex((row) => {
    if (row.cells.length !== expectedHeader.length) return false;
    return row.cells.every((cell, index) => normalizeHeaderCell(cell) === expectedHeader[index]);
  });

  if (headerIndex < 0) {
    throw new IngCsvParseError(
      'Die ING-Spaltenüberschriften wurden nicht gefunden. Bitte exportiere die Umsatzanzeige unverändert als CSV.',
    );
  }

  const bankRow = findMetadataRow(rows, headerIndex, 'Bank');
  const bank = normalizeWhitespace(bankRow?.cells[1] ?? '');
  if (!/^ING$/i.test(bank)) {
    throw new IngCsvParseError('Die ausgewählte Datei ist kein unterstützter ING-Umsatzexport.');
  }

  const ibanRow = findMetadataRow(rows, headerIndex, 'IBAN');
  const iban = (ibanRow?.cells[1] ?? '').replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{13,32}$/.test(iban)) {
    throw new IngCsvParseError('Die IBAN des exportierten Kontos konnte nicht gelesen werden.');
  }

  const createdRow = rows[0];
  const accountRow = findMetadataRow(rows, headerIndex, 'Kontoname');
  const customerRow = findMetadataRow(rows, headerIndex, 'Kunde');
  const periodRow = findMetadataRow(rows, headerIndex, 'Zeitraum');
  const balanceRow = findMetadataRow(rows, headerIndex, 'Saldo');
  const period = parsePeriod(periodRow?.cells[1] ?? '');
  const closingBalanceCents = parseGermanSignedCents(balanceRow?.cells[1] ?? '');
  const metadataCurrency = normalizeWhitespace(balanceRow?.cells[2] ?? '').toUpperCase();
  const warnings: IngCsvWarning[] = [];
  const transactions: IngCsvTransaction[] = [];

  for (const row of rows.slice(headerIndex + 1)) {
    if (row.cells.every((cell) => cell.trim().length === 0)) continue;

    if (row.cells.length !== ING_HEADER.length) {
      warnings.push({
        lineNumber: row.lineNumber,
        message: `Die Zeile enthält ${row.cells.length} statt ${ING_HEADER.length} Spalten.`,
      });
      continue;
    }

    const bookingDate = parseGermanDate(row.cells[0] ?? '');
    const valueDate = parseGermanDate(row.cells[1] ?? '');
    const balanceCents = parseGermanSignedCents(row.cells[5] ?? '');
    const amountCents = parseGermanSignedCents(row.cells[7] ?? '');
    const balanceCurrency = normalizeWhitespace(row.cells[6] ?? '').toUpperCase();
    const currency = normalizeWhitespace(row.cells[8] ?? '').toUpperCase();

    if (!bookingDate || !valueDate || balanceCents === null || amountCents === null) {
      warnings.push({
        lineNumber: row.lineNumber,
        message: 'Datum, Saldo oder Betrag konnte nicht gelesen werden.',
      });
      continue;
    }

    if (currency !== 'EUR' || balanceCurrency !== 'EUR') {
      warnings.push({
        lineNumber: row.lineNumber,
        message: `Die Währung ${currency || balanceCurrency || 'unbekannt'} wird nicht unterstützt.`,
      });
      continue;
    }

    if (amountCents === 0) {
      warnings.push({
        lineNumber: row.lineNumber,
        message: 'Buchungen mit 0,00 € wurden übersprungen.',
      });
      continue;
    }

    const counterparty = normalizeWhitespace(row.cells[2] ?? '') || null;
    const bookingText = normalizeWhitespace(row.cells[3] ?? '');
    const purpose = normalizeWhitespace(row.cells[4] ?? '') || null;

    transactions.push({
      sourceLine: row.lineNumber,
      bookingDate,
      valueDate,
      counterparty,
      bookingText,
      purpose,
      balanceCents,
      amountCents,
      currency,
      reference: extractReference(bookingText, purpose),
    });
  }

  if (transactions.length === 0) {
    throw new IngCsvParseError('Die Datei enthält keine lesbaren, bereits gebuchten Umsätze.');
  }

  return {
    metadata: {
      createdAtLabel:
        normalizeWhitespace(createdRow?.cells[1] ?? '').replace(/^Datei erstellt am:\s*/i, '') ||
        null,
      iban,
      accountName: normalizeWhitespace(accountRow?.cells[1] ?? '') || null,
      bank,
      customer: normalizeWhitespace(customerRow?.cells[1] ?? '') || null,
      periodStart: period.start,
      periodEnd: period.end,
      closingBalanceCents,
      currency: metadataCurrency || 'EUR',
    },
    transactions,
    warnings,
  };
}

function canonicalValue(value: string | null): string {
  return normalizeWhitespace(value ?? '')
    .normalize('NFKC')
    .toLocaleUpperCase('de-DE');
}

export function createIngTransactionFingerprintSource(
  metadata: IngCsvMetadata,
  transaction: IngCsvTransaction,
): string {
  const account = metadata.iban.replace(/\s/g, '').toUpperCase();

  if (transaction.reference) {
    return [
      'ING_CSV_V1',
      account,
      canonicalValue(transaction.reference),
      transaction.amountCents,
      transaction.currency,
    ].join('|');
  }

  return [
    'ING_CSV_V1',
    account,
    transaction.bookingDate,
    transaction.valueDate,
    transaction.amountCents,
    transaction.balanceCents,
    transaction.currency,
    canonicalValue(transaction.counterparty),
    canonicalValue(transaction.bookingText),
    canonicalValue(transaction.purpose),
  ].join('|');
}

function transactionSearchText(transaction: IngCsvTransaction): string {
  return canonicalValue(
    [transaction.counterparty, transaction.bookingText, transaction.purpose]
      .filter((value): value is string => Boolean(value))
      .join(' '),
  );
}

function includesAny(value: string, needles: readonly string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

export function suggestIngExpenseCategory(transaction: IngCsvTransaction): string {
  const text = transactionSearchText(transaction);

  if (
    includesAny(text, [
      'REWE',
      'EDEKA',
      'NETTO',
      'KAUFLAND',
      'CITTI',
      'LIDL',
      'ALDI',
      'PENNY',
      'NORMA',
      'FAMILA',
      'SUPERMARKT',
    ])
  ) {
    return 'lebensmittel';
  }

  if (
    includesAny(text, [
      'KFZ-STEUER',
      'KRAFTFAHRZEUGSTEUER',
      'ARAL',
      'SHELL',
      'ESSO',
      'TANKSTELLE',
      'AUTOWERKSTATT',
      'AUTOHAUS',
    ])
  ) {
    return 'kfz';
  }

  if (
    includesAny(text, [
      'STEAM',
      'MCDONALD',
      'RESTAURANT',
      'BISTRO',
      'BUFFET',
      'KINO',
      'NETFLIX',
      'SPOTIFY',
      'DISNEY+',
      'PLAYSTATION',
      'XBOX',
      'FUSSBALL',
      'SPORTVEREIN',
      'EINTRACHT',
    ])
  ) {
    return 'freizeit';
  }

  if (includesAny(text, ['APOTHEKE', 'ARZT', 'ZAHNARZT', 'KRANKENKASSE', 'SANITÄTSHAUS'])) {
    return 'gesundheit';
  }

  if (includesAny(text, ['VERSICHERUNG', 'ALLIANZ', 'HUK', 'DEVK', 'AXA'])) {
    return 'versicherungen';
  }

  if (includesAny(text, ['MIETE', 'VONOVIA', 'HAUSVERWALTUNG', 'WOHNUNG'])) {
    return 'wohnen';
  }

  if (
    includesAny(text, [
      'STADTWERKE',
      'VATTENFALL',
      'E.ON',
      'STROM',
      'GASVERSORGUNG',
      'TELEKOM',
      'VODAFONE',
      'INTERNET',
    ])
  ) {
    return 'haushalt';
  }

  if (includesAny(text, ['ADOBE', 'MEDIA MARKT', 'MEDIAMARKT', 'SATURN', 'APPLE.COM'])) {
    return 'technik';
  }

  return 'sonstiges';
}

export function shouldSelectIngExpenseByDefault(transaction: IngCsvTransaction): boolean {
  if (transaction.amountCents >= 0) return false;

  const text = transactionSearchText(transaction);
  return !includesAny(text, [
    'WERTPAPIERKAUF',
    'WERTPAPIERSPARPLAN',
    'DEPOTÜBERTRAG',
    'TAGESGELD',
    'EIGENÜBERTRAG',
  ]);
}

export function formatIngExpenseMerchant(transaction: IngCsvTransaction): string | null {
  const merchant = normalizeWhitespace(transaction.counterparty ?? transaction.bookingText).replace(
    /^VISA\s+/i,
    '',
  );

  return merchant ? merchant.slice(0, 160) : null;
}

export function formatIngExpenseNote(transaction: IngCsvTransaction): string | null {
  const parts = [transaction.bookingText, transaction.purpose]
    .filter((value): value is string => value !== null)
    .map(normalizeWhitespace)
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);

  return parts.length > 0 ? parts.join(' · ').slice(0, 1000) : null;
}

export function maskIban(iban: string): string {
  const normalized = iban.replace(/\s/g, '').toUpperCase();
  if (normalized.length <= 4) return normalized;
  return `•••• ${normalized.slice(-4)}`;
}
