import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { SurfaceCard } from '@/components/SurfaceCard';
import { listVehicleSummaries } from '@/db/vehicles';
import { formatDate } from '@/domain/dates';
import type { VehicleSummary } from '@/domain/models';
import { formatEuro } from '@/domain/money';
import { getInspectionState } from '@/domain/vehicle-due';
import { formatConsumption, formatLiters, getFuelTypeLabel } from '@/domain/vehicles';
import { useAppTheme } from '@/theme/theme';

export default function CarsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [summaries, setSummaries] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setSummaries(await listVehicleSummaries());
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Die Autos konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        contentContainerStyle={styles.content}
        data={summaries}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.vehicle.id}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
          ) : (
            <SurfaceCard>
              <EmptyState
                description="Lege das erste Auto an. Danach kannst du Tankvorgänge, Kilometerstände und Teile erfassen."
                icon="car-outline"
                title="Noch kein Auto"
              />
            </SurfaceCard>
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader
              action={{
                icon: 'add',
                label: 'Auto erfassen',
                onPress: () => router.push('/cars/new'),
              }}
              description="Tankvorgänge, HU/AU, technische Daten und Teile je Fahrzeug."
              title="Autos"
            />
          </View>
        }
        onRefresh={() => void refresh()}
        refreshing={refreshing}
        renderItem={({ item }) => {
          const inspectionState = getInspectionState(item.vehicle.nextInspectionOn);
          const alertCount = item.openPartCount + item.dueServicePartCount;

          return (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/cars/detail', params: { vehicleId: item.vehicle.id } })
              }
              style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}
            >
              <SurfaceCard>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: theme.colors.primarySoft }]}> 
                    <Ionicons color={theme.colors.primary} name="car-outline" size={24} />
                  </View>
                  <View style={styles.titleCopy}>
                    <Text style={[styles.title, { color: theme.colors.text }]}> 
                      {item.vehicle.displayName}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.textMuted }]}> 
                      {[
                        item.vehicle.manufacturer,
                        item.vehicle.model,
                        getFuelTypeLabel(item.vehicle.fuelType),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <Ionicons color={theme.colors.textMuted} name="chevron-forward" size={20} />
                </View>

                <View style={styles.metrics}>
                  <Metric
                    label="Km-Stand"
                    value={item.lastOdometerKm?.toLocaleString('de-DE') ?? '—'}
                  />
                  <Metric
                    label="Verbrauch"
                    value={formatConsumption(item.averageConsumptionLitersPer100Km)}
                  />
                  <Metric label="Sprit" value={formatLiters(item.totalLiters)} />
                </View>

                {item.vehicle.nextInspectionOn ? (
                  <Text
                    style={[
                      styles.inspection,
                      {
                        color:
                          inspectionState === 'due'
                            ? theme.colors.danger
                            : inspectionState === 'soon'
                              ? theme.colors.warning
                              : theme.colors.textMuted,
                      },
                    ]}
                  >
                    Nächste HU/AU: {formatDate(item.vehicle.nextInspectionOn)}
                  </Text>
                ) : null}

                <View style={[styles.footer, { borderTopColor: theme.colors.border }]}> 
                  <Text style={[styles.footerText, { color: theme.colors.textMuted }]}> 
                    {item.fuelEntryCount} Tankvorgänge · {formatEuro(item.totalFuelCostCents)}
                  </Text>
                  {alertCount > 0 ? (
                    <Text style={[styles.partsBadge, { color: theme.colors.danger }]}> 
                      Hinweise: {alertCount}
                    </Text>
                  ) : null}
                </View>
              </SurfaceCard>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View style={[styles.metric, { backgroundColor: theme.colors.surfaceMuted }]}> 
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 },
  header: { marginBottom: 18 },
  loading: { minHeight: 360, alignItems: 'center', justifyContent: 'center' },
  separator: { height: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCopy: { flex: 1, gap: 3 },
  title: { fontSize: 18, fontWeight: '900' },
  meta: { fontSize: 12, lineHeight: 17 },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 16 },
  metric: { flex: 1, borderRadius: 14, padding: 10, gap: 3 },
  metricLabel: { fontSize: 10, fontWeight: '800' },
  metricValue: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  inspection: { fontSize: 12, fontWeight: '800', marginTop: 12 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  footerText: { fontSize: 12, lineHeight: 17 },
  partsBadge: { fontSize: 12, fontWeight: '800' },
});
