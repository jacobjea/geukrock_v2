CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS guest_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guest_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES guest_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  selected_size TEXT NOT NULL DEFAULT 'M',
  selected_color TEXT NOT NULL DEFAULT 'BLACK',
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guest_cart_items
  ADD COLUMN IF NOT EXISTS selected_size TEXT;

ALTER TABLE guest_cart_items
  ADD COLUMN IF NOT EXISTS selected_color TEXT;

UPDATE guest_cart_items
SET selected_size = 'M'
WHERE selected_size IS NULL;

UPDATE guest_cart_items
SET selected_color = 'BLACK'
WHERE selected_color IS NULL;

ALTER TABLE guest_cart_items
  ALTER COLUMN selected_size SET NOT NULL;

ALTER TABLE guest_cart_items
  ALTER COLUMN selected_color SET NOT NULL;

ALTER TABLE guest_cart_items
  ALTER COLUMN selected_size SET DEFAULT 'M';

ALTER TABLE guest_cart_items
  ALTER COLUMN selected_color SET DEFAULT 'BLACK';

DROP INDEX IF EXISTS idx_guest_cart_items_cart_product;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_cart_items_cart_product_option
  ON guest_cart_items (cart_id, product_id, selected_size, selected_color);

CREATE INDEX IF NOT EXISTS idx_guest_carts_expires_at
  ON guest_carts (expires_at);

CREATE INDEX IF NOT EXISTS idx_guest_carts_last_accessed_at
  ON guest_carts (last_accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_cart_items_cart_id
  ON guest_cart_items (cart_id);
