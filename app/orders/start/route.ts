import { NextResponse } from "next/server";

import { getCurrentMember } from "@/lib/auth";
import { getGuestCartSnapshotFromRequest } from "@/lib/cart";
import {
  setCartOrderCheckoutSession,
  setDirectOrderCheckoutSession,
} from "@/lib/order-checkout-session";

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const checkoutMode = getStringValue(formData.get("checkoutMode"));
  const productId = getStringValue(formData.get("productId"));
  const lineItemsValue = getStringValue(formData.get("lineItems"));
  const currentMember = await getCurrentMember();

  if (!currentMember) {
    const fallbackPath =
      checkoutMode === "direct" && productId ? `/products/${productId}` : "/cart?login=required";

    return NextResponse.redirect(new URL(fallbackPath, request.url), {
      status: 303,
    });
  }

  try {
    if (checkoutMode === "direct") {
      await setDirectOrderCheckoutSession({
        productId,
        lineItemsValue,
      });
    } else {
      const cart = await getGuestCartSnapshotFromRequest();
      await setCartOrderCheckoutSession(cart);
    }

    return NextResponse.redirect(new URL("/orders", request.url), {
      status: 303,
    });
  } catch {
    const fallbackPath =
      checkoutMode === "direct" && productId ? `/products/${productId}` : "/cart";

    return NextResponse.redirect(new URL(fallbackPath, request.url), {
      status: 303,
    });
  }
}
