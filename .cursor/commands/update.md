---
description: Refresh MBC app readiness (version, PWA, APK/TWA)
---

# /update — Markk Brandon Collective readiness refresh

Run this whenever shipping UI or content changes so the installable PWA and Android TWA stay aligned.

## Do this

1. Bump `package.json` `version` (patch unless the user asked for minor/major).
2. Run `npm run update` (processes transparent brand assets from masters, regenerates PWA icons, writes `version.json`, bumps `sw.js` cache, refreshes `android/twa-manifest.json`).
3. Confirm the loading splash still shows `MBC vX.Y.Z` on Front Page and The Classifieds.
4. Confirm PWA auto-update still registers (`js/pwa.js` + service worker `skipWaiting` / `clients.claim`).
5. Confirm layout fits on mobile: no horizontal overflow, classified cards stay in-grid, nav wraps cleanly.
6. This site is static — there is no app SQL here. For StrainVerse / SpiritsVerse schema refreshes, run that app’s `sql/update.sql` in Supabase.
7. Commit, push, and open/update a PR targeting `main`.

## Do not

- Do not invent APK signing secrets; leave `assetlinks.json` fingerprint as a placeholder unless the user provides one.
- Do not add a map/list shell here — MatchIt / Local maps live in StrainVerse / SpiritsVerse.
