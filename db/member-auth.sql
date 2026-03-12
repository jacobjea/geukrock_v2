CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS member_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kakao_user_id BIGINT NOT NULL UNIQUE,
  email TEXT,
  nickname TEXT NOT NULL,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_signed_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES member_users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_users_kakao_user_id
  ON member_users (kakao_user_id);

CREATE INDEX IF NOT EXISTS idx_member_sessions_user_id
  ON member_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_member_sessions_expires_at
  ON member_sessions (expires_at);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS member_user_id UUID;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'orders_member_user_id_member_users_fkey'
    ) THEN
      ALTER TABLE orders
        ADD CONSTRAINT orders_member_user_id_member_users_fkey
        FOREIGN KEY (member_user_id) REFERENCES member_users(id) ON DELETE SET NULL;
    END IF;

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_orders_member_user_id ON orders (member_user_id, created_at DESC)';
  END IF;
END $$;
