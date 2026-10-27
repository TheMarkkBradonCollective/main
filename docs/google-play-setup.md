# Google Play Console setup — MBC apps

Upload pipeline for all Collective Android apps. Builds signed **AAB** files and uploads via the Play Developer API.

**Developer account:** themarkkbrandoncollective@gmail.com

## Quick start

```bash
# 1. One-time: create shared upload keystore (or set your own passwords)
export MBC_UPLOAD_KEYSTORE_PASSWORD='your-secure-password'
export MBC_UPLOAD_KEY_PASSWORD="$MBC_UPLOAD_KEYSTORE_PASSWORD"

# 2. Sync app list from apk-catalog.json (auto-discovers all APK apps)
npm run play:sync-apps

# 3. Build AABs (local apps first)
npm run play:build -- mbc-store navigate

# 4. Build ALL apps — needs a GitHub Personal Access Token (not the 6-digit 2FA code)
#    You enter the 6-digit code on github.com when creating the token.
#    Then paste the token here (starts with ghp_):
#    https://github.com/settings/tokens  → Generate new token (classic) → scope: repo
export GITHUB_TOKEN=ghp_your_token_here
npm run play:build:all

# 5. Generate copy-paste files for each app repo
npm run play:scaffold

# 6. Upload (after service account is linked — see below)
export PLAY_SERVICE_ACCOUNT_JSON=secrets/play-service-account.json
npm run play:upload -- navigate --track internal
```

### Multiple APK versions (e.g. Findr has 8 archives)

Only the **latest** version is built as an AAB for Play Store. Older APK archives stay as sideload downloads in the app catalog — Play only needs the current release.

## Apps covered

| Slug | Package ID | Source |
|------|------------|--------|
| mbc-store | `com.themarkkbradoncollective.store` | This repo (`download/android`) |
| navigate | `com.themarkkbradoncollective.navigate` | This repo (`Navigate/`) |
| buynothing | `org.sacramentobuynothing.app` | TheSacramentoFree repo |
| strainverse | `com.themarkkbradoncollective.strainverse` | StrainVerse repo |
| spiritsverse | `com.themarkkbradoncollective.spiritsverse` | SpiritsVerse repo |
| cookverse | `com.themarkkbradoncollective.cookverse` | CookVerse repo |
| friendr | `app.friendr.mobile` | Friendr repo |
| findr | `com.themarkkbradoncollective.findr` | Findr repo |
| chatr | `com.themarkkbradoncollective.chatr` | Chatr repo |
| sss | `com.signaturesecurityspecialist.staff` | Signature-Security-Specialist repo |

Config: [`scripts/play/play-apps.json`](../scripts/play/play-apps.json)

## Step 1 — Play Developer account

1. Sign in at [play.google.com/console](https://play.google.com/console) with **themarkkbrandoncollective@gmail.com**
2. Pay the one-time $25 registration fee if not already done
3. Complete account details (developer name, contact, etc.)

## Step 2 — Create each app listing

For each package ID above, in Play Console:

1. **Create app** → default language, app name, type (App), free/paid
2. **Dashboard** → complete required tasks:
   - App content (privacy policy URL, ads declaration, content rating, target audience, data safety)
   - Store listing (short + full description, screenshots, icon)
   - App access (if login required, provide test credentials)

You can publish to **Internal testing** with minimal store assets; production requires full listing.

## Step 3 — API access (service account)

This lets the upload script push AABs without browser login.

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project (e.g. `mbc-play-upload`)
3. **APIs & Services → Enable APIs** → enable **Google Play Android Developer API**
4. **IAM → Service Accounts → Create**
   - Name: `play-upload`
   - Role: none required at GCP level
5. **Keys → Add key → JSON** → download to `secrets/play-service-account.json` (gitignored)
6. In **Play Console → Setup → API access**:
   - Link the Cloud project
   - **Invite user** → paste the service account email (`play-upload@….iam.gserviceaccount.com`)
   - Grant **Release manager** (or Admin) for apps you want to upload

```bash
export PLAY_SERVICE_ACCOUNT_JSON=secrets/play-service-account.json
```

## Step 4 — Upload keystore

Google Play App Signing is on by default. You upload with an **upload key**; Google holds the app signing key.

- Most MBC apps use `secrets/mbc-upload.keystore` (auto-created on first build)
- Navigate uses its own `Navigate/android/navigate-release.keystore` (existing sideload builds)

**Save passwords securely.** If you lose the upload key, reset it in Play Console → App signing.

Print upload certificate SHA-256 (for `assetlinks.json` / TWA):

```bash
keytool -list -v -keystore secrets/mbc-upload.keystore -alias mbc-upload
```

## Step 5 — Build & upload

```bash
# Single app
npm run play:build -- strainverse
npm run play:upload -- strainverse --track internal

# All apps
npm run play:build:all
npm run play:upload:all --track internal

# Dry run (no API call)
node scripts/play/upload-to-play.mjs navigate --dry-run
```

Output AABs: `aabs/{slug}/{slug}-vX.Y.Z.aab`  
Catalog: `aabs/catalog.json`

## Adding AAB support to each app repo

Copy the template into any Capacitor app:

```bash
cp scripts/play/templates/repo-build-aab.mjs ../StrainVerse/scripts/build-aab.mjs
```

Add to that repo's `package.json`:

```json
"build:aab": "node scripts/build-aab.mjs"
```

Ensure `android/` has `bundleRelease` enabled (Capacitor default). The main repo's `npm run play:build` clones and builds remote repos automatically when `GITHUB_TOKEN` is set.

## Tracks

| Track | Use |
|-------|-----|
| `internal` | Team testers, fastest review |
| `closed` | Closed beta |
| `open` | Open beta |
| `production` | Public Play Store |

Default track: `internal` (configurable in `play-apps.json` or `--track` flag).

## Troubleshooting

| Error | Fix |
|-------|-----|
| `403` on upload | Service account not invited in Play Console API access |
| `Package not found` | Create the app listing in Play Console first (matching package ID) |
| `GITHUB_TOKEN required` | `export GITHUB_TOKEN=$(gh auth token)` for private repos |
| Signing mismatch | Use the same upload keystore as the first upload for that app |
| Version code conflict | Bump `versionCode` in the app's `build.gradle` |

## Manual upload (browser)

If API upload isn't ready:

1. Build AAB: `npm run play:build -- <slug>`
2. Play Console → your app → **Testing → Internal testing → Create release**
3. Upload `aabs/<slug>/*.aab`
4. Save → review → roll out
