import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { VehiclePartForm } from '@/components/VehiclePartForm';
import { getVehiclePart, updateVehiclePart } from '@/db/vehicles';
import type { VehiclePart } from '@/domain/models';
import { useAppTheme } from '@/theme/theme';

export default function EditVehiclePartScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ vehicleId?: string; partId?: string }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const partId = Array.isArray(params.partId) ? params.partId[0] : params.partId;
  const [part, setPart] = useState<VehiclePart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partId) {
      setLoading(false);
      return;
    }

    void getVehiclePart(partId)
      .then(setPart)
      .catch((error) => {
        console.error(error);
        Alert.alert('Fehler', 'Das Teil konnte nicht geladen werden.');
      })
      .finally(() => setLoading(false));
  }, [partId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!part || !partId || !vehicleId) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Teil nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <VehiclePartForm
      initialPart={part}
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        await updateVehiclePart(partId, input);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }}
      submitLabel="Änderungen speichern"
      vehicleId={vehicleId}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
