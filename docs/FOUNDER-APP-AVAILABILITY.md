# Founder app availability controls

MBC Store reads each app's Android availability from `apk-catalog.json`. The Founder controls whether the public store exposes an APK download by changing the app's `android.status` value.

## Status values

- `available` — show the **Download APK** link (requires a valid `android.downloadUrl`).
- `request-to-download` — show a disabled **Request to Download** label. The request workflow is not wired up yet, so visitors cannot request or download through the store.
- `coming-soon` — show **Coming soon**.
- `web-only` — indicate that the app is currently web-only.

## Change an app's status

1. Open `apk-catalog.json` in the GitHub repository.
2. Find the app by its `slug` or `name`.
3. Change the value inside that app's `android` object. For example:

```json
{
  "slug": "example-app",
  "android": {
    "status": "request-to-download",
    "downloadUrl": "https://your-existing-apk-url"
  }
}
```

4. Commit the change to the `main` branch and let the Pages deployment finish.

To make the app downloadable again, change the status back to `available`. Keep the APK URL and release metadata in place if you plan to re-enable the same release.

## Important

The store UI only exposes the download button when status is exactly `available`. A `request-to-download` app will not show a download link or an active request action. This is a storefront availability switch, not a private-file security control: if an APK's public R2 URL is already known or shared elsewhere, changing the catalog status does not revoke that direct URL.

A dedicated authenticated Founder dashboard that edits and publishes these values is not currently present. Until one is built, the Founder changes the status in the GitHub catalog as described above.
