import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/LoadingScreen';
import { migrateDatabase } from '@/db/database';
import { createNavigationTheme, useAppTheme } from '@/theme/theme';

export default function RootLayout() {
  const theme = useAppTheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={createNavigationTheme(theme)}>
        <Suspense fallback={<LoadingScreen />}>
          <SQLiteProvider databaseName="kostenkompass.db" onInit={migrateDatabase} useSuspense>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: theme.colors.background },
                headerBackButtonDisplayMode: 'minimal',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.text,
                headerTitleStyle: { fontWeight: '800' },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="expenses/new"
                options={{
                  presentation: 'modal',
                  title: 'Neue Ausgabe',
                }}
              />
              <Stack.Screen
                name="assets/new"
                options={{
                  presentation: 'modal',
                  title: 'Neues Produkt',
                }}
              />
            </Stack>
          </SQLiteProvider>
        </Suspense>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
