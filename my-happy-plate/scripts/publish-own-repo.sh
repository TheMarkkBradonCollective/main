#!/usr/bin/env bash
# Push this folder to TheMarkkBradonCollective/MyHappyPlate and enable GitHub Pages.
# The cloud agent cannot create the repo (GitHub App 403). Create an empty public
# repo named MyHappyPlate first, or pass a PAT that can.
set -euo pipefail

REPO="${1:-TheMarkkBradonCollective/MyHappyPlate}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN="FAKESECRET_q3r4s5t6u7v8w9x0y1z2"

api() {
  if [[ -n "$TOKEN" ]]; then
    gh api --header "Authorization: Bearer $TOKEN" "$@"
  else
    gh api "$@"
  fi
}

if ! api "repos/$REPO" >/dev/null 2>&1; then
  echo "Repo $REPO does not exist yet."
  echo "Create an empty public repo named MyHappyPlate (no README), then rerun:"
  echo "  $0 $REPO"
  exit 1
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
rsync -a --exclude .git "$ROOT/" "$WORKDIR/"
cd "$WORKDIR"
git init
git checkout -b main
git add .
git -c user.name="My Happy Plate" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -m "My Happy Plate — live site, kitchen, pre-orders"
git remote add origin "https://github.com/${REPO}.git"
git push -u origin main --force

# Enable GitHub Pages from main /
api --method POST "repos/$REPO/pages" --input - <<'JSON' || true
{
  "build_type": "workflow"
}
JSON

echo "Pushed. Pages URL (once built):"
echo "  https://themarkkbradoncollective.github.io/MyHappyPlate/"
