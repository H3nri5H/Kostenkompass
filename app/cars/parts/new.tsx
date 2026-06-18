import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { VehiclePartForm } from '@/components/VehiclePartForm';
import { createVehiclePart } from '@/db/vehicles';
import { useAppTheme } from '@/theme/theme';

export default function NewVehiclePartScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;

  if (!vehicleId) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Auto nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <VehiclePartForm
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        await createVehiclePart({ id: Crypto.randomUUID(), ...input });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }}
      submitLabel="Teil speichern"
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
