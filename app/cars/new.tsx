import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { VehicleForm } from '@/components/VehicleForm';
import { createVehicle } from '@/db/vehicles';

export default function NewCarScreen() {
  const router = useRouter();

  return (
    <VehicleForm
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        await createVehicle({ id: Crypto.randomUUID(), ...input });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }}
      submitLabel="Auto speichern"
    />
  );
}
