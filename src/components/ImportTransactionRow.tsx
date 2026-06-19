import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { formatDate } from '@/domain/dates';
import type { IngCsvTransaction } from '@/domain/ing-csv';
import type { Category } from '@/domain/models';
import { formatEuro } from '@/domain/money';
import { useAppTheme } from '@/theme/theme';

interface ImportTransactionRowProps {
  transaction: IngCsvTransaction;
  merchant: string | null;
  category: Category | null;
  selected: boolean;
  duplicate: boolean;
  defaultExcluded: boolean;
  onToggle: () => void;
  onChooseCategory: () => void;
}

export function ImportTransactionRow({
  transaction,
  merchant,
  category,
  selected,
  duplicate,
  defaultExcluded,
  onToggle,
  onChooseCategory,
}: ImportTransactionRowProps) {
  const theme = useAppTheme();
  const statusLabel = duplicate
    ? 'Bereits importiert'
    : defaultExcluded && !selected
      ? 'Zur Prüfung nicht vorausgewählt'
      : null;

  return (
    <View style={[styles.container, duplicate && styles.disabled]}>
      <Pressable
        accessibilityLabel={selected ? 'Buchung abwählen' : 'Buchung auswählen'}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected, disabled: duplicate }}
        disabled={duplicate}
        hitSlop={8}
        onPress={onToggle}
        style={styles.checkbox}
      >
        <Ionicons
          color={duplicate ? theme.colors.textSubtle : theme.colors.primary}
          name={
            duplicate ? 'remove-circle-outline' : selected ? 'checkmark-circle' : 'ellipse-outline'
          }
          size={25}
        />
      </Pressable>

      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
            {merchant || 'Unbekannter Empfänger'}
          </Text>
          <Text style={[styles.amount, { color: theme.colors.text }]}>
            {formatEuro(Math.abs(transaction.amountCents))}
          </Text>
        </View>

        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
          {formatDate(transaction.bookingDate)} · {transaction.bookingText}
        </Text>
        {transaction.purpose ? (
          <Text numberOfLines={2} style={[styles.purpose, { color: theme.colors.textMuted }]}>
            {transaction.purpose}
          </Text>
        ) : null}

        <Pressable
          accessibilityLabel="Kategorie ändern"
          accessibilityRole="button"
          disabled={duplicate}
          onPress={onChooseCategory}
          style={({ pressed }) => [
            styles.category,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              opacity: duplicate ? 0.55 : pressed ? 0.7 : 1,
            },
          ]}
        >
          {category ? (
            <CategoryIcon color={category.color} icon={category.icon} size="small" />
          ) : null}
          <Text style={[styles.categoryLabel, { color: theme.colors.text }]}>
            {category?.name ?? 'Kategorie wählen'}
          </Text>
          {!duplicate ? (
            <Ionicons color={theme.colors.textMuted} name="chevron-forward" size={16} />
          ) : null}
        </Pressable>

        {statusLabel ? (
          <Text
            style={[
              styles.status,
              { color: duplicate ? theme.colors.textSubtle : theme.colors.warning },
            ]}
          >
            {statusLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  disabled: {
    opacity: 0.68,
  },
  checkbox: {
    paddingTop: 1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '800',
  },
  amount: {
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
  },
  purpose: {
    fontSize: 12,
    lineHeight: 17,
  },
  category: {
    minHeight: 42,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  status: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
});
