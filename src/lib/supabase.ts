import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const configuredPublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(configuredUrl && configuredPublishableKey);

const supabaseUrl = configuredUrl ?? 'https://configuration-required.supabase.co';
const supabasePublishableKey = configuredPublishableKey ?? 'configuration-required';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

type GlobalWithSupabaseRefresh = typeof globalThis & {
  __spendfoxSupabaseRefreshRegistered?: boolean;
};

const globalWithRefresh = globalThis as GlobalWithSupabaseRefresh;

if (Platform.OS !== 'web' && !globalWithRefresh.__spendfoxSupabaseRefreshRegistered) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });

  globalWithRefresh.__spendfoxSupabaseRefreshRegistered = true;
}

export function requireSupabaseConfiguration(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase ist noch nicht konfiguriert. Lege eine .env-Datei anhand von .env.example an.',
    );
  }
}

export async function getAuthenticatedUserId(): Promise<string> {
  requireSupabaseConfiguration();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.user.id) {
    throw new Error('Für diese Aktion ist eine Anmeldung erforderlich.');
  }

  return session.user.id;
}
