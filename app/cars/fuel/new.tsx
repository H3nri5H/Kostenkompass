import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { FormField } from '@/components/FormField';
import { FormScreen } from '@/components/FormScreen';
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
  const odometerError =
    odometer && odometerKm === null ? 'Der Kilometerstand muss eine ganze Zahl sein.' : undefined;
  const distanceError =
    distance && distanceKm === null ? 'Die Strecke muss eine ganze Zahl sein.' : undefined;
  const litersError =
    liters && (!litersValue || litersValue <= 0) ? 'Die Literangabe muss größer als 0 sein.' : undefined;
  const amountError =
    amount && (amountCents === null || amountCents < 0) ? 'Der Betrag ist ungültig.' : undefined;
  const previewConsumption =
    litersValue && distanceKm && distanceKm > 0 ? (litersValue * 100) / distanceKm : null;

  async function save() {
    setFormError(null);

    const firstError =
      (!vehicleId ? 'Das Auto fehlt.' : null) ??
      (!odometer ? 'Bitte gib den aktuellen Kilometerstand ein.' : null) ??
      odometerError ??
      distanceError ??
      (!liters ? 'Bitte gib die getankten Liter ein.' : null) ??
      litersError ??
      (!amount ? 'Bitte gib den bezahlten Betrag ein.' : null) ??
      amountError;

    if (
      firstError ||
      !vehicleId ||
      odometerKm === null ||
      !litersValue ||
      amountCents === null
    ) {
      setFormError(firstError ?? 'Die Eingaben sind unvollständig.');
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
    <FormScreen
      loading={saving}
      onPrimaryPress={() => void save()}
      onSecondaryPress={() => router.back()}
      primaryLabel="Tankvorgang speichern"
    >
      <SurfaceCard style={[styles.infoCard, { backgroundColor: theme.colors.primarySoft }]}> 
        <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Tankvorgang</Text>
        <Text style={[styles.infoText, { color: theme.colors.text }]}>Preis pro Liter und Verbrauch werden berechnet. Der bezahlte Betrag fließt automatisch in die Monatsübersicht ein.</Text>
      </SurfaceCard>

      <DateField
        label="Datum"
        onChange={setOccurredOn}
        onOpenChange={setDatePickerOpen}
        open={datePickerOpen}
        value={occurredOn}
      />
      <FormField
        error={odometerError}
        inputMode="numeric"
        keyboardType="number-pad"
        label="Kilometerstand"
        onChangeText={setOdometer}
        value={odometer}
      />
      <FormField
        error={distanceError}
        hint="Strecke seit dem letzten relevanten Tankvorgang."
        inputMode="numeric"
        keyboardType="number-pad"
        label="Gefahrene Kilometer"
        onChangeText={setDistance}
        value={distance}
      />
      <FormField
        error={litersError}
        inputMode="decimal"
        keyboardType="decimal-pad"
        label="Getankte Liter"
        onChangeText={setLiters}
        value={liters}
      />
      <FormField
        error={amountError}
        inputMode="decimal"
        keyboardType="decimal-pad"
        label="Betrag"
        onChangeText={setAmount}
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

      <FormField label="Tankstelle" maxLength={160} onChangeText={setStation} value={station} />
      <Pressable
        accessibilityRole="button"
        onPress={() => setFullTank((current) => !current)}
        style={[
          styles.toggle,
          {
            backgroundColor: fullTank ? theme.colors.primarySoft : theme.colors.surface,
            borderColor: fullTank ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.toggleText, { color: theme.colors.text }]}> 
          {fullTank ? 'Vollgetankt' : 'Teilbetankung'}
        </Text>
      </Pressable>
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
});
