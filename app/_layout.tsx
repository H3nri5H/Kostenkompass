import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { LoadingScreen } from '@/components/LoadingScreen';
import { createNavigationTheme, useAppTheme } from '@/theme/theme';

export default function RootLayout() {
  const theme = useAppTheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={createNavigationTheme(theme)}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const theme = useAppTheme();
  const { loading, session } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
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
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ title: 'Konto erstellen' }} />
        </Stack.Protected>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="expenses/new"
            options={{ presentation: 'modal', title: 'Neue Ausgabe' }}
          />
          <Stack.Screen
            name="assets/new"
            options={{ presentation: 'modal', title: 'Neues Produkt' }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}
