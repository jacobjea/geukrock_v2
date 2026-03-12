import { NextRequest, NextResponse } from "next/server";

import { clearMemberSession, sanitizeReturnTo } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(
    request.nextUrl.searchParams.get("returnTo") || "/",
  );

  await clearMemberSession();

  return NextResponse.redirect(new URL(returnTo, request.url));
}
