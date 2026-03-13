import type {
  CartOrderLineItemInput,
  OrderLineItemInput,
} from "@/types/order";
import {
  isProductColor,
  isProductSize,
  type ProductColor,
  type ProductSize,
} from "@/types/product";

interface ParsedOrderLineItemsSuccess {
  ok: true;
  items: OrderLineItemInput[];
}

interface ParsedOrderLineItemsFailure {
  ok: false;
  message: string;
}

export type ParsedOrderLineItemsResult =
  | ParsedOrderLineItemsSuccess
  | ParsedOrderLineItemsFailure;

export function serializeOrderLineItems(
  items: Array<{
    selectedSize: ProductSize;
    selectedColor: ProductColor;
    quantity: number;
  }>,
) {
  return JSON.stringify(
    items.map(({ selectedSize, selectedColor, quantity }) => ({
      selectedSize,
      selectedColor,
      quantity,
    })),
  );
}

export function serializeCartOrderLineItems(items: CartOrderLineItemInput[]) {
  return JSON.stringify(
    items.map(({ productId, selectedSize, selectedColor, quantity }) => ({
      productId,
      selectedSize,
      selectedColor,
      quantity,
    })),
  );
}

export function parseOrderLineItems(value: string): ParsedOrderLineItemsResult {
  if (!value) {
    return {
      ok: false,
      message: "상품 옵션을 하나 이상 선택해 주세요.",
    };
  }

  try {
    const parsedValue: unknown = JSON.parse(value);

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return {
        ok: false,
        message: "상품 옵션을 하나 이상 선택해 주세요.",
      };
    }

    const items: OrderLineItemInput[] = [];

    for (const item of parsedValue) {
      if (!item || typeof item !== "object") {
        return {
          ok: false,
          message: "선택한 옵션 정보를 다시 확인해 주세요.",
        };
      }

      const candidate = item as Record<string, unknown>;
      const selectedSize =
        typeof candidate.selectedSize === "string" ? candidate.selectedSize : "";
      const selectedColor =
        typeof candidate.selectedColor === "string"
          ? candidate.selectedColor
          : "";
      const quantity =
        typeof candidate.quantity === "number"
          ? candidate.quantity
          : Number(candidate.quantity);

      if (!isProductSize(selectedSize) || !isProductColor(selectedColor)) {
        return {
          ok: false,
          message: "선택한 옵션 정보를 다시 확인해 주세요.",
        };
      }

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return {
          ok: false,
          message: "수량은 1개부터 20개까지 주문할 수 있습니다.",
        };
      }

      items.push({
        selectedSize,
        selectedColor,
        quantity,
      });
    }

    return {
      ok: true,
      items,
    };
  } catch {
    return {
      ok: false,
      message: "선택한 옵션 정보를 다시 확인해 주세요.",
    };
  }
}

export function parseCartOrderLineItems(value: string) {
  if (!value) {
    return {
      ok: false as const,
      message: "주문할 장바구니 상품이 없습니다.",
    };
  }

  const parsedItems = parseOrderLineItems(
    JSON.stringify(
      (() => {
        try {
          const raw = JSON.parse(value) as unknown;

          if (!Array.isArray(raw)) {
            return [];
          }

          return raw.map((item) => {
            if (!item || typeof item !== "object") {
              return item;
            }

            const candidate = item as Record<string, unknown>;
            return {
              productId:
                typeof candidate.productId === "string" ? candidate.productId : "",
              selectedSize: candidate.selectedSize,
              selectedColor: candidate.selectedColor,
              quantity: candidate.quantity,
            };
          });
        } catch {
          return [];
        }
      })(),
    ),
  );

  if (!parsedItems.ok) {
    return parsedItems;
  }

  try {
    const raw = JSON.parse(value) as unknown;

    if (!Array.isArray(raw) || raw.length !== parsedItems.items.length) {
      return {
        ok: false as const,
        message: "장바구니 주문 정보를 다시 확인해 주세요.",
      };
    }

    const items: CartOrderLineItemInput[] = parsedItems.items.map((item, index) => {
      const candidate = raw[index] as Record<string, unknown>;
      const productId =
        typeof candidate.productId === "string" ? candidate.productId.trim() : "";

      if (!productId) {
        throw new Error("invalid-product-id");
      }

      return {
        productId,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        quantity: item.quantity,
      };
    });

    return {
      ok: true as const,
      items,
    };
  } catch {
    return {
      ok: false as const,
      message: "장바구니 주문 정보를 다시 확인해 주세요.",
    };
  }
}

export function calculateOrderTotalPrice(
  items: Array<{
    quantity: number;
  }>,
  unitPrice: number,
) {
  return items.reduce((sum, item) => sum + unitPrice * item.quantity, 0);
}
