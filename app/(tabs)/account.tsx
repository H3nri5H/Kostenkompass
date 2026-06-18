import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/AuthProvider';
import { AppButton } from '@/components/AppButton';
import { PageHeader } from '@/components/PageHeader';
import { SurfaceCard } from '@/components/SurfaceCard';
import { ThemeModeSelector } from '@/components/ThemeModeSelector';
import { useAppTheme } from '@/theme/theme';

export default function AccountScreen() {
  const theme = useAppTheme();
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);

    try {
      await signOut();
    } catch (error) {
      Alert.alert('Abmeldung fehlgeschlagen', getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          description="Dieses Konto verbindet deine SpendFox-Daten über alle angemeldeten Geräte."
          title="Konto"
        />

        <SurfaceCard style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primarySoft }]}>
            <Ionicons color={theme.colors.primary} name="person-outline" size={28} />
          </View>
          <View style={styles.profileCopy}>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Angemeldet als</Text>
            <Text selectable style={[styles.email, { color: theme.colors.text }]}>
              {user?.email ?? 'Unbekanntes Konto'}
            </Text>
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Darstellung</Text>
          <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
            Hell und Dunkel können unabhängig von der Systemeinstellung gewählt werden.
          </Text>
          <ThemeModeSelector />
        </SurfaceCard>

        <SurfaceCard style={styles.statusCard}>
          <StatusRow
            description="Ausgaben, Produkte und Autos liegen in der Cloud-Datenbank."
            icon="cloud-done-outline"
            title="Geräteübergreifend gespeichert"
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <StatusRow
            description="Serverseitige Regeln erlauben nur den Zugriff auf deine eigenen Datensätze."
            icon="shield-checkmark-outline"
            title="Nach Benutzer getrennt"
          />
        </SurfaceCard>

        <SurfaceCard style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Abmelden</Text>
          <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
            Die Daten bleiben im Konto erhalten. Du kannst dich anschließend auf diesem oder einem
            anderen Gerät erneut anmelden.
          </Text>
          <AppButton
            label="Auf diesem Gerät abmelden"
            loading={busy}
            onPress={() => void logout()}
            variant="danger"
          />
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusRow({
  icon,
  title,
  description,
}: {
  icon: 'cloud-done-outline' | 'shield-checkmark-outline';
  title: string;
  description: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.statusRow}>
      <Ionicons color={theme.colors.primary} name={icon} size={23} />
      <View style={styles.statusCopy}>
        <Text style={[styles.statusTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.statusDescription, { color: theme.colors.textMuted }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 36, gap: 18 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: { flex: 1, gap: 4 },
  label: { fontSize: 12, fontWeight: '700' },
  email: { fontSize: 16, fontWeight: '800' },
  statusCard: { gap: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  statusCopy: { flex: 1, gap: 4 },
  statusTitle: { fontSize: 15, fontWeight: '800' },
  statusDescription: { fontSize: 13, lineHeight: 19 },
  divider: { height: StyleSheet.hairlineWidth },
  infoCard: { gap: 12 },
  infoTitle: { fontSize: 17, fontWeight: '800' },
  infoText: { fontSize: 13, lineHeight: 20 },
});
