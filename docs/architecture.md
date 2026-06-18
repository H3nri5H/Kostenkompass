# Architektur

Kostenkompass verwendet Expo und React Native für iOS, Android und Web. Supabase stellt Anmeldung, API und PostgreSQL bereit.

```text
App-Routen und UI
        |
        v
Repository-Funktionen in src/db
        |
        v
Supabase API und PostgreSQL
```

## Verzeichnisstruktur

- `app`: Routen und Screens
- `src/components`: wiederverwendbare UI
- `src/domain`: Modelle, Berechnungen und Formatierung
- `src/db`: Datenzugriff
- `src/auth`: Anmeldung und Sitzung
- `supabase/migrations`: Datenbankschema und Zugriffsregeln

## Datenmodell

Die zentralen Tabellen sind `categories`, `expenses`, `assets`, `vehicles`, `vehicle_fuel_entries` und `vehicle_parts`. Benutzerdaten werden über die jeweilige Benutzer-ID getrennt.

## Synchronisation

Supabase ist die zentrale Datenquelle. Die App schreibt Änderungen direkt in die Cloud und lädt Daten beim Öffnen oder Aktualisieren eines Screens neu. Eine vollständige Offline-Synchronisation ist noch nicht enthalten.

## CI

Eine GitHub-Actions-Pipeline prüft Formatierung, ESLint, TypeScript, Unit-Tests sowie iOS- und Web-Bundles. Deployment wird erst bei einem festgelegten Store-Prozess ergänzt.
