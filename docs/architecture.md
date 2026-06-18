# Architektur

## Zielzustand des MVP

Der MVP ist eine lokale mobile Anwendung. Expo/React Native liefert eine gemeinsame Codebasis für iOS und Android. SQLite speichert alle Daten auf dem Gerät, sodass weder Backend noch Cloud-Datenbank benötigt werden.

```text
Expo Router / React Native
           |
           v
Screens und UI-Komponenten
           |
           v
Repository-Funktionen
           |
           v
lokale SQLite-Datenbank
```

Fachliche Berechnungen liegen in `src/domain` und sind unabhängig von React Native und SQLite. Dadurch können sie isoliert getestet und später auch auf einem Server wiederverwendet werden.

## Datenmodell

- `categories`: vordefinierte Kostenkategorien
- `expenses`: tatsächliche Zahlungen
- `assets`: langlebige Produkte mit geplanter Nutzungsdauer

Geldbeträge werden als ganze Cent-Werte gespeichert. Datensätze verwenden UUIDs sowie `created_at`, `updated_at` und `deleted_at`. Diese Felder erleichtern eine spätere Synchronisation.

## Spätere Skalierung

Die lokale Datenbank bleibt als Offline-Speicher bestehen. Eine spätere Online-Version ergänzt eine authentifizierte API und PostgreSQL:

```text
iPhone-App -> HTTPS-API -> PostgreSQL
     |
     +-> lokale SQLite-Datenbank und Sync-Warteschlange
```

Die App erhält niemals administrative Datenbank-Zugangsdaten. Konflikte und Löschungen müssen durch eine explizite Synchronisationsstrategie behandelt werden.

## CI und CD

GitHub Actions prüft Formatierung, Linting, TypeScript, Unit-Tests und die Erzeugung eines iOS-JavaScript-Bundles. Das ist Continuous Integration.

Continuous Deployment ist im Expo-Go-MVP nicht sinnvoll: Ein installierbares iPhone-Binary benötigt Signierung und für cloudbasierte Geräte-Builds ein kostenpflichtiges Apple-Developer-Konto. Nach dieser Entscheidung kann eine separate, manuell freigegebene EAS-/TestFlight-Pipeline ergänzt werden.
