import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type ThemeMode, useAppTheme, useThemePreference } from '@/theme/theme';

const OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: 'phone-portrait-outline' | 'sunny-outline' | 'moon-outline';
}[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Hell', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dunkel', icon: 'moon-outline' },
];

export function ThemeModeSelector() {
  const theme = useAppTheme();
  const { mode, setMode } = useThemePreference();

  return (
    <View style={styles.options}>
      {OPTIONS.map((option) => {
        const selected = option.mode === mode;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.mode}
            onPress={() => void setMode(option.mode)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surfaceMuted,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Ionicons
              color={selected ? theme.colors.primary : theme.colors.textMuted}
              name={option.icon}
              size={20}
            />
            <Text
              style={[styles.label, { color: selected ? theme.colors.primary : theme.colors.text }]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
  },
});
