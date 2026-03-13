import { NextRequest, NextResponse } from "next/server";

import { sanitizeReturnTo } from "@/lib/member-auth";

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");

  // Legacy compatibility route. Auth.js itself handles the real callback at
  // /api/auth/callback/kakao.
  const redirectUrl = new URL("/api/auth/callback/kakao", request.url);

  request.nextUrl.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });

  if (!redirectUrl.searchParams.get("callbackUrl") && callbackUrl) {
    redirectUrl.searchParams.set(
      "callbackUrl",
      sanitizeReturnTo(callbackUrl),
    );
  }

  return NextResponse.redirect(redirectUrl);
}
