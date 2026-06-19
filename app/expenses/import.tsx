import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { CategoryPicker } from '@/components/CategoryPicker';
import { FormScreen } from '@/components/FormScreen';
import { ImportTransactionRow } from '@/components/ImportTransactionRow';
import { SurfaceCard } from '@/components/SurfaceCard';
import { listCategories } from '@/db/categories';
import { createImportedExpenses, listExistingExpenseImportFingerprints } from '@/db/expenses';
import { formatDate } from '@/domain/dates';
import {
  createIngTransactionFingerprintSource,
  formatIngExpenseMerchant,
  formatIngExpenseNote,
  IngCsvParseError,
  maskIban,
  parseIngCsv,
  shouldSelectIngExpenseByDefault,
  suggestIngExpenseCategory,
  type IngCsvParseResult,
  type IngCsvTransaction,
} from '@/domain/ing-csv';
import type { Category } from '@/domain/models';
import { formatEuro } from '@/domain/money';
import { useAppTheme } from '@/theme/theme';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface PreparedExpense {
  fingerprint: string;
  transaction: IngCsvTransaction;
  merchant: string | null;
  note: string | null;
  categoryId: string;
  selected: boolean;
  duplicate: boolean;
  defaultExcluded: boolean;
}

async function readDocumentBytes(asset: DocumentPicker.DocumentPickerAsset): Promise<Uint8Array> {
  if (asset.file) {
    return new Uint8Array(await asset.file.arrayBuffer());
  }

  return new ExpoFile(asset.uri).bytes();
}

