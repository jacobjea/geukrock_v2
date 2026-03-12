import { NextRequest, NextResponse } from "next/server";

import { signOut } from "@/auth";
import { sanitizeReturnTo } from "@/lib/member-auth";

export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"), "/");

  await signOut({
    redirectTo: returnTo,
  });

  return NextResponse.redirect(new URL(returnTo, request.url));
}
