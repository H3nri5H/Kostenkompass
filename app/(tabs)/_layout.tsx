import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icons: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'grid', inactive: 'grid-outline' },
  expenses: { active: 'receipt', inactive: 'receipt-outline' },
  assets: { active: 'cube', inactive: 'cube-outline' },
  cars: { active: 'car', inactive: 'car-outline' },
  account: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function TabsLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const icon = icons[route.name] ?? icons.index!;

        return {
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSubtle,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 58 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 7),
            paddingTop: 7,
          },
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={focused ? icon.active : icon.inactive} size={size} />
          ),
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Übersicht' }} />
      <Tabs.Screen name="expenses" options={{ title: 'Ausgaben' }} />
      <Tabs.Screen name="assets" options={{ title: 'Produkte' }} />
      <Tabs.Screen name="cars" options={{ title: 'Autos' }} />
      <Tabs.Screen name="account" options={{ title: 'Konto' }} />
    </Tabs>
  );
}
