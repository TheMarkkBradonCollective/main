# THE MARKK BRANDON COLLECTIVE

> Apps & websites by **Markk Brandon** · **Markeith Nicholas White** — free ones to try, a GoFundMe to keep them running, and a door to hire me.

**Version:** **v1.3.4** (see [`version.json`](version.json))

## Live site

**Canonical host:** [themarkkbradoncollective.github.io/TheMarkkade.io](https://themarkkbradoncollective.github.io/TheMarkkade.io/)

This showcase ships on **GitHub Pages** only. The old Vercel project for this repo (`the-markkade-io` / `themarkkbrandoncollective.vercel.app`) is intentionally removed — ignore those URLs if they still 404.

> After deleting the Vercel project, also clear the GitHub repo **Homepage** URL if it still points at `*.vercel.app` (Settings → General → Website). Point it at the Pages link above.

## Site Structure

| Page | URL | Description |
|------|-----|-------------|
| **Front Page** | `/` | Who I am, why I build, AI note, CTAs |
| **Showcase** | `/apps/` | Free apps first; Guardr & SSS in a separate security lane |
| **Support** | `/support/` | GoFundMe — keep free apps online |
| **Hire Me** | `/request/` | Request a website/app build + budget range |

## Showcase — Free apps

| Project | Notes | URL |
|---------|-------|-----|
| Sacramento Buy Nothing | Free local gifting | [sacramentobuynothing.com](https://sacramentobuynothing.com) |
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

## Brand logo

Masters (black backdrop): [`icons/logo-master.png`](icons/logo-master.png), [`icons/wordmark-master.png`](icons/wordmark-master.png).

Display assets are **transparent PNGs** (black knocked out) so they sit cleanly on the dark splash / masthead and on black brand plates in the nav and footer:

- Circular badge: [`icons/logo.png`](icons/logo.png)
- Horizontal wordmark: [`icons/wordmark.png`](icons/wordmark.png)

```bash
npm run process-brand   # masters → transparent logo + wordmark
npm run sync-app-icons  # pull each app's icon from GitHub / live site → icons/apps/
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
