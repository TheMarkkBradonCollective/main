# Founder dashboard and app availability

The Founder sign-in already exists at:

- Sign in: `/admin/login/`
- Dashboard: `/admin/`

The login uses Cloudflare Pages secrets (never commit passwords):

- `FOUNDER_EMAIL`
- `FOUNDER_PASSWORD_HASH`
- `SESSION_SECRET`

The dashboard checks the signed-in session before showing controls. Only the `founder` role can change availability.

## Enable saving from the dashboard

The new Founder controls save changes directly to `apk-catalog.json` in the `main` branch through GitHub's Contents API. Add this Cloudflare Pages secret:

- `GITHUB_TOKEN` — a fine-grained GitHub personal access token restricted to repository `TheMarkkBradonCollective/main`, with **Contents: Read and write** permission. No other repository permissions are needed.

Add it under Cloudflare Dashboard → Workers & Pages → `mbc-store` → Settings → Variables and Secrets. Mark it as a secret, then redeploy the Pages project so the function receives it. Do not put the token in GitHub source, the public catalog, or browser JavaScript.

The existing login will only work if its three auth settings above are already configured in the Pages project. If sign-in is not yet active, configure those values too. Generate `FOUNDER_PASSWORD_HASH` using:

```bash
node scripts/hash-admin-password.mjs < password.txt
```

Keep the password file private and delete it after use. Generate a long random `SESSION_SECRET` (at least 32 characters).

## Use the controls

1. Sign in at `/admin/login/`.
2. Open the Founder dashboard at `/admin/`.
3. Find an app and choose its availability:
   - **Available** — exposes the APK download (requires an APK URL).
   - **Request to Download** — hides the APK download and displays a disabled request label; request submission is not wired up.
   - **Coming soon** — displays a coming-soon state.
   - **Web only** — marks the app as web-only.
4. Press **Save**. The server verifies the Founder session and commits the change to the GitHub catalog.

The public store reads the same catalog, so the new state appears after the Pages deployment publishes the commit. If GitHub changes the catalog at the same time, refresh and retry.

Changing a listing to Request to Download hides the download action in MBC Store; it does not revoke an APK URL that someone already has.
