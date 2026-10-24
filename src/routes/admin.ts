import { Hono } from 'hono';
import type { Env } from '../types';
import {
  checkPassword,
  createSession,
  validateSession,
  destroySession,
  getTokenFromRequest,
  sessionCookie,
  clearSessionCookie,
} from '../lib/auth';
import {
  getDashboardStats,
  getProducts,
  getProductById,
  getCategories,
  getSettings,
  setSetting,
  slugify,
  formatPrice,
} from '../lib/db';

const admin = new Hono<{ Bindings: Env }>();

async function requireAuth(c: any): Promise<boolean> {
  const token = getTokenFromRequest(c);
  return validateSession(c.env.DB, token);
}

/* ---------- Admin SPA shell ---------- */
admin.get('/admin', async (c) => {
  return c.html(adminShell());
});
admin.get('/admin/*', async (c) => {
  return c.html(adminShell());
});

function adminShell(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin · Aliza Traders</title>
  <link rel="stylesheet" href="/css/admin.css" />
  <link rel="icon" href="/img/logo.png" />
</head>
<body>
  <div id="app"><div class="boot">Loading admin…</div></div>
  <script src="/js/admin.js" defer></script>
</body>
</html>`;
}

/* ---------- Auth API ---------- */
admin.post('/api/admin/login', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>().catch(() => ({}));
  const username = (body.username || '').trim();
  const password = body.password || '';
  if (!checkPassword(c.env, username, password)) {
    return c.json({ ok: false, error: 'Invalid username or password' }, 401);
  }
  const token = await createSession(c.env.DB);
  return c.json(
    { ok: true },
    {
      headers: { 'Set-Cookie': sessionCookie(token) },
    }
  );
});

admin.post('/api/admin/logout', async (c) => {
  const token = getTokenFromRequest(c);
  await destroySession(c.env.DB, token);
  return c.json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
});

admin.get('/api/admin/me', async (c) => {
  const ok = await requireAuth(c);
  if (!ok) return c.json({ ok: false }, 401);
  return c.json({ ok: true, user: c.env.ADMIN_USERNAME || 'admin' });
});

/* ---------- Dashboard ---------- */
admin.get('/api/admin/dashboard', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const stats = await getDashboardStats(c.env.DB);
  return c.json({ ok: true, stats });
});

/* ---------- Products ---------- */
admin.get('/api/admin/products', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const products = await getProducts(c.env.DB, { admin: true, limit: 200 });
  return c.json({ ok: true, products });
});

admin.get('/api/admin/products/:id', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const id = Number(c.req.param('id'));
  const product = await getProductById(c.env.DB, id);
  if (!product) return c.json({ ok: false, error: 'Not found' }, 404);
  return c.json({ ok: true, product });
});

admin.post('/api/admin/products', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const b = await c.req.json<any>();
  if (!b.name || !b.price) return c.json({ ok: false, error: 'Name and price required' }, 400);
  let slug = (b.slug || slugify(b.name)).slice(0, 80);
  // ensure unique
  const exists = await c.env.DB.prepare('SELECT id FROM products WHERE slug = ?').bind(slug).first();
  if (exists) slug = `${slug}-${Date.now().toString(36)}`;

  await c.env.DB.prepare(
    `INSERT INTO products (
      category_id, name, slug, description, details, price, compare_at_price,
      image_url, sizes, stock, is_featured, is_new, is_sale, is_active, sold_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      b.category_id || null,
      b.name,
      slug,
      b.description || null,
      b.details || null,
      Number(b.price),
      b.compare_at_price ? Number(b.compare_at_price) : null,
      b.image_url || null,
      b.sizes || 'S,M,L,XL',
      b.stock != null ? Number(b.stock) : 10,
      b.is_featured ? 1 : 0,
      b.is_new ? 1 : 0,
      b.is_sale ? 1 : 0,
      b.is_active === 0 || b.is_active === false ? 0 : 1,
      b.sold_count != null ? Number(b.sold_count) : 0
    )
    .run();

  return c.json({ ok: true, slug });
});

