# MBC Store APK release process

MBC Store is the Markk Brandon Collective's private-intended catalog for the Collective's own Android products. Releases are APK-based; AAB/Google Play publishing is not part of this workflow.

## Publish an app update

1. Build a release APK in the app's own repository.
2. Keep the existing Android application ID (packageId) and signing certificate. Do not generate a replacement release key for an update.
3. Increase Android versionCode; update the user-facing version.
4. Upload the APK to the configured APK host (currently the MBC Store R2 bucket) using a versioned release filename. Update the app's stable download URL only after the uploaded APK has been checked.
5. Calculate SHA-256 for the final APK and update that app's apk-catalog.json entry: version, versionCode, packageId, updatedAt, downloadUrl, downloadName, fileSize, sha256, and releaseNotes.
6. Confirm the release installs on a clean test device and upgrades an existing install signed with the same key.
7. Commit the catalog change to main. GitHub Actions deploys the updated catalog and store UI to Cloudflare Pages.

Example checksum command:

```bash
sha256sum path/to/release.apk
```

## Android install and update behavior

- The store website downloads an APK. Android's package installer performs the install and may require the user to approve installation from the browser or file manager.
- An APK update can install over an existing app only when its application ID and signing certificate match the installed app, and its version code is acceptable to Android.
- If the signing certificate changed, an in-place update is not possible. Uninstalling first may remove local app data. Treat key changes as a migration, not a routine release.
- A PWA cannot reliably inspect the device's installed package inventory or silently install/update native APKs. MBC Store therefore provides release metadata and download/install guidance; Android handles the actual APK installation.
- A listed SHA-256 is release metadata for checking the downloaded file. It is not currently verified automatically by the store UI.

## Privacy and access

The current catalog's APK links use a public r2.dev base URL and the Pages site is publicly reachable. This is not private distribution yet. Do not put confidential APKs or internal-only builds there until access control is configured and tested.

To make the store private, configure Cloudflare Access (or an authenticated application gateway) for the Pages hostname and replace public R2 object URLs with authenticated downloads, such as a Worker that checks an authorized session before streaming the APK. Protecting the website alone is insufficient if APK object URLs remain public. Keep secrets and signing keys out of Git and out of the static Pages output.

## Release checklist

- [ ] APK built from the intended app repository and release variant
- [ ] Existing package ID retained
- [ ] Existing signing key/certificate verified
- [ ] Version code increased
- [ ] APK uploaded and URL tested
- [ ] File size and SHA-256 recorded
- [ ] Clean install tested
- [ ] Same-key upgrade tested
- [ ] Catalog committed and Cloudflare deployment confirmed
- [ ] Access controls tested before treating the release as private
