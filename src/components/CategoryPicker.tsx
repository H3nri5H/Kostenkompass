import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Category } from '@/domain/models';
import { useAppTheme } from '@/theme/theme';

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string | null;
  onChange: (id: string) => void;
}

export function CategoryPicker({ categories, selectedId, onChange }: CategoryPickerProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>Kategorie</Text>
      <View style={styles.options}>
        {categories.map((category) => {
          const selected = category.id === selectedId;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={category.id}
              onPress={() => onChange(category.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Ionicons
                color={selected ? theme.colors.primary : category.color}
                name={category.icon}
                size={18}
              />
              <Text
                style={[
                  styles.optionLabel,
                  {
                    color: selected ? theme.colors.primary : theme.colors.text,
                  },
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 9,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  option: {
    minHeight: 43,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
