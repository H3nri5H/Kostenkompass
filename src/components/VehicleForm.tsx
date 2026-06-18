import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { FormField } from '@/components/FormField';
import { FormScreen } from '@/components/FormScreen';
import { SurfaceCard } from '@/components/SurfaceCard';
import {
  normalizeLicensePlate,
  normalizeUppercase,
  normalizeVin,
  validateKba,
  validateLicensePlate,
  validateVehicleCode,
  validateVin,
  validateYear,
} from '@/domain/field-validation';
import type { Vehicle, VehicleFuelType, VehicleInput } from '@/domain/models';
import { getFuelTypeLabel, parseIntegerInput } from '@/domain/vehicles';
import { useAppTheme } from '@/theme/theme';

const FUEL_TYPES: VehicleFuelType[] = ['diesel', 'petrol', 'hybrid', 'electric', 'other'];

interface VehicleFormProps {
  initialVehicle?: Vehicle;
  submitLabel: string;
  onSubmit: (input: VehicleInput) => Promise<void>;
  onCancel: () => void;
}

export function VehicleForm({ initialVehicle, submitLabel, onSubmit, onCancel }: VehicleFormProps) {
  const theme = useAppTheme();
  const [displayName, setDisplayName] = useState(initialVehicle?.displayName ?? '');
  const [manufacturer, setManufacturer] = useState(initialVehicle?.manufacturer ?? '');
  const [model, setModel] = useState(initialVehicle?.model ?? '');
  const [fuelType, setFuelType] = useState<VehicleFuelType>(initialVehicle?.fuelType ?? 'diesel');
  const [licensePlate, setLicensePlate] = useState(initialVehicle?.licensePlate ?? '');
  const [vin, setVin] = useState(initialVehicle?.vin ?? '');
  const [kba, setKba] = useState(initialVehicle?.kba ?? '');
  const [engineCode, setEngineCode] = useState(initialVehicle?.engineCode ?? '');
  const [transmissionCode, setTransmissionCode] = useState(initialVehicle?.transmissionCode ?? '');
  const [year, setYear] = useState(initialVehicle?.firstRegistrationYear?.toString() ?? '');
  const [lastInspectionOn, setLastInspectionOn] = useState(initialVehicle?.lastInspectionOn ?? '');
  const [nextInspectionOn, setNextInspectionOn] = useState(initialVehicle?.nextInspectionOn ?? '');
  const [notes, setNotes] = useState(initialVehicle?.notes ?? '');
  const [lastInspectionOpen, setLastInspectionOpen] = useState(false);
  const [nextInspectionOpen, setNextInspectionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const parsedYear = useMemo(() => (year.trim() ? parseIntegerInput(year) : null), [year]);
  const licensePlateError = validateLicensePlate(licensePlate) ?? undefined;
  const vinError = validateVin(vin) ?? undefined;
  const kbaError = validateKba(kba) ?? undefined;
  const engineCodeError = validateVehicleCode(engineCode, 'Der Motorcode') ?? undefined;
  const transmissionCodeError =
    validateVehicleCode(transmissionCode, 'Der Getriebecode') ?? undefined;
  const yearError = validateYear(parsedYear) ?? undefined;

  async function submit() {
    setFormError(null);

    const firstError =
      (!displayName.trim() ? 'Bitte gib einen Anzeigenamen ein.' : null) ??
      licensePlateError ??
      vinError ??
      kbaError ??
      engineCodeError ??
      transmissionCodeError ??
      yearError ??
      (lastInspectionOn && nextInspectionOn && nextInspectionOn < lastInspectionOn
        ? 'Der nächste HU/AU-Termin darf nicht vor dem letzten Termin liegen.'
        : null);

    if (firstError) {
      setFormError(firstError);
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        displayName: displayName.trim(),
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        fuelType,
        licensePlate: licensePlate.trim() ? normalizeLicensePlate(licensePlate) : null,
        vin: vin.trim() ? normalizeVin(vin) : null,
        kba: kba.trim() ? normalizeUppercase(kba) : null,
        engineCode: engineCode.trim() ? normalizeUppercase(engineCode) : null,
        transmissionCode: transmissionCode.trim() ? normalizeUppercase(transmissionCode) : null,
        firstRegistrationYear: parsedYear,
        lastInspectionOn: lastInspectionOn || null,
        nextInspectionOn: nextInspectionOn || null,
        notes: notes.trim() || null,
      });
    } catch (error) {
      console.error(error);
      setFormError('Die Fahrzeugdaten konnten nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen
      loading={saving}
      onPrimaryPress={() => void submit()}
      onSecondaryPress={onCancel}
      primaryLabel={submitLabel}
    >
      <SurfaceCard style={[styles.infoCard, { backgroundColor: theme.colors.primarySoft }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Fahrzeugdaten</Text>
        <Text style={[styles.infoText, { color: theme.colors.text }]}>
          Stammdaten und HU/AU-Termine können jederzeit erneut bearbeitet werden.
        </Text>
      </SurfaceCard>

      <FormField
        autoFocus={!initialVehicle}
        label="Anzeigename"
        maxLength={160}
        onChangeText={setDisplayName}
        value={displayName}
      />
      <FormField
        autoCapitalize="words"
        label="Hersteller"
        maxLength={100}
        onChangeText={setManufacturer}
        value={manufacturer}
      />
      <FormField label="Modell" maxLength={120} onChangeText={setModel} value={model} />

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Kraftstoffart</Text>
        <View style={styles.options}>
          {FUEL_TYPES.map((type) => {
            const selected = fuelType === type;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={type}
                onPress={() => setFuelType(type)}
                style={({ pressed }) => [
                  styles.option,
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
        autoCapitalize="characters"
        error={licensePlateError}
        label="Kennzeichen"
        maxLength={12}
        onChangeText={setLicensePlate}
        value={licensePlate}
      />
      <FormField
        autoCapitalize="characters"
        error={vinError}
        label="FIN / VIN"
        maxLength={20}
        onChangeText={setVin}
        value={vin}
      />
      <FormField
        autoCapitalize="characters"
        error={kbaError}
        label="KBA (HSN / TSN)"
        maxLength={16}
        onChangeText={setKba}
        value={kba}
      />
      <FormField
        autoCapitalize="characters"
        error={engineCodeError}
        label="Motorcode"
        maxLength={20}
        onChangeText={setEngineCode}
        value={engineCode}
      />
      <FormField
        autoCapitalize="characters"
        error={transmissionCodeError}
        label="Getriebecode"
        maxLength={20}
        onChangeText={setTransmissionCode}
        value={transmissionCode}
      />
      <FormField
        error={yearError}
        inputMode="numeric"
        keyboardType="number-pad"
        label="Baujahr / Erstzulassung"
        maxLength={4}
        onChangeText={setYear}
        value={year}
      />

      <DateField
        label="Letzte HU/AU"
        onChange={setLastInspectionOn}
        onOpenChange={setLastInspectionOpen}
        open={lastInspectionOpen}
        optional
        value={lastInspectionOn}
      />
      <DateField
        label="Nächste HU/AU"
        maximumDate={null}
        onChange={setNextInspectionOn}
        onOpenChange={setNextInspectionOpen}
        open={nextInspectionOpen}
        optional
        value={nextInspectionOn}
      />

      <FormField label="Notizen" maxLength={1000} multiline onChangeText={setNotes} value={notes} />

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
  group: { gap: 9 },
  label: { fontSize: 14, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 10 },
  errorBox: { borderRadius: 14, padding: 13 },
  errorText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
