# My Happy Plate

Food truck site for **Tyrone Johnson**.

Tagline: *A Little Happy in Every Bite.*

Pre-orders run in the browser for now (`localStorage`). Database comes later — schema is in `migrations/202608280145_init_and_preorders.sql`.

## Live

Public site (GitHub Pages, on the Collective `main` repo until `MyHappyPlate` exists):

- **Home:** https://themarkkbradoncollective.github.io/main/my-happy-plate/
- **Pre-order:** https://themarkkbradoncollective.github.io/main/my-happy-plate/order/

Kitchen is staff-only (`/kitchen/`, PIN `plate`). Not linked from the public footer.

When this folder is its own repo, Pages will be:

- https://themarkkbradoncollective.github.io/MyHappyPlate/

## Pre-orders

Customers hold a plate for a pickup window. They pay at the truck.

1. Tap **Pre-order** on dinner or a menu item
2. Name, phone, pickup time, kitchen note
3. Confirmation code like `MHP-0828-0001`
4. Kitchen board: new → confirmed → cooking → ready → picked up

Dinner quantity counts down when a dinner plate is pre-ordered.

## Own GitHub repo

This agent cannot create `TheMarkkBradonCollective/MyHappyPlate` (GitHub App 403). Create an **empty public repo** with that name (no README, no .gitignore, no license). Then:

```bash
./scripts/publish-own-repo.sh TheMarkkBradonCollective/MyHappyPlate
```

That push enables GitHub Pages from `main`. `vercel.json` is here if you point Vercel at the same repo later.

## Brand

Burgundy, charcoal, forest green, cream. Fall warmth, not Christmas. Voice: “Come get you a plate.”
