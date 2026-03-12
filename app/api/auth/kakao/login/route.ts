import { NextRequest, NextResponse } from "next/server";

import {
  buildKakaoAuthorizeUrl,
  sanitizeReturnTo,
  setKakaoOauthStateCookie,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(
    request.nextUrl.searchParams.get("returnTo"),
  );
  const state = crypto.randomUUID();

  await setKakaoOauthStateCookie(state, returnTo);

  return NextResponse.redirect(buildKakaoAuthorizeUrl(state));
}
