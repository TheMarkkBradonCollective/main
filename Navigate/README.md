# Navigate

**Navigate** is the MBC custom GPS navigation app with **Android Auto** in-car dashboard support.

> **Note:** Google’s in-car platform for Android is **Android Auto** (not Apple CarPlay). CarPlay would be a separate Apple-native build later.

## Features (v1.0)

- Live GPS on phone via Capacitor Geolocation
- OpenStreetMap map tiles + OSRM routing (no Google Maps API key required)
- Destination search (Nominatim)
- Turn-by-turn step list on device
- **Android Auto** navigation template shell — shows on car dashboard when connected

## MBC App Store

Listed in [The MBC App Store](https://themarkkbradoncollective.github.io/main/download/) after deploy + APK publish.

## Develop

```bash
npm install
npm run dev
```

## Build APK

```bash
npm run build
npm run build:apk
```

Requires Java 17+ and Android SDK (API 34). Output: `public/navigate.apk` and updated `public/version.json`.

## Android Auto testing

1. Install [Android Desktop Head Unit](https://developer.android.com/training/cars/testing)
2. Build and install the Navigate APK on a device or emulator
3. Launch DHU and connect — Navigate appears under navigation apps

## Repo

Push this folder to `github.com/TheMarkkBradonCollective/Navigate` (private).

## License

© 2026 Markk Brandon (Markeith Nicholas White)
