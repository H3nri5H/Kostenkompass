import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/AuthProvider';
import { AppButton } from '@/components/AppButton';
import { FormField } from '@/components/FormField';
import { SurfaceCard } from '@/components/SurfaceCard';
import { useAppTheme } from '@/theme/theme';

export default function SignInScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { configured, initializationError, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    if (!password) {
      setError('Bitte gib dein Passwort ein.');
      return;
    }

    setBusy(true);

    try {
      await signIn(email, password);
    } catch (signInError) {
      setError(getAuthErrorMessage(signInError));
    } finally {
      setBusy(false);
    }
  }

  const setupError = !configured
    ? 'Supabase ist noch nicht eingerichtet. Kopiere .env.example nach .env und trage Projekt-URL sowie Publishable Key ein.'
    : initializationError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
              <Ionicons
                color={theme.dark ? theme.colors.background : theme.colors.white}
                name="compass-outline"
                size={34}
              />
            </View>
            <Text style={[styles.brandName, { color: theme.colors.text }]}>Kostenkompass</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Melde dich an, um deine Daten sicher auf allen Geräten zu verwenden.
            </Text>
          </View>

          <SurfaceCard style={styles.card}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Anmelden</Text>

            {setupError ? (
              <View style={[styles.notice, { backgroundColor: theme.colors.dangerSoft }]}>
                <Text style={[styles.noticeText, { color: theme.colors.danger }]}>{setupError}</Text>
              </View>
            ) : null}

            <FormField
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              keyboardType="email-address"
              label="E-Mail-Adresse"
              onChangeText={setEmail}
              placeholder="name@beispiel.de"
              textContentType="emailAddress"
              value={email}
            />
            <FormField
              autoCapitalize="none"
              autoComplete="current-password"
              label="Passwort"
              onChangeText={setPassword}
              onSubmitEditing={() => void submit()}
              placeholder="Dein Passwort"
              secureTextEntry
              textContentType="password"
              value={password}
            />

            {error ? (
              <View style={[styles.notice, { backgroundColor: theme.colors.dangerSoft }]}>
                <Text style={[styles.noticeText, { color: theme.colors.danger }]}>{error}</Text>
              </View>
            ) : null}

            <AppButton
              disabled={!configured}
              label="Anmelden"
              loading={busy}
              onPress={() => void submit()}
            />
            <AppButton
              disabled={busy}
              label="Noch kein Konto? Registrieren"
              onPress={() => router.push('/sign-up')}
              variant="ghost"
            />
          </SurfaceCard>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
    gap: 28,
  },
  brand: {
    alignItems: 'center',
    gap: 9,
  },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    maxWidth: 420,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    gap: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  notice: {
    borderRadius: 14,
    padding: 13,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
});
