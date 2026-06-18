import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { FormField } from '@/components/FormField';
import { SurfaceCard } from '@/components/SurfaceCard';
import { createVehiclePart } from '@/db/vehicles';
import type { VehiclePartStatus } from '@/domain/models';
import { getPartStatusLabel, parseDecimalInput } from '@/domain/vehicles';
import { useAppTheme } from '@/theme/theme';

const STATUSES: VehiclePartStatus[] = ['ok', 'low_stock', 'needed', 'ordered', 'installed'];

export default function NewVehiclePartScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [specification, setSpecification] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [threshold, setThreshold] = useState('');
  const [status, setStatus] = useState<VehiclePartStatus>('needed');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function save() {
    setFormError(null);

    if (!vehicleId) {
      setFormError('Das Auto fehlt. Bitte öffne die Teileerfassung aus einem Auto heraus.');
      return;
    }

    if (!name.trim()) {
      setFormError('Bitte gib einen Teilenamen ein, zum Beispiel Ölfilter.');
      return;
    }

    const quantityOnHand = quantity.trim() ? parseDecimalInput(quantity) : null;
    const reorderThreshold = threshold.trim() ? parseDecimalInput(threshold) : null;

    if (quantity.trim() && quantityOnHand === null) {
      setFormError('Der Bestand ist keine gültige Zahl.');
      return;
    }

    if (threshold.trim() && reorderThreshold === null) {
      setFormError('Die Bestellgrenze ist keine gültige Zahl.');
      return;
    }

    setSaving(true);

    try {
      await createVehiclePart({
        id: Crypto.randomUUID(),
        vehicleId,
        name,
        manufacturer: manufacturer.trim() || null,
        partNumber: partNumber.trim() || null,
        specification: specification.trim() || null,
        location: location.trim() || null,
        quantityOnHand,
        reorderThreshold,
        status,
        note: note.trim() || null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error(error);
      setFormError('Das Teil konnte nicht gespeichert werden.');
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
            <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Teil oder Verbrauchsmaterial</Text>
            <Text style={[styles.infoText, { color: theme.colors.text }]}>Hier landen Ölfilter, Luftfilter, Leuchtmittel, Scheibenwischer und ähnliche fahrzeugspezifische Daten aus der Excel-Datei.</Text>
          </SurfaceCard>

          <FormField autoFocus label="Teilname" onChangeText={setName} placeholder="z. B. Ölfilter" value={name} />
          <FormField label="Hersteller" onChangeText={setManufacturer} placeholder="z. B. Bosch" value={manufacturer} />
          <FormField label="Teilenummer" onChangeText={setPartNumber} placeholder="z. B. F026407153" value={partNumber} />
          <FormField label="Spezifikation" onChangeText={setSpecification} placeholder="z. B. R5502 Kohle" value={specification} />
          <FormField label="Einbauort" onChangeText={setLocation} placeholder="z. B. Innenbeleuchtung hinten" value={location} />

          <View style={styles.statusGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Status</Text>
            <View style={styles.statusOptions}>
              {STATUSES.map((option) => {
                const selected = option === status;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option}
                    onPress={() => setStatus(option)}
                    style={({ pressed }) => [
                      styles.statusOption,
                      {
                        backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: selected ? theme.colors.primary : theme.colors.text, fontWeight: '700' }}>{getPartStatusLabel(option)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <FormField inputMode="decimal" keyboardType="decimal-pad" label="Bestand" onChangeText={setQuantity} placeholder="Optional" value={quantity} />
          <FormField inputMode="decimal" keyboardType="decimal-pad" label="Bestellgrenze" onChangeText={setThreshold} placeholder="Optional" value={threshold} />
          <FormField label="Notiz" multiline onChangeText={setNote} placeholder="Optional" value={note} />

          {formError ? (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerSoft }]}>
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton label="Teil speichern" loading={saving} onPress={() => void save()} />
            <AppButton disabled={saving} label="Abbrechen" onPress={() => router.back()} variant="ghost" />
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
  statusGroup: { gap: 9 },
  label: { fontSize: 14, fontWeight: '700' },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusOption: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 10 },
  errorBox: { borderRadius: 14, padding: 13 },
  errorText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  actions: { gap: 8, marginTop: 2 },
});
