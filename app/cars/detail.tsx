import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { SurfaceCard } from '@/components/SurfaceCard';
import { getVehicle, listVehicleFuelEntries, listVehicleParts } from '@/db/vehicles';
import { formatDate } from '@/domain/dates';
import type { Vehicle, VehicleFuelEntry, VehiclePart } from '@/domain/models';
import { formatEuro } from '@/domain/money';
import { formatConsumption, formatFuelPrice, formatLiters, getFuelTypeLabel, getPartStatusLabel } from '@/domain/vehicles';
import { useAppTheme } from '@/theme/theme';

export default function CarDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const vehicleId = Array.isArray(params.vehicleId) ? params.vehicleId[0] : params.vehicleId;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuelEntries, setFuelEntries] = useState<VehicleFuelEntry[]>([]);
  const [parts, setParts] = useState<VehiclePart[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!vehicleId) return;
    try {
      const [loadedVehicle, loadedFuelEntries, loadedParts] = await Promise.all([
        getVehicle(vehicleId),
        listVehicleFuelEntries(vehicleId),
        listVehicleParts(vehicleId),
      ]);
      setVehicle(loadedVehicle);
      setFuelEntries(loadedFuelEntries);
      setParts(loadedParts);
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Das Auto konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!vehicle || !vehicleId) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Auto nicht gefunden.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          description={[vehicle.manufacturer, vehicle.model, getFuelTypeLabel(vehicle.fuelType)].filter(Boolean).join(' · ')}
          title={vehicle.displayName}
        />
        <View style={styles.actions}>
          <AppButton
            label="Tankvorgang"
            onPress={() => router.push({ pathname: '/cars/fuel/new', params: { vehicleId } })}
            style={styles.action}
          />
          <AppButton
            label="Teil"
            onPress={() => router.push({ pathname: '/cars/parts/new', params: { vehicleId } })}
            style={styles.action}
            variant="secondary"
          />
        </View>
        <SurfaceCard style={styles.specCard}>
          <Spec label="Kennzeichen" value={vehicle.licensePlate} />
          <Spec label="FIN" value={vehicle.vin} />
          <Spec label="KBA" value={vehicle.kba} />
          <Spec label="Motor" value={vehicle.engineCode} />
          <Spec label="Getriebe" value={vehicle.transmissionCode} />
          <Spec label="Baujahr" value={vehicle.firstRegistrationYear?.toString() ?? null} />
        </SurfaceCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tankvorgänge</Text>
        <SurfaceCard>
          {fuelEntries.length === 0 ? (
            <EmptyState description="Noch keine Tankdaten erfasst." icon="car-outline" title="Leer" />
          ) : (
            <View style={styles.list}>
              {fuelEntries.slice(0, 8).map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <Text style={[styles.entryTitle, { color: theme.colors.text }]}>{formatDate(entry.occurredOn)} · {entry.odometerKm.toLocaleString('de-DE')} km</Text>
                  <Text style={[styles.entryMeta, { color: theme.colors.textMuted }]}>{formatLiters(entry.liters)} · {formatEuro(entry.totalCostCents)} · {formatFuelPrice(entry.pricePerLiterCents)}</Text>
                  <Text style={[styles.entryMeta, { color: theme.colors.textMuted }]}>Verbrauch: {formatConsumption(entry.consumptionLitersPer100Km)}</Text>
                </View>
              ))}
            </View>
          )}
        </SurfaceCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Teile</Text>
        <SurfaceCard>
          {parts.length === 0 ? (
            <EmptyState description="Noch keine Teile erfasst." icon="cube-outline" title="Leer" />
          ) : (
            <View style={styles.list}>
              {parts.slice(0, 10).map((part) => (
                <View key={part.id} style={styles.partRow}>
                  <View style={styles.partCopy}>
                    <Text style={[styles.entryTitle, { color: theme.colors.text }]}>{part.name}</Text>
                    <Text style={[styles.entryMeta, { color: theme.colors.textMuted }]}>{[part.manufacturer, part.partNumber, part.specification].filter(Boolean).join(' · ') || 'Keine Teilenummer'}</Text>
                  </View>
                  <Text style={[styles.partStatus, { color: theme.colors.primary }]}>{getPartStatusLabel(part.status)}</Text>
                </View>
              ))}
            </View>
          )}
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function Spec({ label, value }: { label: string; value: string | null }) {
  const theme = useAppTheme();
  return (
    <View style={styles.specItem}>
      <Text style={[styles.specLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text selectable style={[styles.specValue, { color: theme.colors.text }]}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 36, gap: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  specCard: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specItem: { flexBasis: '47%', flexGrow: 1, gap: 3 },
  specLabel: { fontSize: 11, fontWeight: '800' },
  specValue: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  list: { gap: 14 },
  entryRow: { gap: 3 },
  entryTitle: { fontSize: 15, fontWeight: '800' },
  entryMeta: { fontSize: 12, lineHeight: 17 },
  partRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  partCopy: { flex: 1, gap: 3 },
  partStatus: { fontSize: 12, fontWeight: '900' },
});
