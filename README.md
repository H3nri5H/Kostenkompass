# Kostenkompass

Kostenkompass ist eine Expo-/React-Native-App zur geräteübergreifenden Verwaltung persönlicher Ausgaben und Produkte. Anmeldung und Datenspeicherung werden über Supabase bereitgestellt.

## Voraussetzungen

- Git
- Node.js 22 LTS mit npm
- Visual Studio Code
- ein kostenloses Supabase-Konto
- Expo Go für Tests auf einem echten Mobilgerät

Docker ist für diese Variante nicht erforderlich.

## Installation

```powershell
git clone https://github.com/H3nri5H/Kostenkompass.git
cd Kostenkompass
git switch auth-sync
npm ci
```

Bei einem bereits vorhandenen Projektordner:

```powershell
git fetch origin
git switch auth-sync
git pull origin auth-sync
npm ci
```

## Supabase einrichten

1. In Supabase ein kostenloses Projekt erstellen.
2. Im Projekt den SQL Editor öffnen.
3. Den vollständigen Inhalt von `supabase/migrations/20260618153000_auth_sync.sql` einfügen und ausführen.
4. Projekt-URL und den öffentlichen Publishable Key aus dem Supabase-Projekt kopieren.

Die Migration erstellt Kategorien, Ausgaben, Produkte und Row-Level-Security-Regeln. Dadurch darf jeder angemeldete Benutzer ausschließlich seine eigenen Ausgaben und Produkte lesen oder verändern.

## Lokale Konfiguration

```powershell
Copy-Item .env.example .env
```

Die Datei `.env` anschließend in VS Code öffnen:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
```

Verwende nur den für Client-Anwendungen vorgesehenen öffentlichen Schlüssel. Die Datei `.env` wird nicht in Git eingecheckt. Nach Änderungen an `.env` muss der Expo-Server neu gestartet werden.

## Auf einem echten Mobilgerät starten

```powershell
npm start
```

1. Expo Go installieren.
2. Mobilgerät und Rechner mit demselben WLAN verbinden.
3. Den QR-Code aus dem VS-Code-Terminal scannen.
4. Unter Android den Scanner in Expo Go verwenden; unter iOS kann die Kamera-App verwendet werden.

Bei Netzwerkproblemen:

```powershell
npm run start:tunnel
```

Für diesen Testweg werden weder Android Studio noch ein Android SDK benötigt.

## Android-Emulator unter Windows

Die Taste `a` im Expo-Terminal und `npm run android` starten einen lokalen Emulator. Dafür werden Android Studio, das Android SDK, Platform-Tools und ein virtuelles Gerät benötigt.

Das SDK liegt normalerweise unter:

```text
C:\Users\DEIN_BENUTZER\AppData\Local\Android\Sdk
```

Lege die Windows-Benutzervariable `ANDROID_HOME` mit diesem SDK-Pfad an und ergänze `Path` um:

```text
%LOCALAPPDATA%\Android\Sdk\platform-tools
%LOCALAPPDATA%\Android\Sdk\emulator
```

VS Code danach neu starten und prüfen:

```powershell
adb --version
```

Im Android Studio Device Manager anschließend ein virtuelles Gerät erstellen und starten. Danach:

```powershell
npm run android
```

## Browser

```powershell
npm run web
```

## Konto und Synchronisation testen

Beim ersten Start erscheint die Anmeldung. Über **Registrieren** wird ein Konto mit E-Mail-Adresse und Passwort erstellt. Falls die E-Mail-Bestätigung aktiviert ist, muss der Bestätigungslink vor der ersten Anmeldung geöffnet werden.

Zum Testen auf Gerät A eine Ausgabe anlegen und auf Gerät B oder im Browser mit demselben Konto anmelden. Nach dem Aktualisieren sollte die Ausgabe auch dort erscheinen.

Die App speichert in dieser Version direkt in Supabase. Eine vollständige Offline-Synchronisation ist noch nicht enthalten.

## Qualitätsprüfungen

```powershell
npm run verify
npm run bundle:ios
npm run bundle:web
npm run doctor
```

Daten aus der früheren lokalen SQLite-Version werden nicht automatisch übernommen.
