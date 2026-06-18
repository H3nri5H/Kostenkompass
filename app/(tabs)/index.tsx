import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
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
import { CategoryIcon } from '@/components/CategoryIcon';
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
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useAppTheme();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setSummary(await getDashboardSummary(db));
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Die Übersicht konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const heroBackground = theme.dark ? '#184B38' : theme.colors.primaryStrong;
  const heroMuted = '#D1E6DA';

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
          description="Zahlungen und langfristige Produktkosten bleiben bewusst getrennt."
          eyebrow={summary.monthLabel || 'Aktueller Monat'}
          title="Übersicht"
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : (
          <>
            <SurfaceCard
              style={[
                styles.hero,
                {
                  backgroundColor: heroBackground,
                  borderColor: heroBackground,
                },
              ]}
            >
              <Text style={[styles.heroLabel, { color: heroMuted }]}>Ausgaben in diesem Monat</Text>
              <Text style={styles.heroAmount}>{formatEuro(summary.monthExpenseCents)}</Text>

              <View style={styles.heroDivider} />

              <View style={styles.heroMetrics}>
                <View style={styles.heroMetric}>
                  <View style={styles.heroMetricLabel}>
                    <Ionicons color={heroMuted} name="time-outline" size={16} />
                    <Text style={[styles.heroMetricTitle, { color: heroMuted }]}>
                      Produkte / Monat
                    </Text>
                  </View>
                  <Text style={styles.heroMetricValue}>
                    {formatEuro(summary.monthlyAssetCostCents)}
                  </Text>
                </View>

                <View style={styles.heroMetric}>
                  <View style={styles.heroMetricLabel}>
                    <Ionicons color={heroMuted} name="wallet-outline" size={16} />
                    <Text style={[styles.heroMetricTitle, { color: heroMuted }]}>
                      Rechnerischer Wert
                    </Text>
                  </View>
                  <Text style={styles.heroMetricValue}>
                    {formatEuro(summary.activeAssetValueCents)}
                  </Text>
                </View>
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

            <SectionHeader
              description="Tatsächliche Zahlungen im aktuellen Kalendermonat"
              title="Nach Kategorie"
            />

            <SurfaceCard>
              {summary.categoryTotals.length === 0 ? (
                <EmptyState
                  description="Sobald du eine Zahlung erfasst, erscheint hier die Verteilung."
                  icon="pie-chart-outline"
                  title="Noch keine Monatsausgaben"
                />
              ) : (
                <View style={styles.categoryList}>
                  {summary.categoryTotals.map((category) => {
                    const share =
                      summary.monthExpenseCents > 0
                        ? category.amountCents / summary.monthExpenseCents
                        : 0;

                    return (
                      <View key={category.categoryId} style={styles.categoryRow}>
                        <CategoryIcon
                          color={category.categoryColor}
                          icon={category.categoryIcon}
                          size="small"
                        />
                        <View style={styles.categoryCopy}>
                          <View style={styles.categoryHeader}>
                            <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                              {category.categoryName}
                            </Text>
                            <Text style={[styles.categoryAmount, { color: theme.colors.text }]}>
                              {formatEuro(category.amountCents)}
                            </Text>
                          </View>
                          <ProgressBar color={category.categoryColor} progress={share} />
                        </View>
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
                  description="Deine neuesten Zahlungen werden hier angezeigt."
                  icon="receipt-outline"
                  title="Keine Ausgaben vorhanden"
                />
              ) : (
                <View>
                  {summary.recentExpenses.map((expense, index) => (
                    <View
                      key={expense.id}
                      style={[
                        index > 0 && styles.recentDivider,
                        index > 0 && { borderTopColor: theme.colors.border },
                        index > 0 && styles.recentPadding,
                      ]}
                    >
                      <ExpenseRow compact expense={expense} />
                    </View>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 20,
  },
  loading: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    padding: 21,
    gap: 7,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 45,
    fontWeight: '900',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF40',
    marginVertical: 12,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: 20,
  },
  heroMetric: {
    flex: 1,
    gap: 7,
  },
  heroMetricLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetricTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroMetricValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: 11,
  },
  action: {
    flex: 1,
  },
  categoryList: {
    gap: 17,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryCopy: {
    flex: 1,
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  recentDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  recentPadding: {
    paddingTop: 14,
    marginTop: 14,
  },
});
