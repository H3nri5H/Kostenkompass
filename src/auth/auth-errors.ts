export function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'E-Mail-Adresse oder Passwort ist falsch.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  }

  if (normalized.includes('user already registered')) {
    return 'Für diese E-Mail-Adresse existiert bereits ein Konto.';
  }

  if (normalized.includes('password should be at least')) {
    return 'Das Passwort erfüllt die Mindestlänge noch nicht.';
  }

  if (normalized.includes('rate limit')) {
    return 'Zu viele Versuche. Bitte versuche es später erneut.';
  }

  if (normalized.includes('fetch') || normalized.includes('network')) {
    return 'Der Server ist momentan nicht erreichbar. Prüfe deine Internetverbindung.';
  }

  if (normalized.includes('supabase ist noch nicht konfiguriert')) {
    return message;
  }

  return message || 'Die Anmeldung konnte nicht abgeschlossen werden.';
}
