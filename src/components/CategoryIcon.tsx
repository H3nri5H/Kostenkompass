import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { CategoryIconName } from '@/domain/models';

interface CategoryIconProps {
  icon: CategoryIconName;
  color: string;
  size?: 'small' | 'regular';
}

export function CategoryIcon({ icon, color, size = 'regular' }: CategoryIconProps) {
  const compact = size === 'small';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${color}20`,
          height: compact ? 34 : 44,
          width: compact ? 34 : 44,
          borderRadius: compact ? 11 : 15,
        },
      ]}
    >
      <Ionicons color={color} name={icon} size={compact ? 17 : 21} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
