import { cleanupExpiredGuestCarts } from "@/lib/cart";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const deletedCount = await cleanupExpiredGuestCarts();

  return Response.json({
    ok: true,
    deletedCount,
    executedAt: new Date().toISOString(),
  });
}
