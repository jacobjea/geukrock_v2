CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  size_options TEXT[] NOT NULL DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL']::text[],
  color_options TEXT[] NOT NULL DEFAULT ARRAY['BLACK']::text[],
  thumbnail_url TEXT,
  thumbnail_pathname TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS size_options TEXT[] DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL']::text[];

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_options TEXT[] DEFAULT ARRAY['BLACK']::text[];

UPDATE products
SET size_options = ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL']::text[]
WHERE size_options IS NULL
   OR COALESCE(array_length(size_options, 1), 0) = 0;

UPDATE products
SET color_options = ARRAY['BLACK']::text[]
WHERE color_options IS NULL
   OR COALESCE(array_length(color_options, 1), 0) = 0;

ALTER TABLE products
  ALTER COLUMN size_options SET NOT NULL;

ALTER TABLE products
  ALTER COLUMN color_options SET NOT NULL;

ALTER TABLE products
  ALTER COLUMN size_options SET DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL']::text[];

ALTER TABLE products
  ALTER COLUMN color_options SET DEFAULT ARRAY['BLACK']::text[];

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_pathname TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_sort_order
  ON products (sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images (product_id, sort_order);
