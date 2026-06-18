import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
}

export function ProgressBar({ progress, color }: ProgressBarProps) {
  const theme = useAppTheme();
  const bounded = Math.min(1, Math.max(0, progress));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(bounded * 100) }}
      style={[styles.track, { backgroundColor: theme.colors.surfaceStrong }]}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: color ?? theme.colors.primary,
            width: `${bounded * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
