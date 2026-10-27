#!/usr/bin/env bash
# Push The-Rink-Studios to its own GitHub repo (create the repo first if needed).
set -euo pipefail
REPO="TheMarkkBradonCollective/the-rink-studios"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -d "$ROOT/.git" ]]; then
  cd "$ROOT"
  git init -b main
  git add -A
  git commit -m "The Rink Studios v$(node -p "require('./package.json').version") — concept redesign"
fi

cd "$ROOT"
if ! git remote get-url origin &>/dev/null; then
  git remote add origin "https://github.com/${REPO}.git"
fi

git push -u origin main
echo "Pushed to https://github.com/${REPO}"
echo "Enable GitHub Pages: Settings → Pages → Deploy from branch main / root"
echo "Live URL: https://themarkkbradoncollective.github.io/the-rink-studios/"
