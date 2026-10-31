# MBC Store

> **The Markk Brandon Collective** app store — browse, search, and sideload Android APKs from one installable PWA. Catalog-driven: add an app by editing [`apk-catalog.json`](apk-catalog.json) only.

**Version:** **v2.0.0** (see [`version.json`](version.json))

## Live site

**Host:** [Cloudflare Pages](https://pages.cloudflare.com/) (recommended project name: `mbc-store`)

**Repository:** [github.com/TheMarkkBradonCollective/main](https://github.com/TheMarkkBradonCollective/main) — keep **private**; APKs and static assets deploy from this repo.

Legacy newspaper pages (`/about/`, `/apps/`, `/support/`, etc.) remain in the tree; the **root `/` is the app store**.

## Deploy to Cloudflare Pages

1. Create a Pages project linked to this GitHub repo (production branch: `main`).
2. **Build settings:** Framework preset **None**, build command empty, output directory **`.`** (repository root).
3. Config is in [`wrangler.toml`](wrangler.toml). Optional CLI deploy from a machine with Cloudflare credentials:

   ```bash
   npx wrangler pages deploy . --project-name=mbc-store
   ```

4. Attach a custom domain in the Cloudflare dashboard (e.g. `store.themarkkbradoncollective.com`).
5. Headers and redirects: [`_headers`](_headers), [`_redirects`](_redirects) (`/download/` → `/`).

## App catalog (`apk-catalog.json`)

| Field | Purpose |
|-------|---------|
| `featuredSlugs` / `newUpdatedSlugs` | Home carousels |
| `categories` | Category chips and tabs |
| `apps[].slug` | URL hash `#/app/{slug}` |
| `apps[].name`, `tagline`, `description` | Listing and detail page |
| `apps[].category` | Section (navigation, social, lifestyle, …) |
| `apps[].icon` | Path under repo root or absolute URL |
| `apps[].webUrl` | Enables **Open web app** when set |
| `apps[].screenshots` | Optional image paths for detail carousel |
| `apps[].android.status` | `available`, `coming-soon`, or `web-only` |
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

APKs under `apks/` remain for offline mirroring and the native MBC Store Android shell. Packaging scripts are unchanged:

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
