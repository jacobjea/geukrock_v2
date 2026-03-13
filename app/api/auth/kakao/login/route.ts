import { NextRequest, NextResponse } from "next/server";

import { signIn } from "@/auth";
import { appendSearchParam, sanitizeReturnTo } from "@/lib/member-auth";

export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"), "/");

  await signIn("kakao", {
    redirectTo: appendSearchParam(returnTo, "login", "success"),
  });

  return NextResponse.redirect(new URL(returnTo, request.url));
}
