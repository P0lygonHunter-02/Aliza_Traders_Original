-- Aliza Traders - Initial Schema (D1 / SQLite)

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  details TEXT, -- JSON or bullet text
  price INTEGER NOT NULL, -- in PKR
  compare_at_price INTEGER,
  image_url TEXT,
  images TEXT, -- JSON array of URLs
  sizes TEXT DEFAULT 'S,M,L,XL',
  stock INTEGER DEFAULT 10,
  is_featured INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 0,
  is_sale INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sold_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  city TEXT,
  items TEXT NOT NULL, -- JSON
  subtotal INTEGER NOT NULL,
  shipping INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Seed categories
INSERT OR IGNORE INTO categories (id, name, slug, sort_order) VALUES
  (1, 'Party Wear', 'party-wear', 1),
  (2, 'Function Wear', 'function-wear', 2),
  (3, 'Mehndi Wear', 'mehndi-wear', 3),
  (4, 'Bridal Luxe', 'bridal-luxe', 4);

-- Seed products (dummy images - replace with R2 later)
INSERT OR IGNORE INTO products (id, category_id, name, slug, description, details, price, compare_at_price, image_url, is_featured, is_new, is_sale, stock, sold_count) VALUES
  (1, 1, 'Midnight Ember Suit', 'midnight-ember-suit',
   'Elegant embroidered 3-piece for evening gatherings. Soft fabric with rich maroon and gold detailing.',
   'Shirt Fabric: Premium Embroidered Lawn\nStyle: Straight Shirt\nDupatta: Chiffon with lace border\nTrouser: Plain matching\nShirt Length: 40 inches\nAvailable Sizes: S, M, L, XL',
   8500, 11000, 'https://picsum.photos/seed/aliza1/600/800', 1, 1, 1, 12, 8),
  (2, 1, 'Golden Hour Pret', 'golden-hour-pret',
   'Light festive pret with delicate sequin work. Perfect for day functions and dholki.',
   'Shirt Fabric: Soft Cotton Silk\nStyle: A-line\nDupatta: Net with border\nTrouser: Cigarette pants\nAvailable Sizes: S, M, L, XL',
   6500, 8200, 'https://picsum.photos/seed/aliza2/600/800', 1, 1, 1, 15, 14),
  (3, 2, 'Ivory Garden Ensemble', 'ivory-garden-ensemble',
   'Soft ivory base with floral embroidery. Ideal for day-time family functions.',
   'Shirt Fabric: Organza overlay on lawn\nStyle: Flared\nDupatta: Matching organza\nTrouser: Wide leg\nAvailable Sizes: S, M, L, XL',
   9200, NULL, 'https://picsum.photos/seed/aliza3/600/800', 1, 0, 0, 8, 3),
  (4, 3, 'Mehndi Bloom Set', 'mehndi-bloom-set',
   'Vibrant yellow-green tones with traditional gotta work for mehndi night.',
   'Shirt Fabric: Pure Cotton with gotta\nStyle: Traditional short shirt\nDupatta: Heavy border\nTrouser: Garara style option\nAvailable Sizes: S, M, L, XL',
   7800, 9500, 'https://picsum.photos/seed/aliza4/600/800', 1, 1, 1, 10, 11),
  (5, 4, 'Regal Maroon Lehenga', 'regal-maroon-lehenga',
   'Heavy bridal lehenga in deep maroon with zari and sequin work. Statement piece.',
   'Fabric: Net + Silk base\nStyle: Flared lehenga + blouse + dupatta\nWork: Zari, sequin, thread\nAvailable Sizes: Custom / S, M, L',
   45000, 52000, 'https://picsum.photos/seed/aliza5/600/800', 1, 1, 1, 3, 2),
  (6, 2, 'Soft Rose Formal', 'soft-rose-formal',
   'Muted rose formal with subtle embroidery. Comfortable all-day wear.',
   'Shirt Fabric: Khaddar blend\nStyle: Classic kurta\nDupatta: Light chiffon\nTrouser: Straight\nAvailable Sizes: S, M, L, XL',
   5500, 7000, 'https://picsum.photos/seed/aliza6/600/800', 0, 0, 1, 20, 6);

-- Site settings
INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('phone', '0300-0000000'),
  ('whatsapp', '923000000000'),
  ('email', 'hello@alizatraders.com'),
  ('instagram', 'https://instagram.com/alizatraders'),
  ('facebook', 'https://facebook.com/alizatraders'),
  ('tiktok', ''),
  ('address', 'Lahore, Pakistan'),
  ('shipping_note', 'Nationwide delivery · 3–5 working days'),
  ('stats_mode', 'manual'),
  ('stats_customers', '500+'),
  ('stats_designs', '50+'),
  ('stats_orders', '1200+'),
  ('stats_rating', '4.9'),
  ('hero_title', 'Celebrate in Style'),
  ('hero_subtitle', 'Party · Function · Mehndi · Bridal Luxe'),
  ('announcement', 'Free shipping on orders above Rs 10,000 · COD available nationwide');
