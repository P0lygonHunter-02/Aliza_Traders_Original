# Aliza Traders — Luxury Festive E-commerce

Cloudflare Workers + Hono + D1. Design: deep maroon · gold · ivory.

## Phase status
- **Phase 1** — Storefront (Home, Shop, PDP, Cart, Contact) ✅
- **Phase 2** — Admin panel (login, products CRUD, orders, messages, settings) + logo ✅
- **Phase 3** — Checkout / orders to DB (pending)
- **Phase 4** — R2 image uploads (pending — needs Cloudflare card)

## Local setup
```bash
npm install
npx wrangler login
npx wrangler d1 create aliza-db
# paste database_id into wrangler.toml
npm run db:local
npm run dev
```

- Store: http://localhost:8787  
- Admin: http://localhost:8787/admin  
- Default login: `admin` / `AlizaTraders@2026` (override with secrets in production)

## Production secrets
```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put JWT_SECRET
```
