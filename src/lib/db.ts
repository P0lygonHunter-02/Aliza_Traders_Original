import type { Category, Product, SiteSettings } from '../types';

export async function getSettings(db: D1Database): Promise<SiteSettings> {
  const { results } = await db.prepare('SELECT key, value FROM site_settings').all<{ key: string; value: string }>();
  const settings: SiteSettings = {};
  for (const row of results || []) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function setSetting(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    )
    .bind(key, value)
    .run();
}

export async function getCategories(db: D1Database, all = false): Promise<Category[]> {
  const sql = all
    ? 'SELECT * FROM categories ORDER BY sort_order ASC'
    : 'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC';
  const { results } = await db.prepare(sql).all<Category>();
  return results || [];
}

export async function getFeaturedProducts(db: D1Database, limit = 8): Promise<Product[]> {
  const { results } = await db
    .prepare(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 AND p.is_featured = 1
       ORDER BY p.id DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<Product>();
  return results || [];
}

export async function getProducts(
  db: D1Database,
  opts: { category?: string; sale?: boolean; limit?: number; offset?: number; admin?: boolean } = {}
): Promise<Product[]> {
  const limit = opts.limit ?? 24;
  const offset = opts.offset ?? 0;
  let sql = `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE 1=1`;
  const params: (string | number)[] = [];

  if (!opts.admin) {
    sql += ' AND p.is_active = 1';
  }
  if (opts.category) {
    sql += ' AND c.slug = ?';
    params.push(opts.category);
  }
  if (opts.sale) {
    sql += ' AND p.is_sale = 1';
  }
  sql += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const { results } = await db.prepare(sql).bind(...params).all<Product>();
  return results || [];
}

export async function getProductBySlug(db: D1Database, slug: string): Promise<Product | null> {
  const row = await db
    .prepare(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`
    )
    .bind(slug)
    .first<Product>();
  return row || null;
}

export async function getProductById(db: D1Database, id: number): Promise<Product | null> {
  const row = await db
    .prepare(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`
    )
    .bind(id)
    .first<Product>();
  return row || null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export async function getDashboardStats(db: D1Database) {
  const products = await db.prepare('SELECT COUNT(*) as c FROM products').first<{ c: number }>();
  const orders = await db.prepare('SELECT COUNT(*) as c FROM orders').first<{ c: number }>();
  const pending = await db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'pending'`).first<{ c: number }>();
  const messages = await db.prepare('SELECT COUNT(*) as c FROM contact_messages WHERE is_read = 0').first<{ c: number }>();
  const revenue = await db
    .prepare(`SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE status != 'cancelled'`)
    .first<{ s: number }>();
  return {
    products: products?.c ?? 0,
    orders: orders?.c ?? 0,
    pending: pending?.c ?? 0,
    unreadMessages: messages?.c ?? 0,
    revenue: revenue?.s ?? 0,
  };
}

export function formatPrice(pkr: number): string {
  return 'Rs ' + pkr.toLocaleString('en-PK');
}

export function discountPercent(price: number, compare: number | null): number | null {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}
