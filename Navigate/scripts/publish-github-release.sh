#!/usr/bin/env bash
# Publish Navigate APK + release zip to TheMarkkBradonCollective/Navigate GitHub Releases.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"
REPO="TheMarkkBradonCollective/Navigate"

npm run release:zip

APK="public/navigate.apk"
ZIP="release/Navigate-v${VERSION}-release.zip"
APK_NAME="Navigate-v${VERSION}.apk"

if ! gh repo view "$REPO" &>/dev/null; then
  echo "Repository $REPO not found. Create it on GitHub first, then push this folder:"
  echo "  ./scripts/push-repo.sh"
  exit 1
fi

if gh release view "$TAG" --repo "$REPO" &>/dev/null; then
  gh release delete "$TAG" --repo "$REPO" --yes
fi

gh release create "$TAG" \
  --repo "$REPO" \
  --title "Navigate v${VERSION}" \
  --notes "Custom GPS navigation with OpenStreetMap routing and Android Auto in-car shell." \
  "$APK#${APK_NAME}" \
  "$ZIP"

echo "Published $TAG to https://github.com/$REPO/releases/tag/$TAG"
