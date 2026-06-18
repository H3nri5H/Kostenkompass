# Mitarbeit

## Branch-Modell

`main` bleibt jederzeit integrierbar. Änderungen entstehen auf kurzlebigen Branches:

- `feat/<thema>` für Funktionen
- `fix/<thema>` für Fehlerbehebungen
- `chore/<thema>` für Wartung
- `docs/<thema>` für Dokumentation

Direkte Funktionsänderungen auf `main` sind nicht vorgesehen. Jeder Branch wird über einen Pull Request zusammengeführt.

## Commits

Commits folgen Conventional Commits, beispielsweise:

```text
feat: add recurring expense form
fix: prevent negative residual values
chore: update Expo dependencies
```

## Pull Requests

Vor dem Öffnen eines Pull Requests:

```bash
npm ci
npm run verify
npm run bundle:ios
```

Der Pull Request wird erst zusammengeführt, wenn die CI erfolgreich ist. Für `main` sollten in GitHub Branch Protection beziehungsweise Rulesets aktiviert werden:

- Pull Request erforderlich
- CI-Statusprüfung erforderlich
- Branch muss vor dem Merge aktuell sein
- Force Pushes und Löschung deaktiviert
- Squash Merge als Standard

## Releases

Für den aktuellen Expo-Go-MVP gibt es noch keine CD-Pipeline. Ein automatisierter iOS-Build wird erst ergänzt, sobald ein Apple-Developer-Konto und ein verbindlicher EAS-/TestFlight-Prozess vorhanden sind.
