# THE MARKK BRANDON COLLECTIVE

> Apps & websites by **Markk Brandon** · **Markeith Nicholas White** — free ones to try, a GoFundMe to keep them running, and a door to hire me.

**Version:** **v1.5.13** (see [`version.json`](version.json))

## Live site

**Canonical host:** [themarkkbradoncollective.github.io/main](https://themarkkbradoncollective.github.io/main/)

**Repository:** [github.com/TheMarkkBradonCollective/main](https://github.com/TheMarkkBradonCollective/main)

This newspaper site ships on **GitHub Pages** only. The old repo name (`TheMarkkade.io`) and Vercel project (`the-markkade-io` / `themarkkbrandoncollective.vercel.app`) are retired — ignore those URLs if they still 404.

> After deleting the Vercel project, also clear the GitHub repo **Homepage** URL if it still points at `*.vercel.app` (Settings → General → Website). Point it at the Pages link above.

## Site Structure

| Page | URL | Description |
|------|-----|-------------|
| **Front Page** | `/` | Who I am, why I build, AI note, CTAs |
| **The Classifieds** | `/apps/` | Free apps & sites to try |
| **Security Showcase** | `/security/` | Signature Security Specialist and BSIS certificates |
| **Downloads** | `/download/` | Android APK app market — sideload & update MBC apps |
| **Support** | `/support/` | GoFundMe — keep free apps online |
| **Hire Me** | `/request/` | Request a website/app build + budget range |

## The Classifieds — Free apps (APK-only)

All catalog apps install from the [MBC App Store](/download/). See [`My-Projects.json`](My-Projects.json) for the full list (15 apps).

| Project | Notes |
|---------|-------|
| TheSacramentoFree | Free local gifting · Sacramento |
| TheBuffaloFree | Free local gifting · Buffalo |
| StrainVerse | Cannabis social · Verse family |
| SpiritsVerse | Drinks social · Verse family |
| Cookverse | Cooking social · Verse family |
| GigOS | Live performance OS |
| Friendr | Consent-first social |
| Chatr | Encrypted sticky-note chat |
| Findr | Location sharing |
| Navigate | Custom GPS · Android Auto |
| Runr | Delivery platform |
| Dlvrd | Delivery companion |
| Brandr | Brand tools |
| CheckDeck | Checklists & decks |

## Security Showcase

Signature Security Specialist lives on [`/security/`](security/) with BSIS training certificates. Operator credentials (guard card, etc.) go in `security/certs.json` under `operators` once the scans are in — drop JPEGs in `images/certs/` and add an entry.

| Project | Notes | URL |
|---------|-------|-----|
| Signature Security Specialist | Company / ops angle | [signaturesecurityspecialist.com](https://signaturesecurityspecialist.com) |

## Classifieds apps (`My-Projects.json`)

Canonical live links + icon sources for every listed app live in [`My-Projects.json`](My-Projects.json). Icons are pulled from those URLs (GitHub raw when a public repo exists, otherwise the live deployment):

```bash
npm run sync-app-icons
```

### GitHub repos

Catalog apps live in repos under `TheMarkkBradonCollective`. Repo URLs and `githubPrivate` flags live in [`My-Projects.json`](My-Projects.json).

| App | Repo | Visibility |
|-----|------|------------|
| TheSacramentoFree | `TheSacramentoFree` | Private |
| TheBuffaloFree | `TheBuffaloFree` | Public |
| StrainVerse | `StrainVerse` | Public |
| SpiritsVerse | `SpiritsVerse` | Public |
| CookVerse | `CookVerse` | Public |
| Friendr | `Friendr` | Public |
| Findr | `Findr` | Public |
| Chatr | `Chatr` | Public |
| Navigate | `Navigate` | Public |
| Signature Security Specialist | `Signature-Security-Specialist` | Private |
| Runr | `Runr` | Public |
| Dlvrd | `Dlvrd` | Public |
| Brandr | `Brandr` | Public |
| CheckDeck | `CheckDeck` | Public |

All catalog apps are **APK-only** (Vercel sites removed). Install via [MBC App Store](/download/).

To flip any still-private catalog repos to public (and sync `githubPrivate` flags):

```bash
export GITHUB_TOKEN=ghp_your_org_owner_token   # classic PAT, repo scope
npm run make-repos-public
```

APK sync discovers builds in `release/`, `android-app/`, etc. and can **mirror** them to `apks/{slug}/` on this site:

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