export default function ImportExpensesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<IngCsvParseResult | null>(null);
  const [items, setItems] = useState<PreparedExpense[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [categoryTarget, setCategoryTarget] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void listCategories()
      .then((loadedCategories) => {
        if (mounted) setCategories(loadedCategories);
      })
      .catch((error) => {
        console.error(error);
        if (mounted) setScreenError('Die Kategorien konnten nicht geladen werden.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const selectedItems = useMemo(() => items.filter((item) => item.selected), [items]);
  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + Math.abs(item.transaction.amountCents), 0),
    [selectedItems],
  );
  const duplicateCount = useMemo(() => items.filter((item) => item.duplicate).length, [items]);
  const creditCount = useMemo(
    () => result?.transactions.filter((transaction) => transaction.amountCents > 0).length ?? 0,
    [result],
  );
  const activeCategoryItem = categoryTarget
    ? (items.find((item) => item.fingerprint === categoryTarget) ?? null)
    : null;

  async function chooseFile() {
    if (categories.length === 0) {
      setScreenError('Die Kategorien sind noch nicht verfügbar.');
      return;
    }

    setBusy(true);
    setScreenError(null);

    try {
      const selection = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
        multiple: false,
        base64: false,
      });

      if (selection.canceled) return;

      const asset = selection.assets[0];
      if (!asset) throw new Error('Die ausgewählte Datei konnte nicht geöffnet werden.');
      if (asset.size !== undefined && asset.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('Die CSV-Datei darf höchstens 5 MB groß sein.');
      }

      const parsed = parseIngCsv(await readDocumentBytes(asset));
      const debits = parsed.transactions.filter((transaction) => transaction.amountCents < 0);
      const prepared = await Promise.all(
        debits.map(async (transaction) => ({
          transaction,
          fingerprint: await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            createIngTransactionFingerprintSource(parsed.metadata, transaction),
          ),
        })),
      );
      const existing = await listExistingExpenseImportFingerprints(
        prepared.map((item) => item.fingerprint),
      );
      const seenInFile = new Set<string>();
      const fallbackCategoryId = categoryMap.has('sonstiges')
        ? 'sonstiges'
        : (categories[0]?.id ?? null);

      if (!fallbackCategoryId) {
        throw new Error('Es ist keine Kategorie für den Import verfügbar.');
      }

      const nextItems: PreparedExpense[] = prepared.map(({ transaction, fingerprint }) => {
        const duplicate = existing.has(fingerprint) || seenInFile.has(fingerprint);
        seenInFile.add(fingerprint);
        const suggestedCategory = suggestIngExpenseCategory(transaction);
        const categoryId = categoryMap.has(suggestedCategory)
          ? suggestedCategory
          : fallbackCategoryId;
        const selectedByDefault = shouldSelectIngExpenseByDefault(transaction);

        return {
          fingerprint,
          transaction,
          merchant: formatIngExpenseMerchant(transaction),
          note: formatIngExpenseNote(transaction),
          categoryId,
          selected: !duplicate && selectedByDefault,
          duplicate,
          defaultExcluded: !selectedByDefault,
        };
      });

      setResult(parsed);
      setItems(nextItems);
      setFileName(asset.name);
    } catch (error) {
      console.error(error);
      setResult(null);
      setItems([]);
      setFileName(null);
      setScreenError(
        error instanceof IngCsvParseError || error instanceof Error
          ? error.message
          : 'Die CSV-Datei konnte nicht verarbeitet werden.',
      );
    } finally {
      setBusy(false);
    }
  }

  function updateItem(fingerprint: string, update: Partial<PreparedExpense>) {
    setItems((current) =>
      current.map((item) => (item.fingerprint === fingerprint ? { ...item, ...update } : item)),
    );
  }

  function selectAll(selected: boolean) {
    setItems((current) =>
      current.map((item) => ({ ...item, selected: item.duplicate ? false : selected })),
    );
  }

  async function importSelected() {
    if (selectedItems.length === 0) return;

    setBusy(true);
    setScreenError(null);

    try {
      const importedCount = await createImportedExpenses(
        selectedItems.map((item) => ({
          id: Crypto.randomUUID(),
          categoryId: item.categoryId,
          amountCents: Math.abs(item.transaction.amountCents),
          occurredOn: item.transaction.bookingDate,
          merchant: item.merchant,
          note: item.note,
          importSource: 'ing_csv',
          importFingerprint: item.fingerprint,
        })),
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Import abgeschlossen',
        importedCount === selectedItems.length
          ? `${importedCount} Ausgaben wurden in SpendFox übernommen.`
          : `${importedCount} Ausgaben wurden übernommen. Zwischenzeitlich erkannte Dubletten wurden ausgelassen.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error) {
      console.error(error);
      setScreenError('Die ausgewählten Ausgaben konnten nicht synchronisiert werden.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FormScreen
        disabled={result ? selectedItems.length === 0 : categories.length === 0}
        loading={busy}
        onPrimaryPress={result ? () => void importSelected() : () => void chooseFile()}
        onSecondaryPress={() => router.back()}
        primaryLabel={
          result
            ? `${selectedItems.length} ${selectedItems.length === 1 ? 'Ausgabe' : 'Ausgaben'} importieren`
            : 'ING-CSV auswählen'
        }
      >
        <SurfaceCard style={[styles.infoCard, { backgroundColor: theme.colors.primarySoft }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>
            Lokaler Dateiimport
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.text }]}>
            Die CSV wird auf deinem Gerät ausgewertet. Nur bestätigte Ausgaben werden in deinem
            SpendFox-Konto gespeichert; Gutschriften werden nicht übernommen.
          </Text>
        </SurfaceCard>

        {result ? (
          <>
            <SurfaceCard style={styles.fileCard}>
              <View style={styles.fileHeading}>
                <View style={styles.fileCopy}>
                  <Text numberOfLines={1} style={[styles.fileName, { color: theme.colors.text }]}>
                    {fileName}
                  </Text>
                  <Text style={[styles.fileMeta, { color: theme.colors.textMuted }]}>
                    {result.metadata.accountName ?? 'ING-Konto'} · {maskIban(result.metadata.iban)}
                  </Text>
                  {result.metadata.periodStart && result.metadata.periodEnd ? (
                    <Text style={[styles.fileMeta, { color: theme.colors.textMuted }]}>
                      {formatDate(result.metadata.periodStart)} bis{' '}
                      {formatDate(result.metadata.periodEnd)}
                    </Text>
                  ) : null}
                </View>
                <AppButton
                  icon="document-outline"
                  label="Andere Datei"
                  onPress={() => void chooseFile()}
                  style={styles.changeFileButton}
                  variant="secondary"
                />
              </View>
            </SurfaceCard>

            <SurfaceCard style={styles.summaryCard}>
              <SummaryLine label="Belastungen in der Datei" value={String(items.length)} />
              <SummaryLine label="Gutschriften ausgelassen" value={String(creditCount)} />
              <SummaryLine label="Bereits importiert" value={String(duplicateCount)} />
              <SummaryLine label="Ausgewählt" value={String(selectedItems.length)} />
              <SummaryLine label="Ausgewählte Summe" value={formatEuro(selectedTotal)} strong />
            </SurfaceCard>

            {result.warnings.length > 0 ? (
              <View style={[styles.warningBox, { backgroundColor: theme.colors.dangerSoft }]}>
                <Text style={[styles.warningText, { color: theme.colors.danger }]}>
                  {result.warnings.length}{' '}
                  {result.warnings.length === 1 ? 'Zeile wurde' : 'Zeilen wurden'} wegen ungültiger
                  Daten übersprungen.
                </Text>
              </View>
            ) : null}

            <View style={styles.selectionActions}>
              <AppButton
                disabled={items.every((item) => item.duplicate)}
                label="Alle wählen"
                onPress={() => selectAll(true)}
                style={styles.selectionButton}
                variant="secondary"
              />
              <AppButton
                label="Keine wählen"
                onPress={() => selectAll(false)}
                style={styles.selectionButton}
                variant="ghost"
              />
            </View>

            <View style={styles.transactionList}>
              {items.length > 0 ? (
                items.map((item) => (
                  <SurfaceCard key={item.fingerprint}>
                    <ImportTransactionRow
                      category={categoryMap.get(item.categoryId) ?? null}
                      defaultExcluded={item.defaultExcluded}
                      duplicate={item.duplicate}
                      merchant={item.merchant}
                      onChooseCategory={() => setCategoryTarget(item.fingerprint)}
                      onToggle={() => updateItem(item.fingerprint, { selected: !item.selected })}
                      selected={item.selected}
                      transaction={item.transaction}
                    />
                  </SurfaceCard>
                ))
              ) : (
                <SurfaceCard>
                  <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                    In der Datei wurden keine Belastungen gefunden.
                  </Text>
                </SurfaceCard>
              )}
            </View>
          </>
        ) : (
          <SurfaceCard style={styles.instructions}>
            <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
              So funktioniert der Import
            </Text>
            <Text style={[styles.instructionsText, { color: theme.colors.textMuted }]}>
              Exportiere in der ING-Umsatzanzeige eine CSV-Datei. SpendFox erkennt gebuchte
              Belastungen, schlägt Kategorien vor und zeigt vor dem Speichern eine vollständige
              Vorschau. Wiederholte Importe werden über einen eindeutigen Fingerprint erkannt.
            </Text>
          </SurfaceCard>
        )}

        {screenError ? (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft }]}>
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{screenError}</Text>
          </View>
        ) : null}
      </FormScreen>

      <Modal
        animationType="fade"
        onRequestClose={() => setCategoryTarget(null)}
        transparent
        visible={activeCategoryItem !== null}
      >
        <Pressable onPress={() => setCategoryTarget(null)} style={styles.modalOverlay}>
          <Pressable
            onPress={() => undefined}
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Kategorie wählen</Text>
            <CategoryPicker
              categories={categories}
              onChange={(categoryId) => {
                if (activeCategoryItem) {
                  updateItem(activeCategoryItem.fingerprint, { categoryId });
                }
                setCategoryTarget(null);
              }}
              selectedId={activeCategoryItem?.categoryId ?? null}
            />
            <AppButton label="Schließen" onPress={() => setCategoryTarget(null)} variant="ghost" />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

interface SummaryLineProps {
  label: string;
  value: string;
  strong?: boolean;
}

function SummaryLine({ label, value, strong = false }: SummaryLineProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          strong ? styles.summaryStrong : styles.summaryValue,
          { color: strong ? theme.colors.primary : theme.colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    gap: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
  },
  fileCard: {
    gap: 12,
  },
  fileHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  fileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '800',
  },
  fileMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  changeFileButton: {
    minHeight: 42,
    paddingHorizontal: 12,
  },
  summaryCard: {
    gap: 10,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 14,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  summaryStrong: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  warningBox: {
    borderRadius: 14,
    padding: 13,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  selectionButton: {
    flex: 1,
  },
  transactionList: {
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  instructions: {
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  instructionsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  errorBox: {
    borderRadius: 14,
    padding: 13,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 16,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 18,
    maxHeight: '82%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
});
