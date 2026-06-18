import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { formatDate, parseIsoDate, toIsoDate } from '@/domain/dates';
import { useAppTheme } from '@/theme/theme';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DateField({ label, value, onChange, open, onOpenChange }: DateFieldProps) {
  const theme = useAppTheme();
  const date = parseIsoDate(value) ?? new Date();

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      onOpenChange(false);
    }

    if (event.type === 'set' && selectedDate) {
      onChange(toIsoDate(selectedDate));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => onOpenChange(!open)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.colors.surface,
            borderColor: open ? theme.colors.primary : theme.colors.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Ionicons color={theme.colors.primary} name="calendar-outline" size={20} />
        <Text style={[styles.value, { color: theme.colors.text }]}>{formatDate(value)}</Text>
        <Ionicons
          color={theme.colors.textMuted}
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
        />
      </Pressable>

      {open ? (
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <DateTimePicker
            accentColor={theme.colors.primary}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={new Date()}
            mode="date"
            onChange={handleChange}
            themeVariant={theme.dark ? 'dark' : 'light'}
            value={date}
          />
          {Platform.OS === 'ios' ? (
            <AppButton
              label="Datum übernehmen"
              onPress={() => onOpenChange(false)}
              variant="secondary"
            />
          ) : null}
        </View>
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
  trigger: {
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  value: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    overflow: 'hidden',
  },
});
