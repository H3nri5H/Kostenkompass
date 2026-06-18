import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { useAppTheme } from '@/theme/theme';

interface FormScreenProps extends PropsWithChildren {
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function FormScreen({
  children,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel = 'Abbrechen',
  onSecondaryPress,
  loading = false,
  disabled = false,
}: FormScreenProps) {
  const theme = useAppTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <AppButton
            disabled={disabled}
            label={primaryLabel}
            loading={loading}
            onPress={onPrimaryPress}
            style={styles.primaryAction}
          />
          {onSecondaryPress ? (
            <AppButton
              disabled={loading}
              label={secondaryLabel}
              onPress={onSecondaryPress}
              variant="ghost"
            />
          ) : null}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 30,
    gap: 18,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 4,
  },
  primaryAction: {
    width: '100%',
  },
});
