import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { CategoryPicker } from '@/components/CategoryPicker';
import { DateField } from '@/components/DateField';
import { FormField } from '@/components/FormField';
import { FormScreen } from '@/components/FormScreen';
import { SurfaceCard } from '@/components/SurfaceCard';
import { listCategories } from '@/db/categories';
import { createExpense } from '@/db/expenses';
import { todayIso } from '@/domain/dates';
import type { Category } from '@/domain/models';
import { formatEuro, parseEuroToCents } from '@/domain/money';
import { validateIsoDate, validatePositiveCents } from '@/domain/validation';
import { useAppTheme } from '@/theme/theme';

export default function ExpenseForm() {
  const router = useRouter();
  const theme = useAppTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [occurredOn, setOccurredOn] = useState(todayIso());
  const [note, setNote] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void listCategories('expense')
      .then((result) => {
        if (!mounted) return;
        setCategories(result);
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('Fehler', 'Die Kategorien konnten nicht geladen werden.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const amountCents = useMemo(() => parseEuroToCents(amount), [amount]);
  const amountError = amount
    ? (validatePositiveCents(amountCents, 'Der Betrag') ?? undefined)
    : undefined;

  async function save() {
    setFormError(null);

    const validationError =
      validatePositiveCents(amountCents, 'Der Betrag') ??
      validateIsoDate(occurredOn, 'Das Datum') ??
      (!categoryId ? 'Bitte wähle eine Kategorie.' : null);

    if (validationError || amountCents === null || !categoryId) {
      setFormError(validationError ?? 'Die Eingaben sind unvollständig.');
      return;
    }

    setSaving(true);

    try {
      await createExpense({
        id: Crypto.randomUUID(),
        categoryId,
        amountCents,
        occurredOn,
        merchant: merchant.trim() || null,
        note: note.trim() || null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error(error);
      setFormError('Die Ausgabe konnte nicht synchronisiert werden.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen
      loading={saving}
      onPrimaryPress={() => void save()}
      onSecondaryPress={() => router.back()}
      primaryLabel="Ausgabe speichern"
    >
      <SurfaceCard style={[styles.infoCard, { backgroundColor: theme.colors.primarySoft }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Ausgabe</Text>
        <Text style={[styles.infoText, { color: theme.colors.text }]}>
          Die Zahlung wird deinem Konto zugeordnet und erscheint sofort in der Übersicht.
        </Text>
      </SurfaceCard>

      <FormField
        autoFocus
        error={amountError}
        inputMode="decimal"
        keyboardType="decimal-pad"
        label="Betrag"
        onChangeText={setAmount}
        style={styles.amountInput}
        value={amount}
      />
      {amountCents !== null && amountCents > 0 ? (
        <Text style={[styles.amountPreview, { color: theme.colors.success }]}>
          Erkannt: {formatEuro(amountCents)}
        </Text>
      ) : null}

      <FormField
        autoCapitalize="words"
        label="Händler oder Empfänger"
        maxLength={160}
        onChangeText={setMerchant}
        value={merchant}
      />
      <CategoryPicker categories={categories} onChange={setCategoryId} selectedId={categoryId} />
      <DateField
        label="Datum"
        onChange={setOccurredOn}
        onOpenChange={setDatePickerOpen}
        open={datePickerOpen}
        value={occurredOn}
      />
      <FormField label="Notiz" maxLength={1000} multiline onChangeText={setNote} value={note} />

      {formError ? (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft }]}>
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{formError}</Text>
        </View>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  infoCard: { gap: 6 },
  infoTitle: { fontSize: 14, fontWeight: '800' },
  infoText: { fontSize: 13, lineHeight: 19 },
  amountInput: {
    minHeight: 66,
    fontSize: 27,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  amountPreview: { fontSize: 12, fontWeight: '700', marginTop: -11, paddingHorizontal: 2 },
  errorBox: { borderRadius: 14, padding: 13 },
  errorText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
