// Matches the ACTUAL products table schema in Supabase:
// id, sku, name, price, stock, ai_label, category, image_url, created_at
export interface Product {
  id?: string;
  sku: string;
  name: string;
  price: number;
  stock?: number;
  ai_label?: string | null;
  category?: string | null;
  image_url?: string | null;
  created_at?: string;
}
