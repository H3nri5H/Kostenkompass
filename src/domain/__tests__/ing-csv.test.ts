import {
  createIngTransactionFingerprintSource,
  decodeIngCsvBytes,
  formatIngExpenseMerchant,
  formatIngExpenseNote,
  maskIban,
  parseGermanSignedCents,
  parseIngCsv,
  shouldSelectIngExpenseByDefault,
  suggestIngExpenseCategory,
  type IngCsvTransaction,
} from '@/domain/ing-csv';

function encodeWindows1252(value: string): Uint8Array {
  return Uint8Array.from(
    [...value].map((character) => {
      if (character === '€') return 0x80;
      const code = character.charCodeAt(0);
      if (code > 0xff) throw new Error(`Unsupported test character: ${character}`);
      return code;
    }),
  );
}

const header =
  'Buchung;Wertstellungsdatum;Auftraggeber/Empfänger;Buchungstext;Verwendungszweck;Saldo;Währung;Betrag;Währung';

function createExport(bank = 'ING'): Uint8Array {
  return encodeWindows1252(
    [
      'Umsatzanzeige;Datei erstellt am: 19.06.2026 02:15',
      '',
      'IBAN;DE00 0000 0000 0000 0000 00',
      'Kontoname;Girokonto',
      `Bank;${bank}`,
      'Kunde;Test Person',
      'Zeitraum;01.06.2026 - 19.06.2026',
      'Saldo;992,66;EUR',
      '',
      'Sortierung;Datum absteigend',
      '',
      'Nur gebuchte Umsätze.',
      '',
      header,
      '18.06.2026;18.06.2026;VISA Bäckerei Test;Lastschrift;"Kauf; ARN123456789012345";992,66;EUR;-12,34;EUR',
      '17.06.2026;17.06.2026;Arbeitgeber;Gutschrift;Gehalt;1.005,00;EUR;5,00;EUR',
      '16.06.2026;17.06.2026;;Wertpapierkauf;WP-ABRECHNUNG 123456 Kauf;1.000,00;EUR;-100,00;EUR',
    ].join('\r\n'),
  );
}

function transaction(overrides: Partial<IngCsvTransaction> = {}): IngCsvTransaction {
  return {
    sourceLine: 15,
    bookingDate: '2026-06-18',
    valueDate: '2026-06-18',
    counterparty: 'VISA REWE TESTMARKT',
    bookingText: 'Lastschrift',
    purpose: 'KAUFUMSATZ ARN123456789012345',
    balanceCents: 99266,
    amountCents: -1234,
    currency: 'EUR',
    reference: 'ARN:123456789012345',
    ...overrides,
  };
}

describe('ING CSV import', () => {
  it('decodes Windows-1252 and parses metadata, quoted fields and signed amounts', () => {
    const result = parseIngCsv(createExport());

    expect(result.metadata).toMatchObject({
      iban: 'DE00000000000000000000',
      bank: 'ING',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-19',
      closingBalanceCents: 99266,
      currency: 'EUR',
    });
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0]).toMatchObject({
      counterparty: 'VISA Bäckerei Test',
      amountCents: -1234,
      purpose: 'Kauf; ARN123456789012345',
      reference: 'ARN:123456789012345',
    });
    expect(result.transactions[1]?.amountCents).toBe(500);
    expect(result.transactions[2]?.reference).toBe('SECURITIES:123456');
    expect(result.warnings).toEqual([]);
  });

  it('decodes UTF-8 with a byte order mark', () => {
    const bytes = new Uint8Array([
      0xef, 0xbb, 0xbf, 0x55, 0x6d, 0x73, 0xc3, 0xa4, 0x74, 0x7a, 0x65,
    ]);
    expect(decodeIngCsvBytes(bytes)).toBe('Umsätze');
  });

  it.each([
    ['259,32', 25932],
    ['1.080,83', 108083],
    ['-2,64', -264],
    ['+12,00', 1200],
  ])('parses German signed amount %s', (value, expected) => {
    expect(parseGermanSignedCents(value)).toBe(expected);
  });

  it.each(['12', '12.00', '1,2', 'abc'])('rejects invalid German amount %s', (value) => {
    expect(parseGermanSignedCents(value)).toBeNull();
  });

  it('rejects files from another bank', () => {
    expect(() => parseIngCsv(createExport('Andere Bank'))).toThrow(/ING-Umsatzexport/);
  });

  it('builds stable reference-based and row-based fingerprint sources', () => {
    const metadata = parseIngCsv(createExport()).metadata;
    const referenced = transaction();
    const changedText = transaction({ purpose: 'Anderer Text ARN123456789012345' });

    expect(createIngTransactionFingerprintSource(metadata, referenced)).toBe(
      createIngTransactionFingerprintSource(metadata, changedText),
    );

    const withoutReference = transaction({ reference: null });
    expect(createIngTransactionFingerprintSource(metadata, withoutReference)).not.toBe(
      createIngTransactionFingerprintSource(metadata, {
        ...withoutReference,
        balanceCents: 98032,
      }),
    );
  });

  it('suggests categories while leaving investments unselected', () => {
    expect(suggestIngExpenseCategory(transaction())).toBe('lebensmittel');
    expect(
      suggestIngExpenseCategory(
        transaction({ counterparty: 'PayPal', purpose: 'Ihr Einkauf bei Steam' }),
      ),
    ).toBe('freizeit');
    expect(
      suggestIngExpenseCategory(
        transaction({ counterparty: 'Bundeskasse', purpose: 'Kfz-Steuer für das Fahrzeug' }),
      ),
    ).toBe('kfz');
    expect(
      shouldSelectIngExpenseByDefault(
        transaction({ bookingText: 'Wertpapierkauf', purpose: 'Sparplan' }),
      ),
    ).toBe(false);
    expect(shouldSelectIngExpenseByDefault(transaction({ amountCents: 500 }))).toBe(false);
    expect(shouldSelectIngExpenseByDefault(transaction())).toBe(true);
  });

  it('prepares concise expense fields and masks the account', () => {
    expect(formatIngExpenseMerchant(transaction())).toBe('REWE TESTMARKT');
    expect(formatIngExpenseNote(transaction())).toBe('Lastschrift · KAUFUMSATZ ARN123456789012345');
    expect(maskIban('DE00 0000 0000 0000 1234 56')).toBe('•••• 3456');
  });
});
