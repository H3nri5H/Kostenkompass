import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { DateField } from '@/components/DateField';
import { FormField } from '@/components/FormField';
import { SurfaceCard } from '@/components/SurfaceCard';
import { createVehicleFuelEntry } from '@/db/vehicles';
import { todayIso } from '@/domain/dates';
import { formatEuro, parseEuroToCents } from '@/domain/money';
import { formatConsumption, parseDecimalInput, parseIntegerInput } from '@/domain/vehicles';
import { useAppTheme } from '@/theme/theme';

export default function NewFuelEntryScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [occurredOn, setOccurredOn] = useState(todayIso());
  const [odometer, setOdometer] = useState('');
  const [distance, setDistance] = useState('');
  const [liters, setLiters] = useState('');
  const [amount, setAmount] = useState('');
  const [station, setStation] = useState('');
  const [note, setNote] = useState('');
  const [fullTank, setFullTank] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const odometerKm = useMemo(() => parseIntegerInput(odometer), [odometer]);
  const distanceKm = useMemo(
    () => (distance.trim() ? parseIntegerInput(distance) : null),
    [distance],
  );
  const litersValue = useMemo(() => parseDecimalInput(liters), [liters]);
  const amountCents = useMemo(() => parseEuroToCents(amount), [amount]);
  const previewConsumption =
    litersValue && distanceKm && distanceKm > 0 ? (litersValue * 100) / distanceKm : null;

  async function save() {
    setFormError(null);

    if (!vehicleId) {
      setFormError('Das Auto fehlt. Bitte öffne den Tankvorgang aus einem Auto heraus.');
      return;
    }

    if (odometerKm === null) {
      setFormError('Bitte gib den aktuellen Kilometerstand ein.');
      return;
    }

    if (!litersValue || litersValue <= 0) {
      setFormError('Bitte gib die getankten Liter ein.');
      return;
    }

    if (amountCents === null || amountCents < 0) {
      setFormError('Bitte gib den bezahlten Betrag ein.');
      return;
    }

    setSaving(true);
    try {
      await createVehicleFuelEntry({
        id: Crypto.randomUUID(),
        vehicleId,
        occurredOn,
        odometerKm,
        distanceKm,
        liters: litersValue,
        totalCostCents: amountCents,
        station: station.trim() || null,
        fullTank,
        note: note.trim() || null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error(error);
      setFormError('Der Tankvorgang konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SurfaceCard style={[styles.infoCard, { backgroundColor: theme.colors.primarySoft }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Tankvorgang</Text>
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Die App berechnet Preis pro Liter und Verbrauch automatisch, sobald Strecke und Liter
              vorhanden sind.
            </Text>
          </SurfaceCard>

          <DateField
            label="Datum"
            onChange={setOccurredOn}
            onOpenChange={setDatePickerOpen}
            open={datePickerOpen}
            value={occurredOn}
          />
          <FormField
            inputMode="numeric"
            keyboardType="number-pad"
            label="Kilometerstand"
            onChangeText={setOdometer}
            placeholder="z. B. 137200"
            value={odometer}
          />
          <FormField
            inputMode="numeric"
            keyboardType="number-pad"
            label="Gefahrene Kilometer"
            onChangeText={setDistance}
            placeholder="Optional, z. B. 819"
            value={distance}
          />
          <FormField
            inputMode="decimal"
            keyboardType="decimal-pad"
            label="Getankte Liter"
            onChangeText={setLiters}
            placeholder="z. B. 42,51"
            value={liters}
          />
          <FormField
            inputMode="decimal"
            keyboardType="decimal-pad"
            label="Betrag"
            onChangeText={setAmount}
            placeholder="z. B. 65,42"
            value={amount}
          />

          {amountCents !== null && litersValue ? (
            <SurfaceCard style={styles.preview}>
              <Text style={[styles.previewText, { color: theme.colors.text }]}>
                Preis: {formatEuro(Math.round(amountCents / litersValue))} pro Liter
              </Text>
              <Text style={[styles.previewText, { color: theme.colors.text }]}>
                Verbrauch: {formatConsumption(previewConsumption)}
              </Text>
            </SurfaceCard>
          ) : null}

          <FormField
            label="Tankstelle"
            onChangeText={setStation}
            placeholder="Optional"
            value={station}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setFullTank((current) => !current)}
            style={[
              styles.toggle,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.toggleText, { color: theme.colors.text }]}>
              {fullTank ? 'Vollgetankt' : 'Teilbetankung'}
            </Text>
          </Pressable>
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
            <AppButton label="Speichern" loading={saving} onPress={() => void save()} />
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
  flex: { flex: 1 },
  content: { padding: 18, paddingBottom: 34, gap: 18 },
  infoCard: { gap: 6 },
  infoTitle: { fontSize: 14, fontWeight: '800' },
  infoText: { fontSize: 13, lineHeight: 19 },
  preview: { gap: 5 },
  previewText: { fontSize: 14, fontWeight: '700' },
  toggle: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  toggleText: { fontSize: 15, fontWeight: '700' },
  errorBox: { borderRadius: 14, padding: 13 },
  errorText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  actions: { gap: 8, marginTop: 2 },
});
