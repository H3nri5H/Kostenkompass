import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { FormScreen } from '@/components/FormScreen';
import { SurfaceCard } from '@/components/SurfaceCard';
import { validateHttpUrl } from '@/domain/field-validation';
import type { VehiclePart, VehiclePartInput, VehiclePartStatus } from '@/domain/models';
import { getPartStatusLabel, parseIntegerInput } from '@/domain/vehicles';
import { useAppTheme } from '@/theme/theme';

const STATUSES: VehiclePartStatus[] = ['ok', 'low_stock', 'needed', 'ordered', 'installed'];

interface VehiclePartFormProps {
  vehicleId: string;
  initialPart?: VehiclePart;
  submitLabel: string;
  onSubmit: (input: VehiclePartInput) => Promise<void>;
  onCancel: () => void;
}

export function VehiclePartForm({
  vehicleId,
  initialPart,
  submitLabel,
  onSubmit,
  onCancel,
}: VehiclePartFormProps) {
  const theme = useAppTheme();
  const [name, setName] = useState(initialPart?.name ?? '');
  const [manufacturer, setManufacturer] = useState(initialPart?.manufacturer ?? '');
  const [partNumber, setPartNumber] = useState(initialPart?.partNumber ?? '');
  const [specification, setSpecification] = useState(initialPart?.specification ?? '');
  const [location, setLocation] = useState(initialPart?.location ?? '');
  const [productUrl, setProductUrl] = useState(initialPart?.productUrl ?? '');
  const [lastReplacementKm, setLastReplacementKm] = useState(
    initialPart?.lastReplacedOdometerKm?.toString() ?? '',
  );
  const [intervalKm, setIntervalKm] = useState(
    initialPart?.replacementIntervalKm?.toString() ?? '',
  );
  const [status, setStatus] = useState<VehiclePartStatus>(initialPart?.status ?? 'needed');
  const [note, setNote] = useState(initialPart?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const lastReplacedOdometerKm = useMemo(
    () => (lastReplacementKm.trim() ? parseIntegerInput(lastReplacementKm) : null),
    [lastReplacementKm],
  );
  const replacementIntervalKm = useMemo(
    () => (intervalKm.trim() ? parseIntegerInput(intervalKm) : null),
    [intervalKm],
  );
  const urlError = validateHttpUrl(productUrl) ?? undefined;
  const lastReplacementError =
    lastReplacementKm && lastReplacedOdometerKm === null
      ? 'Der Kilometerstand muss eine ganze, nicht negative Zahl sein.'
      : undefined;
  const intervalError =
    intervalKm && (replacementIntervalKm === null || replacementIntervalKm <= 0)
      ? 'Das Wechselintervall muss eine positive ganze Zahl sein.'
      : undefined;

  async function submit() {
    setFormError(null);

    const firstError =
      (!name.trim() ? 'Bitte gib einen Teilenamen ein.' : null) ??
      urlError ??
      lastReplacementError ??
      intervalError;

    if (firstError) {
      setFormError(firstError);
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        vehicleId,
        name: name.trim(),
        manufacturer: manufacturer.trim() || null,
        partNumber: partNumber.trim() || null,
        specification: specification.trim() || null,
        location: location.trim() || null,
        productUrl: productUrl.trim() || null,
        lastReplacedOdometerKm,
        replacementIntervalKm,
        status,
        note: note.trim() || null,
      });
    } catch (error) {
      console.error(error);
      setFormError('Das Teil konnte nicht gespeichert werden.');
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
        <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Teilespezifikation</Text>
        <Text style={[styles.infoText, { color: theme.colors.text }]}>Produktlink und Wechselintervall sind optional. Bei erreichtem Kilometerziel wird das Teil im Auto hervorgehoben.</Text>
      </SurfaceCard>

      <FormField autoFocus={!initialPart} label="Teilname" maxLength={160} onChangeText={setName} value={name} />
      <FormField autoCapitalize="words" label="Hersteller" maxLength={120} onChangeText={setManufacturer} value={manufacturer} />
      <FormField autoCapitalize="characters" label="Teilenummer" maxLength={80} onChangeText={setPartNumber} value={partNumber} />
      <FormField label="Spezifikation" maxLength={240} onChangeText={setSpecification} value={specification} />
      <FormField label="Einbauort" maxLength={160} onChangeText={setLocation} value={location} />
      <FormField
        autoCapitalize="none"
        autoCorrect={false}
        error={urlError}
        inputMode="url"
        keyboardType="url"
        label="Produkt-URL"
        onChangeText={setProductUrl}
        value={productUrl}
      />
      <FormField
        error={lastReplacementError}
        inputMode="numeric"
        keyboardType="number-pad"
        label="Letzter Tausch bei Kilometerstand"
        onChangeText={setLastReplacementKm}
        value={lastReplacementKm}
      />
      <FormField
        error={intervalError}
        hint="Nach dieser Fahrleistung wird der nächste Tausch fällig."
        inputMode="numeric"
        keyboardType="number-pad"
        label="Wechselintervall in Kilometern"
        onChangeText={setIntervalKm}
        value={intervalKm}
      />

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Status</Text>
        <View style={styles.options}>
          {STATUSES.map((option) => {
            const selected = option === status;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option}
                onPress={() => setStatus(option)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text style={{ color: selected ? theme.colors.primary : theme.colors.text, fontWeight: '700' }}>
                  {getPartStatusLabel(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
  group: { gap: 9 },
  label: { fontSize: 14, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 10 },
  errorBox: { borderRadius: 14, padding: 13 },
  errorText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
