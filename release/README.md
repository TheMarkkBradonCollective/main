# MBC APK release bundles

Generated zips for [GitHub Releases](https://github.com/TheMarkkBradonCollective/main/releases) on this repo.

| Command | Output |
|---------|--------|
| `npm run package-apk-release` | `MBC-All-APKs-latest-v*.zip` — one current APK per catalog app + MBC Store |
| `npm run package-apk-release -- --full` | `MBC-All-APKs-full-v*.zip` — every mirrored APK under `apks/` (includes archives) |

Each zip includes `MANIFEST.json` and `README.txt`.

Publish to GitHub (needs owner `gh auth` or `GITHUB_TOKEN`):

```bash
./scripts/publish-apk-release.sh
# or full archive:
./scripts/publish-apk-release.sh --full
```

Release tag: `apks-v{site version}` (from `version.json`).

Zip files are not committed to git — attach them via GitHub Releases only.
