# Kostenkompass

Kostenkompass ist eine Expo-/React-Native-App zur geräteübergreifenden Verwaltung persönlicher Ausgaben, langlebiger Produkte und Fahrzeugdaten. Anmeldung und Datenspeicherung werden über Supabase bereitgestellt.

## Voraussetzungen

- Git
- Node.js 22 LTS mit npm
- Visual Studio Code
- ein kostenloses Supabase-Konto
- Expo Go für Tests auf einem echten Mobilgerät

Docker ist nicht erforderlich.

## Installation

```powershell
git clone https://github.com/H3nri5H/Kostenkompass.git
cd Kostenkompass
npm ci
```

Bei einem vorhandenen Projektordner:

```powershell
git switch main
git pull origin main
npm ci
```

## Supabase einrichten

Erstelle ein Supabase-Projekt und führe im SQL Editor diese Migrationen in der angegebenen Reihenfolge aus:

```text
supabase/migrations/20260618153000_auth_sync.sql
supabase/migrations/20260618172000_vehicle_logbook.sql
```

Die Migrationen erstellen Benutzerkonten-Anbindung, Kategorien, Ausgaben, Produkte, Fahrzeuge, Tankvorgänge, Teilelisten und die Row-Level-Security-Regeln. Jeder angemeldete Benutzer darf ausschließlich seine eigenen Datensätze lesen und verändern.

## Lokale Konfiguration

```powershell
Copy-Item .env.example .env
```

Öffne `.env` in VS Code und trage die öffentlichen Supabase-Werte ein:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
```

Verwende ausschließlich den öffentlichen Publishable Key beziehungsweise den öffentlichen `anon`-Key. Ein `service_role`- oder Secret-Key darf niemals in die App oder in GitHub gelangen. Nach Änderungen an `.env` muss der Expo-Server neu gestartet werden.

## Auf einem echten Mobilgerät starten

```powershell
npm start
```

1. Expo Go auf dem Mobilgerät installieren.
2. Mobilgerät und Rechner mit demselben WLAN verbinden.
3. Den QR-Code aus dem VS-Code-Terminal scannen.
4. Unter Android den Scanner in Expo Go verwenden; unter iOS kann die Kamera-App verwendet werden.

Bei Netzwerkproblemen:

```powershell
npm run start:tunnel
```

Für diesen Testweg werden weder Android Studio noch ein Android SDK benötigt.

## Im Browser starten

```powershell
npm run web
```

## Android-Emulator unter Windows

Für `npm run android` beziehungsweise die Taste `a` im Expo-Terminal werden Android Studio, Android SDK Platform-Tools und ein gestartetes virtuelles Gerät benötigt.

Das SDK liegt normalerweise unter:

```text
C:\Users\DEIN_BENUTZER\AppData\Local\Android\Sdk
```

Lege die Windows-Benutzervariable `ANDROID_HOME` mit diesem Pfad an und ergänze `Path` um:

```text
%LOCALAPPDATA%\Android\Sdk\platform-tools
%LOCALAPPDATA%\Android\Sdk\emulator
```

Starte VS Code danach neu und prüfe:

```powershell
adb --version
```

Erstelle und starte anschließend im Android Studio Device Manager ein virtuelles Gerät:

```powershell
npm run android
```

## Konto und Synchronisation testen

Beim ersten Start erscheint die Anmeldung. Über **Registrieren** wird ein Konto mit E-Mail-Adresse und Passwort erstellt. Falls die E-Mail-Bestätigung in Supabase aktiviert ist, muss der Bestätigungslink vor der ersten Anmeldung geöffnet werden.

Zum Testen der Synchronisation:

1. Auf Gerät A anmelden und eine Ausgabe, ein Produkt oder ein Fahrzeug anlegen.
2. Auf Gerät B oder im Browser dasselbe Konto verwenden.
3. Den jeweiligen Bildschirm aktualisieren.

Die Daten sollten auch auf dem zweiten Gerät erscheinen. Eine vollständige Offline-Warteschlange ist noch nicht enthalten.

## Qualitätsprüfungen

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test -- --runInBand
npm run bundle:ios
npm run bundle:web
npm run doctor
```

Die GitHub-Actions-CI führt dieselben Kernprüfungen bei Pull Requests und Änderungen an `main` aus. Eine Deployment-Pipeline ist für den aktuellen Expo-Go-MVP bewusst nicht eingerichtet.

## Hinweise

- Daten aus der früheren lokalen SQLite-Version werden nicht automatisch übernommen.
- Der Fahrzeugbereich unterstützt aktuell Stammdaten, Tankvorgänge und Teilelisten.
- Excel-Import und -Export sind noch nicht enthalten.
