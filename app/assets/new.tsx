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
  const [dateOpen, setDateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listCategories()
      .then((items) => {
        if (!active) return;
        setCategories(items);
        setCategoryId(items.find((item) => item.id === 'technik')?.id ?? items[0]?.id ?? null);
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('Fehler', 'Die Kategorien konnten nicht geladen werden.');
      });
    return () => {
      active = false;
    };
  }, []);

  const priceCents = useMemo(() => parseEuroToCents(purchasePrice), [purchasePrice]);
  const residualCents = useMemo(() => parseEuroToCents(residualValue), [residualValue]);
  const lifeMonths = Number(usefulLife);
  const priceError = purchasePrice
    ? validatePositiveCents(priceCents, 'Der Kaufpreis') ?? undefined
    : undefined;
  const residualError = residualValue
    ? validateNonNegativeCents(residualCents, 'Der Restwert') ?? undefined
    : undefined;
  const lifeError =
    usefulLife && (!Number.isInteger(lifeMonths) || lifeMonths < 1 || lifeMonths > 1200)
      ? 'Die Nutzungsdauer muss zwischen 1 und 1200 Monaten liegen.'
      : undefined;
  const preview =
    priceCents !== null &&
    priceCents > 0 &&
    residualCents !== null &&
    residualCents >= 0 &&
    residualCents <= priceCents &&
    Number.isInteger(lifeMonths) &&
    lifeMonths > 0
      ? {
          monthly: calculateMonthlyCostCents(priceCents, residualCents, lifeMonths),
          end: addMonthsIso(purchasedOn, lifeMonths),
        }
      : null;

  async function save() {
    setFormError(null);
    const error =
      requireText(name, 'Die Produktbezeichnung') ??
      validatePositiveCents(priceCents, 'Der Kaufpreis') ??
      validateNonNegativeCents(residualCents, 'Der Restwert') ??
      validateIsoDate(purchasedOn, 'Das Kaufdatum') ??
      (!categoryId ? 'Bitte wähle eine Kategorie.' : null) ??
      lifeError ??
      (priceCents !== null && residualCents !== null && residualCents > priceCents
        ? 'Der Restwert darf den Kaufpreis nicht überschreiten.'
        : null);

    if (error || !categoryId || priceCents === null || residualCents === null) {
      setFormError(error ?? 'Die Eingaben sind unvollständig.');
      return;
    }

    setSaving(true);
    try {
      await createAsset({
        id: Crypto.randomUUID(),
        categoryId,
        name,
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        purchasedOn,
        purchasePriceCents: priceCents,
        residualValueCents: residualCents,
        usefulLifeMonths: lifeMonths,
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
    <FormScreen
      loading={saving}
      onPrimaryPress={() => void save()}
      onSecondaryPress={() => router.back()}
      primaryLabel="Produkt speichern"
    >
      <SurfaceCard style={[styles.info, { backgroundColor: theme.colors.primarySoft }]}> 
        <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Kauf und Nutzung</Text>
        <Text style={[styles.infoText, { color: theme.colors.text }]}> 
          Der Kaufpreis fließt in die Monatsübersicht ein; die Nutzungskosten bleiben separat sichtbar.
        </Text>
      </SurfaceCard>
      <FormField autoFocus label="Produktbezeichnung" maxLength={160} onChangeText={setName} value={name} />
      <FormField label="Hersteller" maxLength={120} onChangeText={setManufacturer} value={manufacturer} />
      <FormField label="Modell" maxLength={120} onChangeText={setModel} value={model} />
      <CategoryPicker categories={categories} onChange={setCategoryId} selectedId={categoryId} />
      <DateField label="Kaufdatum" onChange={setPurchasedOn} onOpenChange={setDateOpen} open={dateOpen} value={purchasedOn} />
      <FormField error={priceError} inputMode="decimal" keyboardType="decimal-pad" label="Kaufpreis" onChangeText={setPurchasePrice} value={purchasePrice} />
      <FormField error={residualError} hint="Erwarteter Wert am Ende der Nutzung." inputMode="decimal" keyboardType="decimal-pad" label="Restwert" onChangeText={setResidualValue} value={residualValue} />
      <FormField error={lifeError} hint="Private wirtschaftliche Nutzung, keine steuerliche AfA." inputMode="numeric" keyboardType="number-pad" label="Nutzungsdauer in Monaten" onChangeText={setUsefulLife} value={usefulLife} />
      {preview ? (
        <SurfaceCard style={[styles.preview, { backgroundColor: theme.colors.primaryStrong }]}> 
          <Text style={[styles.previewAmount, { color: theme.colors.onPrimary }]}> 
            {formatEuro(preview.monthly)} / Monat
          </Text>
          <Text style={[styles.previewMeta, { color: theme.colors.onPrimary }]}> 
            Geplantes Ende am {formatDate(preview.end)}
          </Text>
        </SurfaceCard>
      ) : null}
      <FormField label="Notiz" maxLength={1000} multiline onChangeText={setNote} value={note} />
      {formError ? (
        <View style={[styles.error, { backgroundColor: theme.colors.dangerSoft }]}> 
          <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>{formError}</Text>
        </View>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  info: { gap: 6 },
  infoTitle: { fontSize: 14, fontWeight: '800' },
  infoText: { fontSize: 13, lineHeight: 19 },
  preview: { gap: 5, borderColor: 'transparent' },
  previewAmount: { fontSize: 24, fontWeight: '900' },
  previewMeta: { fontSize: 12 },
  error: { borderRadius: 14, padding: 13 },
});
