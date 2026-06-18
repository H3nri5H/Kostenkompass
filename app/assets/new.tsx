import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
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
import { createAsset } from '@/db/assets';
import { listCategories } from '@/db/categories';
import { addMonthsIso, formatDate, todayIso } from '@/domain/dates';
import { calculateMonthlyCostCents } from '@/domain/depreciation';
import type { Category } from '@/domain/models';
import { formatEuro, parseEuroToCents } from '@/domain/money';
import {
  requireText,
  validateIsoDate,
  validateNonNegativeCents,
  validatePositiveCents,
} from '@/domain/validation';
import { useAppTheme } from '@/theme/theme';

export default function NewAssetScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useAppTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [purchasedOn, setPurchasedOn] = useState(todayIso());
  const [purchasePrice, setPurchasePrice] = useState('');
  const [residualValue, setResidualValue] = useState('0');
  const [usefulLife, setUsefulLife] = useState('48');
  const [note, setNote] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void listCategories(db)
      .then((result) => {
        if (!mounted) {
          return;
        }

        setCategories(result);
        const technology = result.find((category) => category.id === 'technik');
        setCategoryId(technology?.id ?? result[0]?.id ?? null);
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('Fehler', 'Die Kategorien konnten nicht geladen werden.');
      });

    return () => {
      mounted = false;
    };
  }, [db]);

  const purchasePriceCents = useMemo(() => parseEuroToCents(purchasePrice), [purchasePrice]);
  const residualValueCents = useMemo(() => parseEuroToCents(residualValue), [residualValue]);
  const usefulLifeMonths = Number(usefulLife);

  const preview = useMemo(() => {
    if (
      purchasePriceCents === null ||
      purchasePriceCents <= 0 ||
      residualValueCents === null ||
      residualValueCents < 0 ||
      residualValueCents > purchasePriceCents ||
      !Number.isInteger(usefulLifeMonths) ||
      usefulLifeMonths <= 0
    ) {
      return null;
    }

    return {
      monthlyCostCents: calculateMonthlyCostCents(
        purchasePriceCents,
        residualValueCents,
        usefulLifeMonths,
      ),
      endsOn: addMonthsIso(purchasedOn, usefulLifeMonths),
    };
  }, [purchasePriceCents, purchasedOn, residualValueCents, usefulLifeMonths]);

  async function save() {
    setFormError(null);

    const validationError =
      requireText(name, 'Die Produktbezeichnung') ??
      validatePositiveCents(purchasePriceCents, 'Der Kaufpreis') ??
      validateNonNegativeCents(residualValueCents, 'Der Restwert') ??
      validateIsoDate(purchasedOn, 'Das Kaufdatum') ??
      (!categoryId ? 'Bitte wähle eine Kategorie.' : null) ??
      (!Number.isInteger(usefulLifeMonths) || usefulLifeMonths < 1 || usefulLifeMonths > 1200
        ? 'Die Nutzungsdauer muss zwischen 1 und 1200 Monaten liegen.'
        : null) ??
      (purchasePriceCents !== null &&
      residualValueCents !== null &&
      residualValueCents > purchasePriceCents
        ? 'Der Restwert darf den Kaufpreis nicht überschreiten.'
        : null);

    if (
      validationError ||
      !categoryId ||
      purchasePriceCents === null ||
      residualValueCents === null
    ) {
      setFormError(validationError ?? 'Die Eingaben sind unvollständig.');
      return;
    }

    setSaving(true);

    try {
      await createAsset(db, {
        id: Crypto.randomUUID(),
        categoryId,
        name,
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        purchasedOn,
        purchasePriceCents,
        residualValueCents,
        usefulLifeMonths,
        note: note.trim() || null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error(error);
      setFormError('Das Produkt konnte nicht gespeichert werden.');
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
            <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>
              Produktkosten statt Doppelzählung
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Ein Produkt erzeugt keine automatische Ausgabe. Erfasse den Kauf zusätzlich unter
              „Ausgaben“, wenn er im Cashflow erscheinen soll.
            </Text>
          </SurfaceCard>

          <FormField
            autoCapitalize="sentences"
            autoFocus
            label="Produktbezeichnung"
            onChangeText={setName}
            placeholder="z. B. MacBook Air"
            value={name}
          />

          <View style={styles.fieldGroup}>
            <FormField
              autoCapitalize="words"
              label="Hersteller"
              onChangeText={setManufacturer}
              placeholder="Optional"
              value={manufacturer}
            />
            <FormField
              label="Modell"
              onChangeText={setModel}
              placeholder="Optional"
              value={model}
            />
          </View>

          <CategoryPicker
            categories={categories}
            onChange={setCategoryId}
            selectedId={categoryId}
          />

          <DateField
            label="Kaufdatum"
            onChange={setPurchasedOn}
            onOpenChange={setDatePickerOpen}
            open={datePickerOpen}
            value={purchasedOn}
          />

          <FormField
            inputMode="decimal"
            keyboardType="decimal-pad"
            label="Kaufpreis"
            onChangeText={setPurchasePrice}
            placeholder="0,00 €"
            value={purchasePrice}
          />

          <FormField
            hint="Erwarteter Wert am Ende der geplanten Nutzung."
            inputMode="decimal"
            keyboardType="decimal-pad"
            label="Restwert"
            onChangeText={setResidualValue}
            placeholder="0,00 €"
            value={residualValue}
          />

          <FormField
            hint="Private wirtschaftliche Nutzung, keine steuerliche AfA."
            inputMode="numeric"
            keyboardType="number-pad"
            label="Nutzungsdauer in Monaten"
            onChangeText={setUsefulLife}
            placeholder="48"
            value={usefulLife}
          />

          {preview ? (
            <SurfaceCard
              style={[
                styles.preview,
                {
                  backgroundColor: theme.colors.primaryStrong,
                  borderColor: theme.colors.primaryStrong,
                },
              ]}
            >
              <Text style={styles.previewLabel}>Vorschau</Text>
              <Text style={styles.previewAmount}>
                {formatEuro(preview.monthlyCostCents)}
                <Text style={styles.previewSuffix}> / Monat</Text>
              </Text>
              <Text style={styles.previewMeta}>Geplantes Ende am {formatDate(preview.endsOn)}</Text>
            </SurfaceCard>
          ) : null}

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
            <AppButton label="Produkt speichern" loading={saving} onPress={() => void save()} />
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
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 32,
    gap: 18,
  },
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
  fieldGroup: {
    gap: 18,
  },
  preview: {
    gap: 5,
  },
  previewLabel: {
    color: '#D1E6DA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  previewAmount: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  previewSuffix: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewMeta: {
    color: '#D1E6DA',
    fontSize: 12,
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
  actions: {
    gap: 8,
    marginTop: 2,
  },
});
