import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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

export default function SignUpScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { configured, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    if (password !== confirmation) {
      setError('Die beiden Passwörter stimmen nicht überein.');
      return;
    }

    setBusy(true);

    try {
      const result = await signUp(email, password);

      if (result.requiresEmailConfirmation) {
        Alert.alert(
          'E-Mail bestätigen',
          'Dein Konto wurde angelegt. Bestätige deine E-Mail und melde dich danach an.',
          [{ text: 'Zur Anmeldung', onPress: () => router.replace('/sign-in') }],
        );
      } else {
        router.replace('/');
      }
    } catch (signUpError) {
      setError(getAuthErrorMessage(signUpError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Konto erstellen</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Deine Daten werden diesem Konto zugeordnet und geräteübergreifend gespeichert.
            </Text>
          </View>

          <SurfaceCard style={styles.card}>
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
              autoComplete="new-password"
              hint="Mindestens 8 Zeichen."
              label="Passwort"
              onChangeText={setPassword}
              placeholder="Neues Passwort"
              secureTextEntry
              textContentType="newPassword"
              value={password}
            />
            <FormField
              autoCapitalize="none"
              autoComplete="new-password"
              label="Passwort wiederholen"
              onChangeText={setConfirmation}
              onSubmitEditing={() => void submit()}
              placeholder="Passwort wiederholen"
              secureTextEntry
              textContentType="newPassword"
              value={confirmation}
            />

            {error ? (
              <View style={[styles.notice, { backgroundColor: theme.colors.dangerSoft }]}>
                <Text style={[styles.noticeText, { color: theme.colors.danger }]}>{error}</Text>
              </View>
            ) : null}

            <AppButton
              disabled={!configured}
              label="Registrieren"
              loading={busy}
              onPress={() => void submit()}
            />
            <AppButton
              disabled={busy}
              label="Zurück zur Anmeldung"
              onPress={() => router.replace('/sign-in')}
              variant="ghost"
            />
          </SurfaceCard>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 36,
    gap: 22,
  },
  intro: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    gap: 7,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    gap: 18,
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
