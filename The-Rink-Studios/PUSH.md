# Push to its own repo

This folder is the standalone source for **TheMarkkBradonCollective/the-rink-studios**.

## One-time setup

1. Create an empty public repo on GitHub: **TheMarkkBradonCollective/the-rink-studios** (no README).
2. From this directory:

```bash
chmod +x scripts/push-repo.sh
./scripts/push-repo.sh
```

3. In the new repo: **Settings → Pages → Deploy from branch `main` / root**.

Live URL: https://themarkkbradoncollective.github.io/the-rink-studios/

## Local preview

```bash
python3 -m http.server 8080
```

Open http://127.0.0.1:8080/
