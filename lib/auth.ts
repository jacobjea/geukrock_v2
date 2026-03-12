import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import { query } from "@/lib/db";
import type { CurrentMember, MemberUser } from "@/types/member";

export const MEMBER_SESSION_COOKIE_NAME = "memberSession";
export const KAKAO_OAUTH_STATE_COOKIE_NAME = "kakaoOauthState";
export const MEMBER_SESSION_TTL_DAYS = 30;
export const MEMBER_SESSION_TTL_SECONDS =
  MEMBER_SESSION_TTL_DAYS * 24 * 60 * 60;
export const OAUTH_STATE_TTL_SECONDS = 10 * 60;

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
`;

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

type KakaoTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type KakaoUserResponse = {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
};

interface KakaoProfile {
  kakaoUserId: string;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
}

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

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function getKakaoConfig() {
  const clientId = process.env.KAKAO_REST_API_KEY?.trim();
  const clientSecret = process.env.KAKAO_CLIENT_SECRET?.trim();
  const redirectUri = process.env.KAKAO_REDIRECT_URI?.trim();

  if (!clientId || !redirectUri) {
    throw new Error(
      "KAKAO_REST_API_KEY and KAKAO_REDIRECT_URI must be configured.",
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function sanitizeReturnTo(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/mypage";
  }

  return value;
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

export function buildKakaoAuthorizeUrl(state: string) {
  const { clientId, redirectUri } = getKakaoConfig();
  const searchParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "account_email,profile_nickname,profile_image",
  });

  return `https://kauth.kakao.com/oauth/authorize?${searchParams.toString()}`;
}

export async function setKakaoOauthStateCookie(
  state: string,
  returnTo: string,
) {
  const cookieStore = await cookies();
  cookieStore.set(
    KAKAO_OAUTH_STATE_COOKIE_NAME,
    JSON.stringify({ state, returnTo }),
    getCookieOptions(OAUTH_STATE_TTL_SECONDS),
  );
}

export async function consumeKakaoOauthStateCookie() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(KAKAO_OAUTH_STATE_COOKIE_NAME)?.value;
  cookieStore.delete(KAKAO_OAUTH_STATE_COOKIE_NAME);

  if (!cookieValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(cookieValue) as {
      state?: string;
      returnTo?: string;
    };

    if (!parsed.state) {
      return null;
    }

    return {
      state: parsed.state,
      returnTo: sanitizeReturnTo(parsed.returnTo),
    };
  } catch {
    return null;
  }
}

async function exchangeCodeForToken(code: string) {
  const { clientId, clientSecret, redirectUri } = getKakaoConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
    cache: "no-store",
  });
  const data = (await response.json()) as KakaoTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Failed to exchange Kakao OAuth token.",
    );
  }

  return data.access_token;
}

async function fetchKakaoProfile(accessToken: string): Promise<KakaoProfile> {
  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    cache: "no-store",
  });
  const data = (await response.json()) as KakaoUserResponse;

  if (!response.ok || !data.id) {
    throw new Error("Failed to fetch Kakao member profile.");
  }

  const nickname =
    data.kakao_account?.profile?.nickname ||
    data.properties?.nickname ||
    `Kakao-${data.id}`;
  const profileImageUrl =
    data.kakao_account?.profile?.profile_image_url ||
    data.properties?.profile_image ||
    null;

  return {
    kakaoUserId: String(data.id),
    email: data.kakao_account?.email ?? null,
    nickname,
    profileImageUrl,
  };
}

export async function upsertMemberFromKakaoCode(code: string) {
  await ensureMemberSchema();

  const accessToken = await exchangeCodeForToken(code);
  const profile = await fetchKakaoProfile(accessToken);
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
      profile.kakaoUserId,
      profile.email,
      profile.nickname,
      profile.profileImageUrl,
    ],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Failed to save Kakao member.");
  }

  return toMemberUser(row);
}

export async function createMemberSession(userId: string) {
  await ensureMemberSchema();

  const sessionToken = `${randomUUID()}${randomUUID()}`;
  const sessionTokenHash = hashToken(sessionToken);
  await query(
    `
      INSERT INTO member_sessions (
        user_id,
        session_token_hash,
        expires_at
      )
      VALUES ($1, $2, NOW() + INTERVAL '30 days')
    `,
    [userId, sessionTokenHash],
  );

  const cookieStore = await cookies();
  cookieStore.set(
    MEMBER_SESSION_COOKIE_NAME,
    sessionToken,
    getCookieOptions(MEMBER_SESSION_TTL_SECONDS),
  );
}

export async function clearMemberSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(MEMBER_SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await ensureMemberSchema();
    await query(`DELETE FROM member_sessions WHERE session_token_hash = $1`, [
      hashToken(sessionToken),
    ]);
  }

  cookieStore.delete(MEMBER_SESSION_COOKIE_NAME);
}

export async function getCurrentMember(): Promise<CurrentMember | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(MEMBER_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  await ensureMemberSchema();

  const result = await query<CurrentMemberRow>(
    `
      SELECT
        u.id,
        u.email,
        u.nickname,
        u.profile_image_url AS "profileImageUrl"
      FROM member_sessions AS s
      INNER JOIN member_users AS u
        ON u.id = s.user_id
      WHERE s.session_token_hash = $1
        AND s.expires_at > NOW()
      LIMIT 1
    `,
    [hashToken(sessionToken)],
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
