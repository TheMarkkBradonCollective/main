# Push Navigate to its own GitHub repo

Source lives in **`Navigate/`** on `main`. A standalone branch is ready to push.

## 1. Create the repo (one time)

GitHub → **New repository** → `TheMarkkBradonCollective/Navigate` (private, empty).

## 2. Push source from `main`

From the **`main`** repo root:

```bash
git fetch origin
git push https://github.com/TheMarkkBradonCollective/Navigate.git navigate-standalone:main
```

If `navigate-standalone` is missing locally:

```bash
git subtree split --prefix=Navigate -b navigate-standalone
git push https://github.com/TheMarkkBradonCollective/Navigate.git navigate-standalone:main
```

## 3. Publish APK + release zip on the Navigate repo

```bash
cd Navigate
npm run release:zip
./scripts/publish-github-release.sh
```

That creates **GitHub Release `v1.0.0`** with:

- `Navigate-v1.0.0.apk`
- `Navigate-v1.0.0-release.zip` (APK + `version.json` + README)

## Interim release (on `main`)

Until the Navigate repo exists, release assets are on:

https://github.com/TheMarkkBradonCollective/main/releases/tag/navigate-v1.0.0

## Deploy web

Connect `Navigate` to Vercel → `navigate-tmbc.vercel.app`
