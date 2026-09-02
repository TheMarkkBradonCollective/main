# Push Navigate to GitHub

The Navigate app source lives at `/home/ubuntu/Navigate` (or clone this folder after export).

## Create the repo (one time)

1. On GitHub: **New repository** → `TheMarkkBradonCollective/Navigate` (private)
2. Do not add a README (this folder has one)

## Push

```bash
cd Navigate
git add -A
git commit -m "Navigate v1.0.0 — custom GPS + Android Auto"
git remote add origin https://github.com/TheMarkkBradonCollective/Navigate.git
git push -u origin main
```

## Deploy web + APK

Connect the repo to Vercel as `navigate-tmbc.vercel.app` (same pattern as other MBC apps).

After deploy, `npm run sync-apk-catalog` on the `main` repo will pick up live `version.json` automatically.
