import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { VehicleForm } from '@/components/VehicleForm';
import { getVehicle, updateVehicle } from '@/db/vehicles';
import type { Vehicle } from '@/domain/models';
import { useAppTheme } from '@/theme/theme';

export default function EditCarScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    void getVehicle(vehicleId)
      .then(setVehicle)
      .catch((error) => {
        console.error(error);
        Alert.alert('Fehler', 'Die Fahrzeugdaten konnten nicht geladen werden.');
      })
      .finally(() => setLoading(false));
  }, [vehicleId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!vehicle || !vehicleId) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Auto nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <VehicleForm
      initialVehicle={vehicle}
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        await updateVehicle(vehicleId, input);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }}
      submitLabel="Änderungen speichern"
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
