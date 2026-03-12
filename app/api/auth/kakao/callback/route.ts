import { NextRequest, NextResponse } from "next/server";

import {
  consumeKakaoOauthStateCookie,
  createMemberSession,
  upsertMemberFromKakaoCode,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const fallbackUrl = new URL("/mypage", request.url);

  if (error) {
    fallbackUrl.searchParams.set("login", "error");
    return NextResponse.redirect(fallbackUrl);
  }

  if (!code || !state) {
    fallbackUrl.searchParams.set("login", "invalid");
    return NextResponse.redirect(fallbackUrl);
  }

  const savedState = await consumeKakaoOauthStateCookie();

  if (!savedState || savedState.state !== state) {
    fallbackUrl.searchParams.set("login", "invalid");
    return NextResponse.redirect(fallbackUrl);
  }

  try {
    const member = await upsertMemberFromKakaoCode(code);
    await createMemberSession(member.id);
    const redirectUrl = new URL(savedState.returnTo, request.url);
    redirectUrl.searchParams.set("login", "success");
    return NextResponse.redirect(redirectUrl);
  } catch {
    fallbackUrl.searchParams.set("login", "error");
    return NextResponse.redirect(fallbackUrl);
  }
}
