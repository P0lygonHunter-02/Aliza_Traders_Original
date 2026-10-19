export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  SITE_NAME: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
  // IMAGES?: R2Bucket; // enable later
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: number;
};

export type Product = {
  id: number;
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  details: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  images: string | null;
  sizes: string | null;
  stock: number;
  is_featured: number;
  is_new: number;
  is_sale: number;
  is_active: number;
  sold_count: number;
  category_name?: string;
};

export type SiteSettings = Record<string, string>;
