import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { CategoryPicker } from '@/components/CategoryPicker';
import { DateField } from '@/components/DateField';
import { FormField } from '@/components/FormField';
import { SurfaceCard } from '@/components/SurfaceCard';
import { listCategories } from '@/db/categories';
import { createExpense } from '@/db/expenses';
import { todayIso } from '@/domain/dates';
import type { Category } from '@/domain/models';
import { formatEuro, parseEuroToCents } from '@/domain/money';
import { validateIsoDate, validatePositiveCents } from '@/domain/validation';
import { useAppTheme } from '@/theme/theme';

export default function NewExpenseScreen() {
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

    void listCategories()
      .then((result) => {
        if (!mounted) {
          return;
        }
        setCategories(result);
        setCategoryId(result[0]?.id ?? null);
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
  const amountError = amount.length > 0 ? validatePositiveCents(amountCents, 'Der Betrag') : null;

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={92}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SurfaceCard
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.colors.primarySoft,
                borderColor: theme.colors.primarySoft,
              },
            ]}
          >
            <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Cloud-Zahlung</Text>
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Die Ausgabe wird deinem Konto zugeordnet und ist danach auf deinen anderen Geräten
              verfügbar.
            </Text>
          </SurfaceCard>

          <FormField
            autoFocus
            error={amountError ?? undefined}
            inputMode="decimal"
            keyboardType="decimal-pad"
            label="Betrag"
            onChangeText={setAmount}
            placeholder="0,00 €"
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
            onChangeText={setMerchant}
            placeholder="Optional"
            value={merchant}
          />

          <CategoryPicker
            categories={categories}
            onChange={setCategoryId}
            selectedId={categoryId}
          />

          <DateField
            label="Datum"
            onChange={setOccurredOn}
            onOpenChange={setDatePickerOpen}
            open={datePickerOpen}
            value={occurredOn}
          />

          <FormField
            label="Notiz"
            multiline
            onChangeText={setNote}
            placeholder="Optional"
            value={note}
          />

          {formError ? (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft }]}>
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton label="Ausgabe speichern" loading={saving} onPress={() => void save()} />
            <AppButton
              disabled={saving}
              label="Abbrechen"
              onPress={() => router.back()}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 32, gap: 18 },
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
  actions: { gap: 8, marginTop: 2 },
});
