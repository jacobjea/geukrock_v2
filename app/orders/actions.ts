"use server";

import { revalidatePath } from "next/cache";

import {
  createCartOrderRecords,
  createOrderRecords,
} from "@/lib/admin/orders";
import { getCurrentMember } from "@/lib/auth";
import { clearGuestCartItemsFromRequest } from "@/lib/cart";
import {
  parseCartOrderLineItems,
  parseOrderLineItems,
} from "@/lib/order-line-items";
import {
  initialOrderFormState,
  type OrderFormState,
} from "@/types/order";

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalStringValue(value: FormDataEntryValue | null) {
  const normalized = getStringValue(value);
  return normalized ? normalized : null;
}

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

function createErrorState(
  fieldErrors: OrderFormState["fieldErrors"],
  message = "입력값을 다시 확인해 주세요.",
): OrderFormState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

export async function createOrderAction(
  _previousState: OrderFormState = initialOrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  void _previousState;

  const productId = getStringValue(formData.get("productId"));
  const customerName = getStringValue(formData.get("customerName"));
  const customerPhone = getStringValue(formData.get("customerPhone"));
  const depositorName = getStringValue(formData.get("depositorName"));
  const note = getOptionalStringValue(formData.get("note"));
  const lineItemsValue = getStringValue(formData.get("lineItems"));
  const phoneDigits = normalizePhone(customerPhone);
  const fieldErrors: OrderFormState["fieldErrors"] = {};

  if (!productId) {
    return createErrorState({}, "주문 상품 정보를 확인할 수 없습니다.");
  }

  if (!customerName) {
    fieldErrors.customerName = "주문자명을 입력해 주세요.";
  } else if (customerName.length > 40) {
    fieldErrors.customerName = "주문자명은 40자 이하로 입력해 주세요.";
  }

  if (!customerPhone) {
    fieldErrors.customerPhone = "연락처를 입력해 주세요.";
  } else if (phoneDigits.length < 9 || phoneDigits.length > 12) {
    fieldErrors.customerPhone = "연락처 형식을 다시 확인해 주세요.";
  }

  if (!depositorName) {
    fieldErrors.depositorName = "입금자명을 입력해 주세요.";
  } else if (depositorName.length > 40) {
    fieldErrors.depositorName = "입금자명은 40자 이하로 입력해 주세요.";
  }

  const parsedLineItems = parseOrderLineItems(lineItemsValue);
  const lineItems = parsedLineItems.ok ? parsedLineItems.items : [];

  if (!parsedLineItems.ok) {
    fieldErrors.lineItems = parsedLineItems.message;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createErrorState(fieldErrors);
  }

  try {
    const currentMember = await getCurrentMember();

    if (!currentMember) {
      return createErrorState({}, "로그인 후 주문해 주세요.");
    }

    const createdOrders = await createOrderRecords({
      productId,
      memberUserId: currentMember.id,
      customerName,
      customerPhone,
      depositorName,
      note,
      lineItems,
    });
    const totalAmount = createdOrders.reduce(
      (sum, createdOrder) => sum + createdOrder.totalAmount,
      0,
    );

    revalidatePath("/admin/orders");
    revalidatePath("/mypage");

    return {
      status: "success",
      message: "주문이 완료되었습니다. 아래 계좌로 입금해 주세요.",
      fieldErrors: {},
      orderCode: createdOrders[0]?.orderCode,
      orderCodes: createdOrders.map((createdOrder) => createdOrder.orderCode),
      totalAmount,
      bankInfo: createdOrders[0]?.bankInfo,
    };
  } catch (error) {
    return createErrorState(
      {},
      error instanceof Error ? error.message : "주문 접수 중 오류가 발생했습니다.",
    );
  }
}

export async function createCartOrderAction(
  _previousState: OrderFormState = initialOrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  void _previousState;

  const customerName = getStringValue(formData.get("customerName"));
  const customerPhone = getStringValue(formData.get("customerPhone"));
  const depositorName = getStringValue(formData.get("depositorName"));
  const note = getOptionalStringValue(formData.get("note"));
  const cartLineItemsValue = getStringValue(formData.get("cartLineItems"));
  const phoneDigits = normalizePhone(customerPhone);
  const fieldErrors: OrderFormState["fieldErrors"] = {};

  if (!customerName) {
    fieldErrors.customerName = "주문자명을 입력해 주세요.";
  } else if (customerName.length > 40) {
    fieldErrors.customerName = "주문자명은 40자 이하로 입력해 주세요.";
  }

  if (!customerPhone) {
    fieldErrors.customerPhone = "연락처를 입력해 주세요.";
  } else if (phoneDigits.length < 9 || phoneDigits.length > 12) {
    fieldErrors.customerPhone = "연락처 형식을 다시 확인해 주세요.";
  }

  if (!depositorName) {
    fieldErrors.depositorName = "입금자명을 입력해 주세요.";
  } else if (depositorName.length > 40) {
    fieldErrors.depositorName = "입금자명은 40자 이하로 입력해 주세요.";
  }

  const parsedCartLineItems = parseCartOrderLineItems(cartLineItemsValue);
  const items = parsedCartLineItems.ok ? parsedCartLineItems.items : [];

  if (!parsedCartLineItems.ok) {
    fieldErrors.lineItems = parsedCartLineItems.message;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createErrorState(fieldErrors);
  }

  try {
    const currentMember = await getCurrentMember();

    if (!currentMember) {
      return createErrorState({}, "로그인 후 주문해 주세요.");
    }

    const createdOrders = await createCartOrderRecords({
      memberUserId: currentMember.id,
      customerName,
      customerPhone,
      depositorName,
      note,
      items,
    });
    const totalAmount = createdOrders.reduce(
      (sum, createdOrder) => sum + createdOrder.totalAmount,
      0,
    );

    await clearGuestCartItemsFromRequest();

    revalidatePath("/admin/orders");
    revalidatePath("/mypage");
    revalidatePath("/cart");

    return {
      status: "success",
      message: "주문이 완료되었습니다. 아래 계좌로 입금해 주세요.",
      fieldErrors: {},
      orderCode: createdOrders[0]?.orderCode,
      orderCodes: createdOrders.map((createdOrder) => createdOrder.orderCode),
      totalAmount,
      bankInfo: createdOrders[0]?.bankInfo,
    };
  } catch (error) {
    return createErrorState(
      {},
      error instanceof Error ? error.message : "주문 접수 중 오류가 발생했습니다.",
    );
  }
}
