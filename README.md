# SpendFox

SpendFox ist eine Expo-/React-Native-App zur geräteübergreifenden Verwaltung persönlicher Ausgaben, langlebiger Anschaffungen und Fahrzeugdaten. Anmeldung und Cloud-Datenbank werden über Supabase bereitgestellt.

## Voraussetzungen

- Git
- Node.js 22 LTS mit npm
- Visual Studio Code
- ein kostenloses Supabase-Konto
- Expo Go für kostenlose Tests auf einem echten iPhone oder Android-Gerät

Docker ist nicht erforderlich.

## Projekt installieren

```powershell
git clone https://github.com/H3nri5H/Kostenkompass.git
cd Kostenkompass
npm ci
```

Bei einem bereits vorhandenen Projektordner:

```powershell
git switch main
git pull origin main
npm ci
```

## Supabase einrichten

Erstelle in Supabase ein kostenloses Projekt und führe im **SQL Editor** diese Migrationen in der angegebenen Reihenfolge aus:

```text
supabase/migrations/20260618153000_auth_sync.sql
supabase/migrations/20260618172000_vehicle_logbook.sql
supabase/migrations/20260618190000_vehicle_service_fields.sql
supabase/migrations/20260619003000_ing_csv_import.sql
```

Die Migrationen erstellen Benutzerkonten-Anbindung, Kategorien, Ausgaben, Produkte, Fahrzeuge, Tankvorgänge, Teilespezifikationen sowie die Row-Level-Security-Regeln. Jeder angemeldete Benutzer darf ausschließlich seine eigenen Datensätze lesen und verändern.

Wurde das Projekt bereits eingerichtet, führe nur die noch fehlenden Migrationen in zeitlicher Reihenfolge aus. Für den ING-Dateiimport wird `20260619003000_ing_csv_import.sql` benötigt.

## Lokale Konfiguration

```powershell
Copy-Item .env.example .env
```

Öffne `.env` in VS Code und trage die öffentlichen Supabase-Werte ein:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
```

Verwende ausschließlich den öffentlichen **Publishable Key** beziehungsweise den öffentlichen `anon`-Key. Ein `service_role`- oder Secret-Key darf niemals in die App oder in GitHub gelangen. Nach Änderungen an `.env` muss der Expo-Server neu gestartet werden.

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

## ING-Umsätze importieren

1. Öffne im ING-Online-Banking die Umsatzanzeige und exportiere die bereits gebuchten Umsätze als CSV-Datei.
2. Öffne in SpendFox **Ausgaben** und wähle **ING-CSV importieren**.
3. Prüfe die erkannten Belastungen, Kategorie-Vorschläge und die ausgewählte Summe.
4. Bestätige nur die Buchungen, die als Ausgaben übernommen werden sollen.

Die Datei wird lokal auf dem Gerät ausgewertet. SpendFox speichert nur bestätigte Belastungen; Gutschriften werden ausgelassen. Wertpapierkäufe sind aus Sicherheitsgründen zunächst nicht vorausgewählt. Wiederholte Importe derselben Buchung werden über einen konto- und transaktionsbezogenen Fingerprint verhindert.

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

Beim ersten Start erscheint die SpendFox-Anmeldung. Über **Registrieren** wird ein Konto mit E-Mail-Adresse und Passwort erstellt. Falls die E-Mail-Bestätigung in Supabase aktiviert ist, muss der Bestätigungslink vor der ersten Anmeldung geöffnet werden.

Zum Testen der Synchronisation:

1. Auf Gerät A anmelden und eine Ausgabe, ein Produkt oder ein Fahrzeug anlegen.
2. Auf Gerät B oder im Browser dasselbe Konto verwenden.
3. Den jeweiligen Bildschirm aktualisieren.

Die Daten sollten dort ebenfalls erscheinen. SpendFox verwendet derzeit Supabase als zentrale Datenquelle; eine vollständige Offline-Warteschlange ist noch nicht enthalten.

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

Die GitHub-Actions-CI führt bei Änderungen an `main` sowie bei manueller Auslösung Installation, ESLint, striktes TypeScript und Unit-Tests aus. Format-, Bundle- und Expo-Doctor-Prüfungen bleiben bewusst manuell; ein Deployment findet nicht statt.

## Wichtige Hinweise

- Produktkäufe und Tankvorgänge fließen automatisch in die Monatsübersicht ein.
- Bereits separat als Ausgabe erfasste Produkt- oder Tankkäufe sollten nicht nochmals angelegt werden, da sie sonst doppelt gezählt werden.
- Daten aus der früheren lokalen SQLite-Version werden nicht automatisch übernommen.
- App-Icon, Splash-Grafik und Anmeldelogo sind im Repository versioniert.
