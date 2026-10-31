#!/usr/bin/env bash
# Upload large repo assets to mbc-store-apks via temporary Workers upload proxy.
set -euo pipefail

UPLOAD_URL="${UPLOAD_URL:?UPLOAD_URL required}"
UPLOAD_SECRET="${UPLOAD_SECRET:?UPLOAD_SECRET required}"
ROOT="${ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

put_file() {
  local src="$1"
  local key="$2"
  echo "→ $key ($(du -h "$src" | cut -f1))"
  curl -fsS -X PUT \
    -H "x-auth: ${UPLOAD_SECRET}" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@${src}" \
    "${UPLOAD_URL}?key=${key}" >/dev/null
}

# Friendr
put_file "$ROOT/apks/friendr/friendr.apk" "friendr/friendr-v1.0.0.apk"
put_file "$ROOT/apks/friendr/friendr.apk" "friendr/latest.apk"

# TheBuffaloFree — mirror all APKs under buffalofree/
while IFS= read -r -d '' f; do
  base=$(basename "$f")
  put_file "$f" "buffalofree/${base}"
done < <(find "$ROOT/apks/buffalofree" -name '*.apk' -print0)
put_file "$ROOT/apks/buffalofree/sac-buy-nothing-beta-v0.2.0.0053.apk" "buffalofree/latest.apk"

# TheSacramentoFree (buynothing slug)
while IFS= read -r -d '' f; do
  base=$(basename "$f")
  put_file "$f" "buynothing/${base}"
done < <(find "$ROOT/apks/buynothing" -name '*.apk' -print0)
put_file "$ROOT/apks/buynothing/sac-buy-nothing-beta-v0.2.0.0057.apk" "buynothing/latest.apk"

# Verse family bundle zip
put_file "$ROOT/download/releases/Verse-v1.zip" "verse/Verse-v1.zip"
put_file "$ROOT/download/releases/Verse-v1.zip" "verse/latest.zip"

echo "Done uploading large assets to R2."
