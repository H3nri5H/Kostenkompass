import { StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { IconButton } from '@/components/IconButton';
import { formatDate } from '@/domain/dates';
import type { Expense } from '@/domain/models';
import { formatEuro } from '@/domain/money';
import { useAppTheme } from '@/theme/theme';

interface ExpenseRowProps {
  expense: Expense;
  onDelete?: () => void;
  compact?: boolean;
}

export function ExpenseRow({ expense, onDelete, compact = false }: ExpenseRowProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <CategoryIcon
        color={expense.categoryColor}
        icon={expense.categoryIcon}
        size={compact ? 'small' : 'regular'}
      />
      <View style={styles.copy}>
        <Text
          numberOfLines={1}
          style={[compact ? styles.compactTitle : styles.title, { color: theme.colors.text }]}
        >
          {expense.merchant || expense.categoryName}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
          {expense.categoryName} · {formatDate(expense.occurredOn)}
        </Text>
        {!compact && expense.note ? (
          <Text numberOfLines={2} style={[styles.note, { color: theme.colors.textMuted }]}>
            {expense.note}
          </Text>
        ) : null}
      </View>
      <View style={styles.amountColumn}>
        <Text style={[styles.amount, { color: theme.colors.text }]}>
          {formatEuro(expense.amountCents)}
        </Text>
        {onDelete ? (
          <IconButton danger icon="trash-outline" label="Ausgabe löschen" onPress={onDelete} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  compactRow: {
    minHeight: 52,
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    paddingTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  amountColumn: {
    alignItems: 'flex-end',
    gap: 9,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
