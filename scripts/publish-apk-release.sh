#!/usr/bin/env bash
# Publish MBC APK bundle zip(s) to TheMarkkBradonCollective/main GitHub Releases.
set -euo pipefail
cd "$(dirname "$0")/.."

FULL=false
for arg in "$@"; do
  if [[ "$arg" == "--full" ]]; then FULL=true; fi
done

VERSION=$(node -p "require('./version.json').version")
TAG="apks-v${VERSION}"
REPO="TheMarkkBradonCollective/main"

if $FULL; then
  npm run package-apk-release -- --full
  ZIP="release/MBC-All-APKs-full-v${VERSION}.zip"
  TITLE="MBC APK archive v${VERSION}"
  NOTES="Full mirror of every APK under apks/ on the MBC site — current builds plus archived versions."
else
  npm run package-apk-release
  ZIP="release/MBC-All-APKs-latest-v${VERSION}.zip"
  TITLE="MBC APK bundle v${VERSION}"
  NOTES="Latest Android APK for every app in the MBC catalog (19 apps + MBC Store). Install from https://themarkkbradoncollective.github.io/main/download/"
fi

if [[ ! -f "$ZIP" ]]; then
  echo "Missing $ZIP — run npm run package-apk-release first."
  exit 1
fi

if ! gh repo view "$REPO" &>/dev/null; then
  echo "Cannot access $REPO — authenticate as TheMarkkBradonCollective."
  exit 1
fi

if gh release view "$TAG" --repo "$REPO" &>/dev/null; then
  gh release upload "$TAG" "$ZIP" --repo "$REPO" --clobber
  echo "Updated asset on existing release $TAG"
else
  gh release create "$TAG" \
    --repo "$REPO" \
    --title "$TITLE" \
    --notes "$NOTES" \
    "$ZIP"
fi

echo "Published https://github.com/$REPO/releases/tag/$TAG"
