import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { ExpenseRow } from '@/components/ExpenseRow';
import { PageHeader } from '@/components/PageHeader';
import { SurfaceCard } from '@/components/SurfaceCard';
import { deleteExpense, listExpenses } from '@/db/expenses';
import type { Expense } from '@/domain/models';
import { formatEuro } from '@/domain/money';
import { useAppTheme } from '@/theme/theme';

export default function ExpensesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setExpenses(await listExpenses());
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Die Ausgaben konnten nicht geladen werden.');
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

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amountCents, 0),
    [expenses],
  );

  function confirmDelete(expense: Expense) {
    Alert.alert(
      'Ausgabe löschen?',
      `${expense.merchant || expense.categoryName} wird aus den Auswertungen entfernt.`,
      [
        { style: 'cancel', text: 'Abbrechen' },
        {
          style: 'destructive',
          text: 'Löschen',
          onPress: () => void removeExpense(expense.id),
        },
      ],
    );
  }

  async function removeExpense(id: string) {
    try {
      await deleteExpense(id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (error) {
      console.error(error);
      Alert.alert('Fehler', 'Die Ausgabe konnte nicht gelöscht werden.');
    }
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        contentContainerStyle={styles.content}
        data={expenses}
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
                description="Erfasse eine Zahlung manuell oder importiere gebuchte ING-Umsätze."
                icon="receipt-outline"
                title="Noch keine Ausgaben"
              />
            </SurfaceCard>
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader
              action={{
                icon: 'add',
                label: 'Neue Ausgabe',
                onPress: () => router.push('/expenses/new'),
              }}
              description="Manuell erfasste und importierte Zahlungen an einem Ort."
              title="Ausgaben"
            />
            <AppButton
              icon="download-outline"
              label="ING-CSV importieren"
              onPress={() => router.push('/expenses/import')}
              style={styles.importButton}
              variant="secondary"
            />
            {expenses.length > 0 ? (
              <View style={[styles.summary, { backgroundColor: theme.colors.primarySoft }]}>
                <View>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                    Anzahl
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                    {expenses.length}
                  </Text>
                </View>
                <View style={styles.summaryRight}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                    Summe
                  </Text>
                  <Text style={[styles.summaryAmount, { color: theme.colors.primary }]}>
                    {formatEuro(total)}
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
            <ExpenseRow expense={item} onDelete={() => confirmDelete(item)} />
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
  importButton: { alignSelf: 'flex-start' },
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
