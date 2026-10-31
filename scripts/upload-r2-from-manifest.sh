#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/.r2-staging/manifest.json"
UPLOAD_URL="${UPLOAD_URL:?}"
UPLOAD_SECRET="${UPLOAD_SECRET:?}"

put() {
  local file="$1"
  local key="$2"
  local ct="${3:-application/vnd.android.package-archive}"
  local url
  url=$(UPLOAD_URL="$UPLOAD_URL" KEY="$key" python3 -c "import os,urllib.parse; print(os.environ['UPLOAD_URL']+'?key='+urllib.parse.quote(os.environ['KEY'], safe=''))")
  curl -fsS -X PUT -H "x-auth: ${UPLOAD_SECRET}" -H "Content-Type: ${ct}" \
    --data-binary "@${file}" "$url" >/dev/null
  echo "  ↑ ${key}"
}

while IFS=$'\t' read -r file slug ver; do
  [[ -f "$file" ]] || { echo "missing $file" >&2; exit 1; }
  put "$file" "${slug}/latest.apk"
  put "$file" "${slug}/${ver}"
done < <(node -e "
const m=require(process.argv[1]);
for (const u of m.uploads) console.log([u.staged,u.slug,u.versionedName].join('\t'));
" "$MANIFEST")

# Friendr v1.2.0 (already cataloged — refresh mirror)
FR=/tmp/friendr-v1.2.0.apk
if [[ ! -f "$FR" ]]; then
  curl -fsSL -o "$FR" 'https://friendr.themarkkbrandoncollective-2d9.workers.dev/friendr.apk' || true
fi
if [[ -f "$FR" ]]; then
  put "$FR" 'friendr/latest.apk'
  put "$FR" 'friendr/friendr-v1.2.0.apk'
fi

ZIP="$ROOT/download/releases/Verse-v1.zip"
if [[ ! -f "$ZIP" && -f /tmp/Verse-v1.zip.bak ]]; then ZIP=/tmp/Verse-v1.zip.bak; fi
if [[ -f "$ZIP" ]]; then
  put "$ZIP" 'verse/Verse-v1.zip' 'application/zip'
  put "$ZIP" 'verse/latest.zip' 'application/zip'
fi

echo "Upload complete."
