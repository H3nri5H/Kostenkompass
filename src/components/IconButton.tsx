import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '@/theme/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

export function IconButton({ icon, label, onPress, danger = false }: IconButtonProps) {
  const theme = useAppTheme();
  const foreground = danger ? theme.colors.danger : theme.colors.textMuted;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: danger ? theme.colors.dangerSoft : theme.colors.surfaceMuted,
          opacity: pressed ? 0.62 : 1,
        },
      ]}
    >
      <Ionicons color={foreground} name={icon} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
