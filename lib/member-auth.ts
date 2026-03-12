import "server-only";

import { query } from "@/lib/db";
import type { CurrentMember, MemberUser } from "@/types/member";

type MemberUserRow = {
  id: string;
  kakaoUserId: string | number;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedInAt: Date;
};

type CurrentMemberRow = {
  id: string;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
};

export type KakaoMemberProfile = {
  id?: string | number | null;
  properties?: {
    nickname?: string | null;
    profile_image?: string | null;
  };
  kakao_account?: {
    email?: string | null;
    profile?: {
      nickname?: string | null;
      profile_image_url?: string | null;
    };
  };
};

export const MEMBER_SCHEMA_SQL = `
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

CREATE INDEX IF NOT EXISTS idx_member_users_kakao_user_id
  ON member_users (kakao_user_id);

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
`;

let memberSchemaReady: Promise<void> | null = null;

function toMemberUser(row: MemberUserRow): MemberUser {
  return {
    id: row.id,
    kakaoUserId: String(row.kakaoUserId),
    email: row.email,
    nickname: row.nickname,
    profileImageUrl: row.profileImageUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastSignedInAt: row.lastSignedInAt.toISOString(),
  };
}

function normalizeKakaoProfile(profile: KakaoMemberProfile) {
  if (!profile.id) {
    throw new Error("Kakao profile did not include a member id.");
  }

  const nickname =
    profile.kakao_account?.profile?.nickname ||
    profile.properties?.nickname ||
    `Kakao-${profile.id}`;
  const profileImageUrl =
    profile.kakao_account?.profile?.profile_image_url ||
    profile.properties?.profile_image ||
    null;

  return {
    kakaoUserId: String(profile.id),
    email: profile.kakao_account?.email ?? null,
    nickname,
    profileImageUrl,
  };
}

export function sanitizeReturnTo(value?: string | null, fallback = "/mypage") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function appendSearchParam(path: string, key: string, value: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function ensureMemberSchema() {
  if (!memberSchemaReady) {
    memberSchemaReady = query(MEMBER_SCHEMA_SQL)
      .then(() => undefined)
      .catch((error) => {
        memberSchemaReady = null;
        throw error;
      });
  }

  return memberSchemaReady;
}

export async function upsertMemberFromKakaoProfile(profile: KakaoMemberProfile) {
  await ensureMemberSchema();

  const normalized = normalizeKakaoProfile(profile);
  const result = await query<MemberUserRow>(
    `
      INSERT INTO member_users (
        kakao_user_id,
        email,
        nickname,
        profile_image_url,
        last_signed_in_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (kakao_user_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        nickname = EXCLUDED.nickname,
        profile_image_url = EXCLUDED.profile_image_url,
        last_signed_in_at = NOW(),
        updated_at = NOW()
      RETURNING
        id,
        kakao_user_id AS "kakaoUserId",
        email,
        nickname,
        profile_image_url AS "profileImageUrl",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        last_signed_in_at AS "lastSignedInAt"
    `,
    [
      normalized.kakaoUserId,
      normalized.email,
      normalized.nickname,
      normalized.profileImageUrl,
    ],
  );
  const row = result.rows[0];

  if (!row) {
    throw new Error("Failed to save Kakao member.");
  }

  return toMemberUser(row);
}

export async function getMemberById(id: string): Promise<CurrentMember | null> {
  await ensureMemberSchema();

  const result = await query<CurrentMemberRow>(
    `
      SELECT
        id,
        email,
        nickname,
        profile_image_url AS "profileImageUrl"
      FROM member_users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    profileImageUrl: row.profileImageUrl,
  };
}
