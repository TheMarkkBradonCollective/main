#!/usr/bin/env bash
# Push this Navigate directory to its own GitHub repo (after you create it).
set -euo pipefail
REPO="TheMarkkBradonCollective/Navigate"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -d "$ROOT/.git" ]]; then
  cd "$ROOT"
  git init -b main
  git add -A
  git commit -m "Navigate v$(node -p "require('./package.json').version") — GPS + Android Auto"
fi

cd "$ROOT"
if ! git remote get-url origin &>/dev/null; then
  git remote add origin "https://github.com/${REPO}.git"
fi

git push -u origin main
echo "Pushed to https://github.com/${REPO}"
