# THE MARKK BRANDON COLLECTIVE

> Apps & websites by **Markk Brandon** · **Markeith Nicholas White** — free ones to try, a GoFundMe to keep them running, and a door to hire me.

**Version:** **v1.3.2** (see [`version.json`](version.json))

## Live site

| Host | URL | Status |
|------|-----|--------|
| **GitHub Pages** | [themarkkbradoncollective.github.io/TheMarkkade.io](https://themarkkbradoncollective.github.io/TheMarkkade.io/) | **Working — use this** |
| Vercel project | [`the-markkade-io`](https://vercel.com/themarkkbrandoncollective/the-markkade-io) | Deploys succeed; public aliases broken |

### Vercel `404: NOT_FOUND` (e.g. `themarkkbrandoncollective.vercel.app`)

That hostname is **not** attached to a live production deployment. The code on `main` is fine — GitHub Pages proves it. This is a **Vercel Domains / project** setting, not a missing file in the repo.

| URL you might try | What Vercel returns | Meaning |
|-------------------|---------------------|---------|
| `themarkkbrandoncollective.vercel.app` | `NOT_FOUND` | No project production alias for this name |
| `the-markkade-io.vercel.app` | `DEPLOYMENT_NOT_FOUND` | Alias exists but points at a deleted/expired deployment |

**Fix in the Vercel dashboard** (you must be logged in as the team owner):

1. Open [the-markkade-io → Deployments](https://vercel.com/themarkkbrandoncollective/the-markkade-io/deployments) and confirm the latest **Production** deploy from `main` is Ready.
2. Open that deployment → **⋯** → **Assign Domain** (or **Promote to Production**).
3. Assign `the-markkade-io.vercel.app` to that deployment.
4. If you specifically want `themarkkbrandoncollective.vercel.app`, either:
   - **Rename** the project to `themarkkbrandoncollective` (Settings → General → Project Name), **or**
   - Create/use a project with that exact name and connect this GitHub repo (`TheMarkkBradonCollective/TheMarkkade.io`) as its production git source, then redeploy.
5. Optional: Settings → **Deployment Protection** — turn off **Vercel Authentication** if team URLs only show a Vercel login page.

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

Circular badge: [`icons/logo.png`](icons/logo.png). Horizontal wordmark: [`icons/wordmark.png`](icons/wordmark.png). Run `npm run update` (or `node scripts/generate-icons.mjs`) to refresh favicon / PWA sizes from the masters.

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
