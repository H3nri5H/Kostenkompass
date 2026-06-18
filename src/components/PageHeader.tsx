import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    icon: IconName;
    onPress: () => void;
  };
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>{eyebrow}</Text>
        ) : null}
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
        ) : null}
      </View>

      {action ? (
        <Pressable
          accessibilityLabel={action.label}
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Ionicons
            color={theme.dark ? '#102018' : theme.colors.white}
            name={action.icon}
            size={23}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.15,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 520,
  },
  action: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
