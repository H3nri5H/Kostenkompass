import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
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
import { FormField } from '@/components/FormField';
import { SurfaceCard } from '@/components/SurfaceCard';
import { createVehicle } from '@/db/vehicles';
import type { VehicleFuelType } from '@/domain/models';
import { getFuelTypeLabel, parseIntegerInput } from '@/domain/vehicles';
import { useAppTheme } from '@/theme/theme';

const FUEL_TYPES: VehicleFuelType[] = ['diesel', 'petrol', 'hybrid', 'electric', 'other'];

export default function NewCarScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [displayName, setDisplayName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState<VehicleFuelType>('diesel');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [kba, setKba] = useState('');
  const [engineCode, setEngineCode] = useState('');
  const [transmissionCode, setTransmissionCode] = useState('');
  const [year, setYear] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const parsedYear = useMemo(() => (year.trim() ? parseIntegerInput(year) : null), [year]);

  async function save() {
    setFormError(null);

    if (!displayName.trim()) {
      setFormError('Bitte gib einen Anzeigenamen ein, zum Beispiel VW Polo 6RC1.');
      return;
    }

    if (year.trim() && (!parsedYear || parsedYear < 1900 || parsedYear > 2100)) {
      setFormError('Das Baujahr muss zwischen 1900 und 2100 liegen.');
      return;
    }

    setSaving(true);

    try {
      await createVehicle({
        id: Crypto.randomUUID(),
        displayName,
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        fuelType,
        licensePlate: licensePlate.trim() || null,
        vin: vin.trim() || null,
        kba: kba.trim() || null,
        engineCode: engineCode.trim() || null,
        transmissionCode: transmissionCode.trim() || null,
        firstRegistrationYear: parsedYear,
        notes: notes.trim() || null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error(error);
      setFormError('Das Auto konnte nicht gespeichert werden.');
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
            <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Auto-Stammdaten</Text>
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Diese Angaben entsprechen den technischen Blöcken aus der Excel-Datei und können
              später in den Export einfließen.
            </Text>
          </SurfaceCard>

          <FormField
            autoFocus
            label="Anzeigename"
            onChangeText={setDisplayName}
            placeholder="z. B. VW Polo 6RC1"
            value={displayName}
          />
          <FormField
            label="Hersteller"
            onChangeText={setManufacturer}
            placeholder="VW"
            value={manufacturer}
          />
          <FormField
            label="Modell"
            onChangeText={setModel}
            placeholder="Polo 1.4 TDI"
            value={model}
          />

          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Kraftstoffart</Text>
            <View style={styles.fuelOptions}>
              {FUEL_TYPES.map((type) => {
                const selected = fuelType === type;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={type}
                    onPress={() => setFuelType(type)}
                    style={({ pressed }) => [
                      styles.fuelOption,
                      {
                        backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? theme.colors.primary : theme.colors.text,
                        fontWeight: '700',
                      }}
                    >
                      {getFuelTypeLabel(type)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <FormField
            label="Kennzeichen"
            onChangeText={setLicensePlate}
            placeholder="Optional"
            value={licensePlate}
          />
          <FormField label="FIN / VIN" onChangeText={setVin} placeholder="Optional" value={vin} />
          <FormField label="KBA" onChangeText={setKba} placeholder="z. B. 0603 / BNV" value={kba} />
          <FormField
            label="Motorcode"
            onChangeText={setEngineCode}
            placeholder="Optional"
            value={engineCode}
          />
          <FormField
            label="Getriebecode"
            onChangeText={setTransmissionCode}
            placeholder="Optional"
            value={transmissionCode}
          />
          <FormField
            inputMode="numeric"
            keyboardType="number-pad"
            label="Baujahr / Erstzulassung"
            onChangeText={setYear}
            placeholder="Optional"
            value={year}
          />
          <FormField
            label="Notizen"
            multiline
            onChangeText={setNotes}
            placeholder="Optional"
            value={notes}
          />

          {formError ? (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft }]}>
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton label="Auto speichern" loading={saving} onPress={() => void save()} />
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
  group: { gap: 9 },
  label: { fontSize: 14, fontWeight: '700' },
  fuelOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fuelOption: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 10 },
  errorBox: { borderRadius: 14, padding: 13 },
  errorText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  actions: { gap: 8, marginTop: 2 },
});
