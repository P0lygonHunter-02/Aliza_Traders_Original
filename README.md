# Aliza Traders

Luxury festive e-commerce — Party · Function · Mehndi · Bridal Luxe  
Stack: **Cloudflare Workers + Hono + D1** (R2 for images later)

## Local development

```bash
npm install
npx wrangler d1 create aliza-db
# put the database_id into wrangler.toml
npm run db:local
npm run dev
```

Open http://localhost:8787

## Deploy (Cloudflare)

```bash
npx wrangler login
npx wrangler d1 create aliza-db
# copy database_id into wrangler.toml under [[d1_databases]]
npm run db:remote
npm run deploy
```

## R2 (images) — when card is ready

1. Enable R2 in Cloudflare dashboard (may ask for card once)
2. Create bucket `aliza-images`
3. Uncomment R2 section in `wrangler.toml`
4. Wire upload API in admin (Phase 4)

## Phases

- **Phase 1** ✅ Foundation, design system, homepage, shop, product, cart (localStorage), contact
- **Phase 2** Admin panel + auth + product CRUD
- **Phase 3** Orders, stats, settings from admin
- **Phase 4** R2 uploads, polish, domain

## Design

Deep maroon · warm gold · ivory — luxury festive, not a copy of any other store.
