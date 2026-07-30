# THE MARKK BRANDON COLLECTIVE

> An umbrella of companies by **Markk Brandon** · **Markeith Nicholas White**

Newspaper-style site with a front page and **The Classifieds** — where every company in the collective is listed.

**Version:** see [`version.json`](version.json) / `package.json` (currently **v1.1.0**).

## Site Structure

| Page | URL | Description |
|------|-----|-------------|
| **Front Page** | `index.html` | Newspaper cover — bio, headlines, welcome |
| **The Classifieds** | `apps/` | All companies organized by section |

## The Classifieds — Companies

| Company | Category | URL |
|---------|----------|-----|
| Sacramento Buy Nothing | Community | [sacramentobuynothing.com](https://sacramentobuynothing.com) |
| StrainVerse | Lifestyle & Culture | [strainverse-tmbc.vercel.app](https://strainverse-tmbc.vercel.app) |
| SpiritsVerse | Lifestyle & Culture | [spiritsverse-tmbc.vercel.app](https://spiritsverse-tmbc.vercel.app) |
| Cookverse | Lifestyle & Culture | [cookverse-tmbc.vercel.app](https://cookverse-tmbc.vercel.app) |
| Friendr | Social & Connection | [friendr-tmbc.vercel.app](https://friendr-tmbc.vercel.app) |
| Findr | Social & Connection | [findr-tmbc.vercel.app](https://findr-tmbc.vercel.app) |
| Chatr | Social & Connection | [chatr-tmbc.vercel.app](https://chatr-tmbc.vercel.app) |
| Guardr | Security & Protection | [guardr.co](https://guardr.co) |
| Signature Security Specialist | Security & Protection | [signaturesecurityspecialist.com](https://signaturesecurityspecialist.com) |

## Local Development

Static site — open `index.html` in a browser or serve with any static file server:

```bash
python3 -m http.server 8080
```

## App readiness (`/update`)

Refresh installable PWA + Android TWA metadata whenever you ship UI changes:

```bash
npm run update
```

Cursor slash command **`/update`** runs the same workflow (see `.cursor/commands/update.md`).

This newspaper hub is static (no app SQL). Company apps keep their own `sql/update.sql` (e.g. StrainVerse, SpiritsVerse). Map fullscreen shells live in those apps (MatchIt / Local), not here.

© 2026 Markk Brandon (Markeith Nicholas White)
