CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  member_user_id UUID,
  product_name TEXT NOT NULL,
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selected_size TEXT NOT NULL,
  selected_color TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  depositor_name TEXT NOT NULL,
  note TEXT,
  payment_status TEXT NOT NULL DEFAULT 'awaiting_deposit'
    CHECK (payment_status IN ('awaiting_deposit', 'confirmed')),
  order_status TEXT NOT NULL DEFAULT 'received'
    CHECK (order_status IN ('received', 'canceled')),
  payment_confirmed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS member_user_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'member_users'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_member_user_id_member_users_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_member_user_id_member_users_fkey
      FOREIGN KEY (member_user_id) REFERENCES member_users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON orders (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_order_status
  ON orders (order_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_member_user_id
  ON orders (member_user_id, created_at DESC);
