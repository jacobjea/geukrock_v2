import "server-only";

import { cookies } from "next/headers";

import { parseOrderLineItems } from "@/lib/order-line-items";
import type { CartCheckoutSnapshot, GuestCartSnapshot } from "@/types/cart";
import type { OrderLineItemInput } from "@/types/order";

const ORDER_CHECKOUT_COOKIE_NAME = "orderCheckout";
const ORDER_CHECKOUT_TTL_SECONDS = 30 * 60;

export type OrderCheckoutSession =
  | {
      mode: "cart";
      cart: CartCheckoutSnapshot;
    }
  | {
      mode: "direct";
      productId: string;
      lineItems: OrderLineItemInput[];
    };

function getOrderCheckoutCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ORDER_CHECKOUT_TTL_SECONDS,
  };
}

export async function setCartOrderCheckoutSession(cart: GuestCartSnapshot | null) {
  if (!cart?.items.length) {
    throw new Error("주문할 장바구니 상품이 없습니다.");
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ORDER_CHECKOUT_COOKIE_NAME,
    JSON.stringify({
      mode: "cart",
      cart: {
        items: cart.items,
        totalItems: cart.totalItems,
        subtotal: cart.subtotal,
      },
    } satisfies OrderCheckoutSession),
    getOrderCheckoutCookieOptions(),
  );
}

export async function setDirectOrderCheckoutSession(input: {
  productId: string;
  lineItemsValue: string;
}) {
  const productId = input.productId.trim();

  if (!productId) {
    throw new Error("주문 상품 정보를 확인할 수 없습니다.");
  }

  const parsedLineItems = parseOrderLineItems(input.lineItemsValue);

  if (!parsedLineItems.ok) {
    throw new Error(parsedLineItems.message);
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ORDER_CHECKOUT_COOKIE_NAME,
    JSON.stringify({
      mode: "direct",
      productId,
      lineItems: parsedLineItems.items,
    } satisfies OrderCheckoutSession),
    getOrderCheckoutCookieOptions(),
  );
}

export async function getOrderCheckoutSessionFromRequest(): Promise<OrderCheckoutSession | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(ORDER_CHECKOUT_COOKIE_NAME)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    const candidate = parsedValue as Record<string, unknown>;

    if (candidate.mode === "cart") {
      const cart =
        candidate.cart && typeof candidate.cart === "object"
          ? (candidate.cart as CartCheckoutSnapshot)
          : null;

      if (!cart || !Array.isArray(cart.items)) {
        return null;
      }

      return {
        mode: "cart",
        cart,
      };
    }

    if (candidate.mode !== "direct") {
      return null;
    }

    const productId =
      typeof candidate.productId === "string" ? candidate.productId.trim() : "";
    const lineItemsValue = JSON.stringify(candidate.lineItems);
    const parsedLineItems = parseOrderLineItems(lineItemsValue);

    if (!productId || !parsedLineItems.ok) {
      return null;
    }

    return {
      mode: "direct",
      productId,
      lineItems: parsedLineItems.items,
    };
  } catch {
    return null;
  }
}

export async function clearOrderCheckoutSessionFromRequest() {
  const cookieStore = await cookies();
  cookieStore.delete(ORDER_CHECKOUT_COOKIE_NAME);
}
