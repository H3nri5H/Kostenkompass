import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useAppTheme } from '@/theme/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
}

export function FormField({ label, hint, error, multiline, style, ...props }: FormFieldProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={theme.colors.textSubtle}
        selectionColor={theme.colors.primary}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            color: theme.colors.text,
          },
          style,
        ]}
      />
      {error ? (
        <Text style={[styles.supporting, { color: theme.colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.supporting, { color: theme.colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 16,
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  supporting: {
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 2,
  },
});
