# My Happy Plate

Food truck site for **Tyrone Johnson**.

Tagline: *A Little Happy in Every Bite.*

This folder is the **standalone app**. It is sitting inside The Markk Brandon Collective `main` repo only until GitHub lets us create `TheMarkkBradonCollective/MyHappyPlate`. Split it with the commands below.

## Live (while still on main)

- Public: https://themarkkbradoncollective.github.io/main/my-happy-plate/
- Pre-order: https://themarkkbradoncollective.github.io/main/my-happy-plate/order/
- Kitchen: https://themarkkbradoncollective.github.io/main/my-happy-plate/kitchen/

## Pre-orders

Customers hold a plate for a pickup window. They pay at the truck.

1. Tap **Pre-order** on dinner or a menu item
2. Name, phone, pickup time, kitchen note
3. Confirmation code like `MHP-0828-0001`
4. Kitchen board: new → confirmed → cooking → ready → picked up

Dinner quantity counts down when a dinner plate is pre-ordered.

Browser storage for now (`localStorage`). Schema for Supabase is in `migrations/202608280145_init_and_preorders.sql`.

## Split into its own GitHub repo

On a machine with repo-create permission:

```bash
cd my-happy-plate
git init
git add .
git commit -m "My Happy Plate — site, kitchen, pre-orders"
gh repo create TheMarkkBradonCollective/MyHappyPlate --public --source=. --remote=origin --push
```

Then point a Vercel project at that repo (this folder is the site root). `vercel.json` is already here.

## Brand

Burgundy, charcoal, forest green, cream. Fall warmth, not Christmas. Voice: “Come get you a plate.”
