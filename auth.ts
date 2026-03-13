import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";

import {
  upsertMemberFromKakaoProfile,
  type KakaoMemberProfile,
} from "@/lib/member-auth";

function getRequiredEnv(name: string, ...fallbackNames: string[]) {
  const candidates = [name, ...fallbackNames];

  for (const candidate of candidates) {
    const value = process.env[candidate]?.trim();

    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable: ${candidates.join(" or ")}.`);
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  secret: getRequiredEnv("AUTH_SECRET", "NEXTAUTH_SECRET", "KAKAO_CLIENT_SECRET"),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    error: "/mypage",
  },
  providers: [
    Kakao({
      clientId: getRequiredEnv("AUTH_KAKAO_ID", "KAKAO_REST_API_KEY"),
      clientSecret: getRequiredEnv("AUTH_KAKAO_SECRET", "KAKAO_CLIENT_SECRET"),
      authorization: {
        url: "https://kauth.kakao.com/oauth/authorize",
        params: {
          scope: "profile_nickname profile_image",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "kakao" && profile) {
        const member = await upsertMemberFromKakaoProfile(
          profile as unknown as KakaoMemberProfile,
        );

        token.memberId = member.id;
        token.name = member.nickname;
        token.email = member.email;
        token.picture = member.profileImageUrl;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.memberId === "string") {
        session.user.id = token.memberId;
        session.user.name = token.name ?? session.user.name;

        if (typeof token.email === "string") {
          session.user.email = token.email;
        }

        if (typeof token.picture === "string") {
          session.user.image = token.picture;
        }
      }

      return session;
    },
  },
}));
