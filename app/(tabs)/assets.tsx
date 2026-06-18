import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssetCard } from '@/components/AssetCard';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { SurfaceCard } from '@/components/SurfaceCard';
import { deleteAsset, listAssets } from '@/db/assets';
import { projectDepreciation } from '@/domain/depreciation';
import type { Asset } from '@/domain/models';
import { formatEuro } from '@/domain/money';
import { useAppTheme } from '@/theme/theme';

export default function AssetsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setAssets(await listAssets());
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Die Produkte konnten nicht geladen werden.');
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

  const monthlyCost = useMemo(
    () =>
      assets.reduce((sum, asset) => {
        const projection = projectDepreciation(asset);
        return projection.isComplete ? sum : sum + projection.monthlyCostCents;
      }, 0),
    [assets],
  );

  function confirmDelete(asset: Asset) {
    Alert.alert('Produkt löschen?', `${asset.name} wird aus der Produktkostenrechnung entfernt.`, [
      { style: 'cancel', text: 'Abbrechen' },
      {
        style: 'destructive',
        text: 'Löschen',
        onPress: () => void removeAsset(asset.id),
      },
    ]);
  }

  async function removeAsset(id: string) {
    try {
      await deleteAsset(id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Das Produkt konnte nicht gelöscht werden.');
    }
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        contentContainerStyle={styles.content}
        data={assets}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
          ) : (
            <SurfaceCard>
              <EmptyState
                description="Lege zum Beispiel Laptop, Fernseher oder Haushaltsgerät an."
                icon="cube-outline"
                title="Noch keine Produkte"
              />
            </SurfaceCard>
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader
              action={{
                icon: 'add',
                label: 'Neues Produkt',
                onPress: () => router.push('/assets/new'),
              }}
              description="Produkte und Kosten werden mit deinem Konto synchronisiert."
              title="Produkte"
            />
            {assets.length > 0 ? (
              <View style={[styles.summary, { backgroundColor: theme.colors.primarySoft }]}>
                <View>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                    Produkte
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                    {assets.length}
                  </Text>
                </View>
                <View style={styles.summaryRight}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                    Pro Monat
                  </Text>
                  <Text style={[styles.summaryAmount, { color: theme.colors.primary }]}>
                    {formatEuro(monthlyCost)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        }
        onRefresh={() => void refresh()}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <SurfaceCard>
            <AssetCard asset={item} onDelete={() => confirmDelete(item)} />
          </SurfaceCard>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 },
  header: { gap: 19, marginBottom: 18 },
  summary: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  summaryLabel: { fontSize: 11, fontWeight: '700', marginBottom: 5 },
  summaryValue: { fontSize: 22, fontWeight: '900' },
  summaryRight: { alignItems: 'flex-end' },
  summaryAmount: { fontSize: 21, fontWeight: '900', fontVariant: ['tabular-nums'] },
  separator: { height: 12 },
  loading: { minHeight: 360, alignItems: 'center', justifyContent: 'center' },
});
