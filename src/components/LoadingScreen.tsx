import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/theme';

export function LoadingScreen() {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>
        Kostenkompass wird vorbereitet …
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
