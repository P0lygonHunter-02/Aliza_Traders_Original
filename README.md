# Aliza Traders — Luxury Festive E-commerce

Cloudflare Workers + Hono + D1 + R2  
Design: deep maroon · gold · ivory

## Phases
| Phase | Status |
|-------|--------|
| 1 Storefront | Done |
| 2 Admin panel + logo | Done |
| 3 Checkout · orders to D1 · WhatsApp | Done |
| 4 R2 image upload | Done (needs Cloudflare card + bucket) |

## Local setup
```bash
npm install
npx wrangler login
npx wrangler d1 create aliza-db
# paste database_id into wrangler.toml

# R2 optional for local uploads
# npx wrangler r2 bucket create aliza-images

npm run db:local
npm run dev
```

- Store: http://localhost:8787  
- Admin: http://localhost:8787/admin  
- Login: admin / AlizaTraders@2026

## Production
```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put JWT_SECRET
npm run db:remote
npm run deploy
```

## R2
1. Cloudflare Dashboard → R2 → Create bucket `aliza-images`
2. Card may be required once (free tier still $0 within limits)
3. wrangler.toml already binds IMAGES → aliza-images
4. Admin → Products → file upload → products/…
5. Images served at /media/products/… (or set R2_PUBLIC_URL)
