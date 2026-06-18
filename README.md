# Kostenkompass

## Installation

Voraussetzungen:

- Node.js 22 LTS
- npm
- Git
- für Tests auf einem iPhone: die kostenlose App **Expo Go**

```bash
git clone https://github.com/H3nri5H/Kostenkompass.git
cd Kostenkompass
npm ci
```

## Lokal starten

```bash
npm start
```

iPhone und Entwicklungsrechner müssen sich im selben WLAN befinden. Anschließend den QR-Code aus dem Terminal mit der iPhone-Kamera scannen und das Projekt in Expo Go öffnen.

Falls die Verbindung im lokalen Netzwerk nicht funktioniert:

```bash
npm run start:tunnel
```

## Automatisierte Prüfungen

Alle lokalen Qualitätsprüfungen:

```bash
npm run verify
```

Einzelne Prüfungen:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test -- --runInBand
npm run bundle:ios
npm run doctor
```
