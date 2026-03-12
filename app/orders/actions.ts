"use server";

import { revalidatePath } from "next/cache";

import { createOrderRecord } from "@/lib/admin/orders";
import { getCurrentMember } from "@/lib/auth";
import { initialOrderFormState, type OrderFormState } from "@/types/order";
import {
  isProductColor,
  isProductSize,
  type ProductColor,
  type ProductSize,
} from "@/types/product";

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
  const quantityValue = getStringValue(formData.get("quantity"));
  const selectedSize = getStringValue(formData.get("size"));
  const selectedColor = getStringValue(formData.get("color"));
  const phoneDigits = normalizePhone(customerPhone);
  const quantity = Number(quantityValue);
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

  if (!quantityValue) {
    fieldErrors.quantity = "수량을 확인해 주세요.";
  } else if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    fieldErrors.quantity = "수량은 1개부터 20개까지 주문할 수 있습니다.";
  }

  if (!isProductSize(selectedSize)) {
    fieldErrors.size = "사이즈를 다시 선택해 주세요.";
  }

  if (!isProductColor(selectedColor)) {
    fieldErrors.color = "색상을 다시 선택해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createErrorState(fieldErrors);
  }

  try {
    const currentMember = await getCurrentMember();
    const parsedSize = selectedSize as ProductSize;
    const parsedColor = selectedColor as ProductColor;
    const createdOrder = await createOrderRecord({
      productId,
      memberUserId: currentMember?.id ?? null,
      customerName,
      customerPhone,
      depositorName,
      note,
      quantity,
      selectedSize: parsedSize,
      selectedColor: parsedColor,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/mypage");

    return {
      status: "success",
      message: "주문이 완료되었습니다. 아래 계좌로 입금해 주세요.",
      fieldErrors: {},
      orderCode: createdOrder.orderCode,
      totalAmount: createdOrder.totalAmount,
      bankInfo: createdOrder.bankInfo,
    };
  } catch (error) {
    return createErrorState(
      {},
      error instanceof Error ? error.message : "주문 접수 중 오류가 발생했습니다.",
    );
  }
}
