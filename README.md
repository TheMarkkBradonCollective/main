# MBC Store

> **The Markk Brandon Collective** app store — browse, search, and sideload Android APKs from one installable PWA. Catalog-driven: add an app by editing [`apk-catalog.json`](apk-catalog.json) only.

**Version:** **v2.0.0** (see [`version.json`](version.json))

## Live site

**Cloudflare Pages:** [mbc-store.pages.dev](https://mbc-store.pages.dev) (project `mbc-store`).

**GitHub Pages fallback:** [themarkkbradoncollective.github.io/main/](https://themarkkbradoncollective.github.io/main/) stays up until a Cloudflare production deploy is confirmed.

**Repository:** [github.com/TheMarkkBradonCollective/main](https://github.com/TheMarkkBradonCollective/main).

Legacy newspaper pages (`/about/`, `/apps/`, `/support/`, etc.) remain in the tree; the **root `/` is the app store**.

## Deploy to Cloudflare Pages

Pages serves an asset only when its manifest key starts with `/` (`/index.html`, not `index.html`). A direct upload that omitted that slash reported success and then returned an empty 404 for every URL, including deploy aliases. [`pages_build_output_dir = "."`](wrangler.toml) also published the repo root instead of a site directory.

1. Stage the site (skips files over 25 MiB and the large APK trees in [`.assetsignore`](.assetsignore)):

   ```bash
   npm run build:pages
   ```

   Output is `dist/` and must contain `index.html`, `apk-catalog.json`, `css/app-store.css`, and `js/app-store.js`.

2. Deploy that directory with Wrangler (it writes slash-prefixed manifest keys):

   ```bash
   npx wrangler pages deploy dist --project-name=mbc-store
   ```

   `npm run deploy:pages` does both steps. `wrangler.toml` is Pages-safe (`name`, `pages_build_output_dir = "dist"`). Workers-only keys such as `[assets]` and `[observability]` make `wrangler pages deploy` reject the config.

3. GitHub Actions (`.github/workflows/deploy-cloudflare-pages.yml`) deploys on push to `main`. Repository secrets, not committed:

   | Secret | Value |
   | --- | --- |
   | `CLOUDFLARE_API_TOKEN` | API token with **Account → Cloudflare Pages → Edit** |
   | `CLOUDFLARE_ACCOUNT_ID` | Account ID from the Workers & Pages overview |

4. Headers and redirects: [`_headers`](_headers), [`_redirects`](_redirects) (`/download/` → `/`). They are copied into `dist/`.

## App catalog (`apk-catalog.json`)

| Field | Purpose |
|-------|---------|
| `featuredSlugs` / `newUpdatedSlugs` | Home carousels |
| `categories` | Category chips and tabs |
| `apps[].slug` | URL hash `#/app/{slug}` |
| `apps[].name`, `tagline`, `description` | Listing and detail page. Multi-app products use `Name — Audience` |
| `apps[].product`, `productName`, `audience` | Groups sibling apps on one card. `audience` is the visible label |
| `apps[].category` | Section (navigation, social, lifestyle, …) |
| `apps[].icon` | Path under repo root or absolute URL |
| `apps[].webUrl` | Enables **Open web app** when set |
| `apps[].screenshots` | Optional image paths for detail carousel |
| `apps[].android.status` | `available`, `request-to-download`, `coming-soon`, or `web-only` |
| `apps[].android.downloadUrl` | Public HTTPS or repo-relative APK (prefer R2/worker URLs over private GitHub releases) |
| `apps[].android.version`, `fileSize`, `updatedAt` | Detail metadata |

Example new app entry:

```json
{
  "slug": "my-app",
  "name": "My App",
  "tagline": "Short tagline",
  "description": "Longer copy for the detail page.",
  "category": "lifestyle",
  "icon": "icons/apps/my-app.png",
  "webUrl": "https://my-app.pages.dev",
  "screenshots": [],
  "android": {
    "status": "available",
    "version": "1.0.0",
    "updatedAt": "2026-10-31",
    "downloadUrl": "https://example.r2.dev/my-app.apk",
    "downloadName": "my-app.apk",
    "fileSize": 1234567
  }
}
```

`npm run sync-apk-catalog` can still refresh mirrored APK metadata from repos; for production URLs, edit `apk-catalog.json` directly when you ship a new build.

Founder availability control: set an app's `android.status` to `request-to-download` to hide its APK download and show a disabled **Request to Download** state. Requests are not wired up yet. Set it back to `available` to restore downloads. See [docs/FOUNDER-APP-AVAILABILITY.md](docs/FOUNDER-APP-AVAILABILITY.md) for the exact steps. This is a storefront switch; it does not revoke a public APK URL that someone already has.

Founder dashboard: sign in at `/admin/login/` and manage app availability at `/admin/`. The existing login is retained; the dashboard now has Founder-only availability controls that save to GitHub. See [docs/FOUNDER-DASHBOARD.md](docs/FOUNDER-DASHBOARD.md) for required Cloudflare secrets, including the `GITHUB_TOKEN` needed to save changes.

## APK publishing and updates

MBC Store distributes our own Android products as signed APKs. See [docs/APK-RELEASES.md](docs/APK-RELEASES.md) for the release checklist, signing/version rules, Android installation behavior, and the remaining private-access setup. The store can download APKs and explain updates; Android's package installer performs native installs and updates with user approval. A PWA cannot silently install APKs or reliably inspect installed packages.

## Store UI

| Route | Description |
|-------|-------------|
| `/` | Home — featured & new carousels, categories, app grid |
| `#/app/{slug}` | App detail — install button, web link, screenshots, description |
| `#/apps` | Full list |
| `#/categories` | Browse by category |
| `#/settings` | Light/dark theme, MBC Store APK, links to About/Support |

Assets: [`css/app-store.css`](css/app-store.css), [`js/app-store.js`](js/app-store.js), PWA via [`manifest.webmanifest`](manifest.webmanifest) and [`sw.js`](sw.js).

## Local development

```bash
python3 -m http.server 8080
# open http://localhost:8080/
```

## Mirrored APKs & release zips

Large community APK trees (`apks/friendr/`, `apks/buffalofree/`, `apks/buynothing/`) and `download/releases/Verse-v1.zip` are **not** deployed with Pages (see [`.assetsignore`](.assetsignore)). Canonical downloads live on public R2 bucket **`mbc-store-apks`** — base URL in [`apk-catalog.json`](apk-catalog.json) (`apkCdnBase`, per-app `android.downloadUrl`, and `verseBundle`).

Other APKs under `apks/` remain for offline mirroring and the native MBC Store Android shell. Packaging scripts are unchanged:

```bash
npm run mirror-all-apks      # needs GITHUB_TOKEN
npm run sync-apk-catalog
npm run package-apk-release
```

## Brand & icons

```bash
npm run process-brand
npm run sync-app-icons
npm run generate-icons
```

© 2026 Markk Brandon (Markeith Nicholas White)
