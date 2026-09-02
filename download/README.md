# MBC App Store

The **MBC App Store** lives at [`/download/`](index.html) on the main site. It lists every Collective Android APK and supports one-tap install and update when opened inside the **MBC Store** native app.

## Web catalog

- `index.html` — store UI
- `store.css` — store-only styles
- `js/store.js` — catalog, search, install/update actions
- Catalog data: [`../apk-catalog.json`](../apk-catalog.json) (synced via `npm run sync-apk-catalog`)

In a normal browser, each app shows **Download APK**. In the MBC Store app, the same page shows **Install**, **Update**, and **Open** based on what is already on the device.

## MBC Store Android app

Native shell in [`android/`](android/) — package `com.themarkkbradoncollective.store`.

Built APK (committed for GitHub Pages hosting):

- [`../apks/mbc-store/MBC-Store-v1.0.0.apk`](../apks/mbc-store/MBC-Store-v1.0.0.apk)

### Build locally

```bash
cd download/android
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release-unsigned.apk`

Copy to `apks/mbc-store/MBC-Store-v1.0.0.apk`, bump `versionCode` / `versionName` in `app/build.gradle.kts`, then run `npm run sync-apk-catalog` from the repo root.

Requires Android SDK (API 34) and JDK 17.

## First-time user flow

1. Open **App Store** on the site → **Get MBC Store**
2. Install the store APK (allow unknown apps for browser once)
3. Open **MBC Store** → browse catalog → **Install** or **Update** any app
