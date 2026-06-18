import { StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { IconButton } from '@/components/IconButton';
import { ProgressBar } from '@/components/ProgressBar';
import { formatDate, todayIso } from '@/domain/dates';
import { projectDepreciation } from '@/domain/depreciation';
import type { Asset } from '@/domain/models';
import { formatEuro } from '@/domain/money';
import { useAppTheme } from '@/theme/theme';

interface AssetCardProps {
  asset: Asset;
  onDelete: () => void;
}

export function AssetCard({ asset, onDelete }: AssetCardProps) {
  const theme = useAppTheme();
  const projection = projectDepreciation(asset);
  const futurePurchase = asset.purchasedOn > todayIso();
  const productDetails = [asset.manufacturer, asset.model].filter(Boolean).join(' · ');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CategoryIcon color={asset.categoryColor} icon={asset.categoryIcon} />
        <View style={styles.titleColumn}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
            {asset.name}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            {productDetails || asset.categoryName}
          </Text>
        </View>
        <IconButton danger icon="trash-outline" label="Produkt löschen" onPress={onDelete} />
      </View>

      <View style={styles.costRow}>
        <View>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Rechnerische Kosten</Text>
          <Text style={[styles.monthlyCost, { color: theme.colors.primary }]}>
            {formatEuro(projection.monthlyCostCents)}
            <Text style={styles.perMonth}> / Monat</Text>
          </Text>
        </View>
        <View style={styles.valueColumn}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Aktueller Wert</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {formatEuro(projection.currentValueCents)}
          </Text>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>
            {futurePurchase
              ? 'Noch nicht begonnen'
              : projection.isComplete
                ? 'Nutzungsdauer erreicht'
                : `${projection.remainingMonths} Monate verbleibend`}
          </Text>
          <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>
            {Math.round(projection.progress * 100)} %
          </Text>
        </View>
        <ProgressBar color={asset.categoryColor} progress={projection.progress} />
      </View>

      <Text style={[styles.footer, { color: theme.colors.textMuted }]}>
        Kauf {formatDate(asset.purchasedOn)} · geplant bis {formatDate(projection.endsOn)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 17,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  meta: {
    fontSize: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  monthlyCost: {
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  perMonth: {
    fontSize: 12,
    fontWeight: '700',
  },
  valueColumn: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressBlock: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    fontSize: 11,
    lineHeight: 16,
  },
});