admin.put('/api/admin/products/:id', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const id = Number(c.req.param('id'));
  const b = await c.req.json<any>();
  const existing = await getProductById(c.env.DB, id);
  if (!existing) return c.json({ ok: false, error: 'Not found' }, 404);

  let slug = (b.slug || existing.slug || slugify(b.name || existing.name)).slice(0, 80);
  const clash = await c.env.DB.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').bind(slug, id).first();
  if (clash) slug = `${slug}-${id}`;

  await c.env.DB.prepare(
    `UPDATE products SET
      category_id = ?, name = ?, slug = ?, description = ?, details = ?,
      price = ?, compare_at_price = ?, image_url = ?, sizes = ?, stock = ?,
      is_featured = ?, is_new = ?, is_sale = ?, is_active = ?, sold_count = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(
      b.category_id ?? existing.category_id,
      b.name ?? existing.name,
      slug,
      b.description ?? existing.description,
      b.details ?? existing.details,
      b.price != null ? Number(b.price) : existing.price,
      b.compare_at_price != null && b.compare_at_price !== '' ? Number(b.compare_at_price) : null,
      b.image_url ?? existing.image_url,
      b.sizes ?? existing.sizes,
      b.stock != null ? Number(b.stock) : existing.stock,
      b.is_featured ? 1 : 0,
      b.is_new ? 1 : 0,
      b.is_sale ? 1 : 0,
      b.is_active === 0 || b.is_active === false ? 0 : 1,
      b.sold_count != null ? Number(b.sold_count) : existing.sold_count,
      id
    )
    .run();

  return c.json({ ok: true });
});

admin.delete('/api/admin/products/:id', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

/* ---------- Categories ---------- */
admin.get('/api/admin/categories', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const categories = await getCategories(c.env.DB, true);
  return c.json({ ok: true, categories });
});

/* ---------- Orders ---------- */
admin.get('/api/admin/orders', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const { results } = await c.env.DB.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 100').all();
  return c.json({ ok: true, orders: results || [] });
});

admin.patch('/api/admin/orders/:id', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const id = Number(c.req.param('id'));
  const b = await c.req.json<{ status?: string }>();
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!b.status || !allowed.includes(b.status)) return c.json({ ok: false, error: 'Invalid status' }, 400);
  await c.env.DB.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(b.status, id)
    .run();
  return c.json({ ok: true });
});

/* ---------- Messages ---------- */
admin.get('/api/admin/messages', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const { results } = await c.env.DB.prepare('SELECT * FROM contact_messages ORDER BY id DESC LIMIT 100').all();
  return c.json({ ok: true, messages: results || [] });
});

admin.patch('/api/admin/messages/:id/read', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

admin.delete('/api/admin/messages/:id', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('DELETE FROM contact_messages WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

/* ---------- Phase 4: Image upload to R2 ---------- */
admin.post('/api/admin/upload', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  if (!c.env.IMAGES) {
    return c.json(
      {
        ok: false,
        error: 'R2 not configured. Create bucket "aliza-images" and bind IMAGES in wrangler.toml',
      },
      503
    );
  }
  try {
    const form = await c.req.parseBody();
    const file = form['file'];
    if (!file || typeof file === 'string') {
      return c.json({ ok: false, error: 'No file uploaded' }, 400);
    }
    const f = file as File;
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (f.size > maxBytes) return c.json({ ok: false, error: 'Max file size 5MB' }, 400);
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (f.type && !allowed.includes(f.type)) {
      return c.json({ ok: false, error: 'Only JPG, PNG, WebP, GIF allowed' }, 400);
    }
    const ext =
      f.type === 'image/png'
        ? 'png'
        : f.type === 'image/webp'
          ? 'webp'
          : f.type === 'image/gif'
            ? 'gif'
            : 'jpg';
    const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await c.env.IMAGES.put(key, await f.arrayBuffer(), {
      httpMetadata: { contentType: f.type || 'image/jpeg' },
    });
    const publicBase = (c.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    const url = publicBase ? `${publicBase}/${key}` : `/media/${key}`;
    return c.json({ ok: true, key, url });
  } catch (e) {
    console.error(e);
    return c.json({ ok: false, error: 'Upload failed' }, 500);
  }
});

/* ---------- Settings ---------- */
admin.get('/api/admin/settings', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const settings = await getSettings(c.env.DB);
  return c.json({ ok: true, settings });
});

admin.put('/api/admin/settings', async (c) => {
  if (!(await requireAuth(c))) return c.json({ ok: false }, 401);
  const body = await c.req.json<Record<string, string>>();
  const allowed = [
    'phone',
    'whatsapp',
    'email',
    'instagram',
    'facebook',
    'tiktok',
    'address',
    'announcement',
    'hero_title',
    'hero_subtitle',
    'shipping_note',
    'stats_customers',
    'stats_designs',
    'stats_orders',
    'stats_rating',
    'site_name',
  ];
  for (const key of allowed) {
    if (key in body && body[key] != null) {
      await setSetting(c.env.DB, key, String(body[key]));
    }
  }
  return c.json({ ok: true });
});

export default admin;
export { formatPrice };
