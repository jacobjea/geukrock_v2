import { updateGuestCartItemQuantityFromRequest } from "@/lib/cart";

interface UpdateCartItemRequest {
  cartItemId?: string;
  quantity?: number;
}

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as UpdateCartItemRequest;

    if (!body.cartItemId || typeof body.cartItemId !== "string") {
      return Response.json(
        { message: "Missing cartItemId." },
        { status: 400 },
      );
    }

    if (typeof body.quantity !== "number" || !Number.isFinite(body.quantity)) {
      return Response.json({ message: "Invalid quantity." }, { status: 400 });
    }

    const result = await updateGuestCartItemQuantityFromRequest({
      cartItemId: body.cartItemId,
      quantity: body.quantity,
    });

    return Response.json(result);
  } catch {
    return Response.json(
      { message: "Failed to update cart item." },
      { status: 500 },
    );
  }
}
