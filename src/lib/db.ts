import type { Env, Category, Product, SiteSettings } from '../types';

export async function getSettings(db: D1Database): Promise<SiteSettings> {
  const { results } = await db.prepare('SELECT key, value FROM site_settings').all<{ key: string; value: string }>();
  const settings: SiteSettings = {};
  for (const row of results || []) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function getCategories(db: D1Database): Promise<Category[]> {
  const { results } = await db
    .prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC')
    .all<Category>();
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
  opts: { category?: string; sale?: boolean; limit?: number; offset?: number } = {}
): Promise<Product[]> {
  const limit = opts.limit ?? 24;
  const offset = opts.offset ?? 0;
  let sql = `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.is_active = 1`;
  const params: (string | number)[] = [];

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

export function formatPrice(pkr: number): string {
  return 'Rs ' + pkr.toLocaleString('en-PK');
}

export function discountPercent(price: number, compare: number | null): number | null {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}
