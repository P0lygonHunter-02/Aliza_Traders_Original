import { Hono } from 'hono';
import { getSettings, getCategories, getFeaturedProducts, getProducts, getProductBySlug, formatPrice, discountPercent } from './lib/db';
import type { Env, Product, SiteSettings, Category } from './types';

const app = new Hono<{ Bindings: Env }>();

/* ---------- HELPERS ---------- */
function layout(opts: {
  title: string;
  settings: SiteSettings;
  body: string;
  activeNav?: string;
}) {
  const site = opts.settings;
  const name = site.site_name || 'Aliza Traders';
  const wa = (site.whatsapp || '923000000000').replace(/[^0-9]/g, '');
  const announcement = site.announcement || 'Nationwide COD · Party · Function · Mehndi · Bridal';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${opts.title} · ${name}</title>
  <meta name="description" content="Aliza Traders — Luxury festive wear for Party, Function, Mehndi & Bridal. Nationwide COD in Pakistan." />
  <link rel="stylesheet" href="/css/style.css" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>" />
</head>
<body>
  <div class="announcement" aria-hidden="true">
    <div class="announcement-track">${announcement} &nbsp;✦&nbsp; ${announcement} &nbsp;✦&nbsp; ${announcement}</div>
  </div>

  <header class="header">
    <div class="header-inner">
      <button class="icon-btn" id="menuBtn" aria-label="Menu">
        <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h14M4 12h14M4 17h14"/></svg>
      </button>
      <a href="/" class="logo">Aliza <span>Traders</span></a>
      <div class="header-actions">
        <a href="/shop" class="icon-btn" aria-label="Search">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg>
        </a>
        <a href="/cart" class="icon-btn cart-btn" aria-label="Cart">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/><path d="M6 6L5 2H2"/></svg>
          <span class="cart-count" id="cartCount">0</span>
        </a>
      </div>
    </div>
  </header>

  ${opts.body}

  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <div class="logo">Aliza <span>Traders</span></div>
        <p>Luxury festive wear crafted for celebrations — Party, Function, Mehndi & Bridal Luxe. Nationwide delivery across Pakistan.</p>
        <div class="socials">
          ${site.instagram ? `<a href="${site.instagram}" target="_blank" rel="noopener" aria-label="Instagram">IG</a>` : ''}
          ${site.facebook ? `<a href="${site.facebook}" target="_blank" rel="noopener" aria-label="Facebook">FB</a>` : ''}
          ${site.tiktok ? `<a href="${site.tiktok}" target="_blank" rel="noopener" aria-label="TikTok">TT</a>` : ''}
        </div>
      </div>
      <div>
        <h4>Shop</h4>
        <a href="/shop">All Products</a>
        <a href="/shop?cat=party-wear">Party Wear</a>
        <a href="/shop?cat=function-wear">Function Wear</a>
        <a href="/shop?cat=mehndi-wear">Mehndi Wear</a>
        <a href="/shop?cat=bridal-luxe">Bridal Luxe</a>
      </div>
      <div>
        <h4>Contact</h4>
        <a href="tel:${site.phone || ''}">${site.phone || '—'}</a>
        <a href="mailto:${site.email || ''}">${site.email || '—'}</a>
        <a href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp Order</a>
        <p style="margin-top:12px;font-size:12px;opacity:0.75">${site.shipping_note || ''}</p>
      </div>
    </div>
    <div class="footer-bottom container">© ${new Date().getFullYear()} Aliza Traders. All rights reserved.</div>
  </footer>

  <nav class="bottom-nav" aria-label="Mobile">
    <a href="/" class="${opts.activeNav === 'home' ? 'active' : ''}">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"/></svg>
      Home
    </a>
    <a href="/shop" class="${opts.activeNav === 'shop' ? 'active' : ''}">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      Shop
    </a>
    <a href="/cart" class="${opts.activeNav === 'cart' ? 'active' : ''}">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>
      Cart
    </a>
    <a href="/contact" class="${opts.activeNav === 'contact' ? 'active' : ''}">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16v12H4z"/><path d="M4 6l8 7 8-7"/></svg>
      Contact
    </a>
  </nav>

  <a class="wa-float" href="https://wa.me/${wa}?text=${encodeURIComponent('Hi Aliza Traders, I want to order...')}" target="_blank" rel="noopener" aria-label="WhatsApp">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>

  <script src="/js/app.js" defer></script>
</body>
</html>`;
}

function productCard(p: Product): string {
  const off = discountPercent(p.price, p.compare_at_price);
  const img = p.image_url || 'https://picsum.photos/seed/placeholder/600/800';
  return `
  <a href="/product/${p.slug}" class="product-card">
    <div class="product-media">
      <img src="${img}" alt="${p.name}" loading="lazy" width="600" height="800" />
      <div class="product-badges">
        ${p.is_sale && off ? `<span class="badge badge-sale">-${off}%</span>` : ''}
        ${p.is_new ? `<span class="badge badge-new">New</span>` : ''}
        ${p.stock <= 0 ? `<span class="badge badge-oos">Out of stock</span>` : ''}
      </div>
    </div>
    <div class="product-body">
      <div class="product-cat">${p.category_name || ''}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">
        <span class="price-now">${formatPrice(p.price)}</span>
        ${p.compare_at_price ? `<span class="price-was">${formatPrice(p.compare_at_price)}</span>` : ''}
        ${off ? `<span class="price-off">-${off}%</span>` : ''}
      </div>
    </div>
  </a>`;
}

/* ---------- ROUTES ---------- */

app.get('/', async (c) => {
  const db = c.env.DB;
  const [settings, categories, featured] = await Promise.all([
    getSettings(db),
    getCategories(db),
    getFeaturedProducts(db, 8),
  ]);

  const catsHtml = categories
    .map(
      (cat) => `
    <a href="/shop?cat=${cat.slug}" class="cat-card">
      <img class="cat-img" src="${cat.image_url || `https://picsum.photos/seed/cat${cat.id}/200/200`}" alt="${cat.name}" width="96" height="96" loading="lazy" />
      <div class="cat-name">${cat.name}</div>
    </a>`
    )
    .join('');

  const productsHtml = featured.map(productCard).join('');

  const body = `
  <section class="hero">
    <div class="hero-content">
      <div class="hero-eyebrow">Luxury Festive Collection</div>
      <h1>${settings.hero_title || 'Celebrate in Style'}</h1>
      <p>${settings.hero_subtitle || 'Party · Function · Mehndi · Bridal Luxe — crafted for your most beautiful moments.'}</p>
      <div class="hero-actions">
        <a href="/shop" class="btn btn-primary">Shop Collection</a>
        <a href="/shop?cat=bridal-luxe" class="btn btn-outline">Bridal Luxe</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Categories</h2>
        <a href="/shop" class="section-link">View all</a>
      </div>
      <div class="cat-scroll">${catsHtml}</div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Featured</h2>
        <a href="/shop" class="section-link">Shop all</a>
      </div>
      <div class="product-grid">${productsHtml || '<p class="empty-state">Products coming soon.</p>'}</div>
    </div>
  </section>

  <div class="trust-bar">
    <div class="container trust-grid">
      <div class="trust-item"><strong>${settings.stats_customers || '500+'}</strong><span>Happy Customers</span></div>
      <div class="trust-item"><strong>${settings.stats_designs || '50+'}</strong><span>Unique Designs</span></div>
      <div class="trust-item"><strong>${settings.stats_orders || '1200+'}</strong><span>Orders Delivered</span></div>
      <div class="trust-item"><strong>${settings.stats_rating || '4.9'}</strong><span>Average Rating</span></div>
    </div>
  </div>
  `;

  return c.html(layout({ title: 'Home', settings, body, activeNav: 'home' }));
});

app.get('/shop', async (c) => {
  const db = c.env.DB;
  const cat = c.req.query('cat') || undefined;
  const [settings, products, categories] = await Promise.all([
    getSettings(db),
    getProducts(db, { category: cat, limit: 24 }),
    getCategories(db),
  ]);

  const catName = cat ? categories.find((x) => x.slug === cat)?.name : null;
  const body = `
  <section class="section">
    <div class="container">
      <div class="section-header">
        <h1 class="section-title">${catName || 'All Products'}</h1>
        <a href="/shop" class="section-link">Clear filter</a>
      </div>
      <div class="cat-scroll" style="margin-bottom:24px">
        ${categories.map((c) => `<a href="/shop?cat=${c.slug}" class="cat-card" style="width:auto;padding:8px 16px;background:${c.slug===cat?'var(--maroon)':'var(--white)'};color:${c.slug===cat?'var(--gold-light)':'var(--text)'};border-radius:999px;border:1px solid var(--border);font-size:13px;font-weight:600">${c.name}</a>`).join('')}
      </div>
      <div class="product-grid">${products.map(productCard).join('') || '<p class="empty-state">No products in this category yet.</p>'}</div>
    </div>
  </section>`;

  return c.html(layout({ title: catName || 'Shop', settings, body, activeNav: 'shop' }));
});

app.get('/product/:slug', async (c) => {
  const db = c.env.DB;
  const slug = c.req.param('slug');
  const [settings, product] = await Promise.all([getSettings(db), getProductBySlug(db, slug)]);
  if (!product) return c.html(layout({ title: 'Not Found', settings, body: '<p class="empty-state">Product not found.</p>' }), 404);

  const off = discountPercent(product.price, product.compare_at_price);
  const img = product.image_url || 'https://picsum.photos/seed/placeholder/600/800';
  const sizes = (product.sizes || 'S,M,L,XL').split(',').map((s) => s.trim());
  const details = (product.details || '')
    .split('\n')
    .filter(Boolean)
    .map((line) => `<li>${line}</li>`)
    .join('');
  const wa = (settings.whatsapp || '923000000000').replace(/[^0-9]/g, '');
  const waMsg = encodeURIComponent(`Hi Aliza Traders, I want to order: ${product.name} (${formatPrice(product.price)})`);

  const body = `
  <div class="pdp-media"><img src="${img}" alt="${product.name}" /></div>
  <div class="pdp-info">
    <div class="product-cat">${product.category_name || ''}</div>
    <h1 class="pdp-title">${product.name}</h1>
    <div class="pdp-price-row">
      <span class="price-now" style="font-size:22px">${formatPrice(product.price)}</span>
      ${product.compare_at_price ? `<span class="price-was">${formatPrice(product.compare_at_price)}</span>` : ''}
      ${off ? `<span class="badge badge-sale">-${off}%</span>` : ''}
    </div>
    ${product.sold_count > 0 ? `<p style="font-size:13px;color:var(--gold-dim);margin-bottom:12px">⚡ ${product.sold_count} sold recently</p>` : ''}
    <p style="font-size:14px;color:var(--text-soft);margin-bottom:20px">${product.description || ''}</p>
    <div style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:600;margin-bottom:8px">Size</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap" id="sizeRow">
        ${sizes.map((s) => `<button type="button" class="size-chip" data-size="${s}" style="width:44px;height:44px;border-radius:50%;border:1.5px solid var(--border);background:white;font-weight:600;cursor:pointer">${s}</button>`).join('')}
      </div>
    </div>
    <ul style="font-size:13px;color:var(--text-soft);line-height:1.8;padding-left:18px;margin-bottom:24px">${details}</ul>
  </div>
  <div class="pdp-sticky-cta">
    <button type="button" class="cta-cart" id="addCartBtn" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-img="${img}">ADD TO CART</button>
    <a class="cta-buy" href="https://wa.me/${wa}?text=${waMsg}" target="_blank" rel="noopener">BUY ON WHATSAPP</a>
  </div>
  <script>
    document.querySelectorAll('.size-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.size-chip').forEach(b => { b.style.borderColor='var(--border)'; b.style.background='white'; b.style.color=''; });
        btn.style.borderColor='var(--maroon)'; btn.style.background='var(--maroon)'; btn.style.color='var(--gold-light)';
      });
    });
  </script>
  `;

  return c.html(layout({ title: product.name, settings, body, activeNav: 'shop' }));
});

app.get('/cart', async (c) => {
  const settings = await getSettings(c.env.DB);
  const body = `
  <section class="section">
    <div class="container">
      <h1 class="section-title" style="margin-bottom:20px">Your Cart</h1>
      <div id="cartRoot"><p class="empty-state">Loading…</p></div>
    </div>
  </section>`;
  return c.html(layout({ title: 'Cart', settings, body, activeNav: 'cart' }));
});

app.get('/contact', async (c) => {
  const settings = await getSettings(c.env.DB);
  const body = `
  <section class="section">
    <div class="container" style="max-width:520px">
      <h1 class="section-title" style="margin-bottom:8px">Contact Us</h1>
      <p style="color:var(--text-soft);margin-bottom:24px;font-size:14px">Questions about sizes, custom orders or delivery? Send a message — we reply fast.</p>
      <form id="contactForm" style="display:grid;gap:14px">
        <input name="name" required placeholder="Your name" style="padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius-sm);background:white" />
        <input name="phone" required placeholder="Phone / WhatsApp" style="padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius-sm);background:white" />
        <input name="email" type="email" placeholder="Email (optional)" style="padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius-sm);background:white" />
        <textarea name="message" required rows="4" placeholder="Your message" style="padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius-sm);background:white;resize:vertical"></textarea>
        <button type="submit" class="btn btn-primary" style="width:100%">Send Message</button>
        <p id="contactMsg" style="font-size:13px;text-align:center"></p>
      </form>
    </div>
  </section>`;
  return c.html(layout({ title: 'Contact', settings, body, activeNav: 'contact' }));
});

/* API — contact (Phase 1 basic) */
app.post('/api/contact', async (c) => {
  try {
    const body = await c.req.json<{ name: string; phone?: string; email?: string; message: string }>();
    if (!body.name || !body.message) return c.json({ ok: false, error: 'Name and message required' }, 400);
    await c.env.DB.prepare(
      'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)'
    )
      .bind(body.name, body.email || null, body.phone || null, body.message)
      .run();
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ ok: false, error: 'Failed to save' }, 500);
  }
});

/* Health */
app.get('/api/health', (c) => c.json({ ok: true, service: 'aliza-traders' }));

export default app;
