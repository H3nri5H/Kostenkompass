import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { ExpenseRow } from '@/components/ExpenseRow';
import { PageHeader } from '@/components/PageHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { SectionHeader } from '@/components/SectionHeader';
import { SurfaceCard } from '@/components/SurfaceCard';
import { getDashboardSummary } from '@/db/dashboard';
import type { DashboardSummary } from '@/domain/models';
import { formatEuro } from '@/domain/money';
import { useAppTheme } from '@/theme/theme';

const EMPTY_SUMMARY: DashboardSummary = {
  monthLabel: '',
  monthExpenseCents: 0,
  monthlyAssetCostCents: 0,
  activeAssetValueCents: 0,
  categoryTotals: [],
  recentExpenses: [],
};

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setSummary(await getDashboardSummary());
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Die Übersicht konnte nicht geladen werden.');
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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void refresh()}
            refreshing={refreshing}
            tintColor={theme.colors.primary}
          />
        }
      >
        <PageHeader
          description="Deine synchronisierten Kosten auf allen Geräten."
          eyebrow={summary.monthLabel || 'Aktueller Monat'}
          title="Übersicht"
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <>
            <SurfaceCard style={[styles.hero, { backgroundColor: theme.colors.primaryStrong }]}>
              <Text style={styles.heroLabel}>Ausgaben in diesem Monat</Text>
              <Text style={styles.heroAmount}>{formatEuro(summary.monthExpenseCents)}</Text>
              <View style={styles.metrics}>
                <Metric
                  label="Produkte / Monat"
                  value={formatEuro(summary.monthlyAssetCostCents)}
                />
                <Metric label="Produktwert" value={formatEuro(summary.activeAssetValueCents)} />
              </View>
            </SurfaceCard>

            <View style={styles.actions}>
              <AppButton
                icon="add"
                label="Ausgabe"
                onPress={() => router.push('/expenses/new')}
                style={styles.action}
              />
              <AppButton
                icon="cube-outline"
                label="Produkt"
                onPress={() => router.push('/assets/new')}
                style={styles.action}
                variant="secondary"
              />
            </View>

            <SectionHeader title="Nach Kategorie" />
            <SurfaceCard>
              {summary.categoryTotals.length === 0 ? (
                <EmptyState
                  description="Erfasse eine Zahlung, um die Verteilung zu sehen."
                  icon="pie-chart-outline"
                  title="Noch keine Monatsausgaben"
                />
              ) : (
                <View style={styles.list}>
                  {summary.categoryTotals.map((category) => {
                    const progress =
                      summary.monthExpenseCents > 0
                        ? category.amountCents / summary.monthExpenseCents
                        : 0;
                    return (
                      <View key={category.categoryId} style={styles.category}>
                        <View style={styles.row}>
                          <Text style={[styles.name, { color: theme.colors.text }]}>
                            {category.categoryName}
                          </Text>
                          <Text style={[styles.amount, { color: theme.colors.text }]}>
                            {formatEuro(category.amountCents)}
                          </Text>
                        </View>
                        <ProgressBar color={category.categoryColor} progress={progress} />
                      </View>
                    );
                  })}
                </View>
              )}
            </SurfaceCard>

            <SectionHeader title="Zuletzt erfasst" />
            <SurfaceCard>
              {summary.recentExpenses.length === 0 ? (
                <EmptyState
                  description="Neue Zahlungen erscheinen hier."
                  icon="receipt-outline"
                  title="Keine Ausgaben vorhanden"
                />
              ) : (
                <View style={styles.list}>
                  {summary.recentExpenses.map((expense) => (
                    <ExpenseRow compact expense={expense} key={expense.id} />
                  ))}
                </View>
              )}
            </SurfaceCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 36, gap: 20 },
  loading: { minHeight: 360, alignItems: 'center', justifyContent: 'center' },
  hero: { gap: 8, borderColor: 'transparent' },
  heroLabel: { color: '#D1E6DA', fontSize: 13, fontWeight: '700' },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metrics: { flexDirection: 'row', gap: 12, marginTop: 12 },
  metric: { flex: 1, gap: 4 },
  metricLabel: { color: '#D1E6DA', fontSize: 11, fontWeight: '700' },
  metricValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  list: { gap: 16 },
  category: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  name: { fontSize: 14, fontWeight: '700' },
  amount: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
