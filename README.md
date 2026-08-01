# THE MARKK BRANDON COLLECTIVE

> Apps & websites by **Markk Brandon** · **Markeith Nicholas White** — free ones to try, a GoFundMe to keep them running, and a door to hire me.

**Version:** **v1.4.9** (see [`version.json`](version.json))

## Live site

**Canonical host:** [themarkkbradoncollective.github.io/main](https://themarkkbradoncollective.github.io/main/)

**Repository:** [github.com/TheMarkkBradonCollective/main](https://github.com/TheMarkkBradonCollective/main)

This newspaper site ships on **GitHub Pages** only. The old repo name (`TheMarkkade.io`) and Vercel project (`the-markkade-io` / `themarkkbrandoncollective.vercel.app`) are retired — ignore those URLs if they still 404.

> After deleting the Vercel project, also clear the GitHub repo **Homepage** URL if it still points at `*.vercel.app` (Settings → General → Website). Point it at the Pages link above.

## Site Structure

| Page | URL | Description |
|------|-----|-------------|
| **Front Page** | `/` | Who I am, why I build, AI note, CTAs |
| **The Classifieds** | `/apps/` | Free apps first; Guardr & SSS in a separate security lane |
| **Downloads** | `/download/` | Android APK app market — sideload & update MBC apps |
| **Support** | `/support/` | GoFundMe — keep free apps online |
| **Hire Me** | `/request/` | Request a website/app build + budget range |

## The Classifieds — Free apps

| Project | Notes | URL |
|---------|-------|-----|
| Sacramento Buy Nothing | Free local gifting | [sacramentobuynothing-tmbc.vercel.app](https://sacramentobuynothing-tmbc.vercel.app) |
| StrainVerse | Fun / boredom build | [strainverse-tmbc.vercel.app](https://strainverse-tmbc.vercel.app) |
| SpiritsVerse | Fun / boredom build | [spiritsverse-tmbc.vercel.app](https://spiritsverse-tmbc.vercel.app) |
| Cookverse | Fun / boredom build | [cookverse-tmbc.vercel.app](https://cookverse-tmbc.vercel.app) |
| Friendr | Free by design | [friendr-tmbc.vercel.app](https://friendr-tmbc.vercel.app) |
| Findr | Free by design | [findr-tmbc.vercel.app](https://findr-tmbc.vercel.app) |
| Chatr | Free by design | [chatr-tmbc.vercel.app](https://chatr-tmbc.vercel.app) |

## Security (listed separately)

| Project | Notes | URL |
|---------|-------|-----|
| Guardr | Marketplace angle | [guardr.co](https://guardr.co) |
| Signature Security Specialist | Company / ops angle | [signaturesecurityspecialist.com](https://signaturesecurityspecialist.com) |

## Classifieds apps (`My-Projects.json`)

Canonical live links + icon sources for every listed app live in [`My-Projects.json`](My-Projects.json). Icons are pulled from those URLs (GitHub raw when a public repo exists, otherwise the live deployment):

```bash
npm run sync-app-icons
```

### Private repo APKs

Several apps live in **private** GitHub repos. The sync script can discover APKs in `release/`, `android-app/`, etc. and **mirror** them to `apks/{slug}/` on this site so the App Market stays publicly downloadable.

1. Add or fix each app's `github` URL in [`My-Projects.json`](My-Projects.json) (set `"githubPrivate": true` when needed).
2. Export a GitHub token with `repo` scope:
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   # or: export GITHUB_TOKEN=$(gh auth token)
   ```
3. Run:
   ```bash
   npm run sync-apk-catalog
   # or
   npm run update
   ```

Mirrored APKs are committed under `apks/` (see `.gitignore` exception). Live deployments with `version.json` `apk.ready` still take priority when available.

## Brand logo

Masters (black backdrop): [`icons/logo-master.png`](icons/logo-master.png), [`icons/wordmark-master.png`](icons/wordmark-master.png).

Display assets are **transparent PNGs** (black knocked out) so they sit cleanly on the dark splash / masthead and on black brand plates in the nav and footer:

- Circular badge: [`icons/logo.png`](icons/logo.png)
- Horizontal wordmark: [`icons/wordmark.png`](icons/wordmark.png)

```bash
npm run process-brand   # masters → transparent logo + wordmark
npm run sync-app-icons  # pull each app's icon from GitHub / live site → icons/apps/
npm run sync-apk-catalog  # discover Android APKs from each app's version.json → apk-catalog.json
npm run generate-icons  # also rebuilds favicon / PWA tiles (opaque black)
# or
npm run update
```

## Local Development

```bash
python3 -m http.server 8080
```

## GoFundMe

Edit the campaign URL on [`support/index.html`](support/index.html) (`#gofundme-link`) once the GoFundMe is live.

## App readiness (`/update`)

```bash
npm run update
```

Cursor slash command **`/update`** — see `.cursor/commands/update.md`.

© 2026 Markk Brandon (Markeith Nicholas White)
