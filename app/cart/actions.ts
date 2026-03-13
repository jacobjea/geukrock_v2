"use server";

import { redirect } from "next/navigation";

import { getCurrentMember } from "@/lib/auth";
import { addItemsToGuestCartFromRequest } from "@/lib/cart";
import type { GuestCartSelectionInput } from "@/types/cart";
import { isProductColor, isProductSize } from "@/types/product";

function getRequiredString(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${fieldName}.`);
  }

  return value;
}

function parseQuantity(value: FormDataEntryValue | null, fallback = 1) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function parseLineItems(value: FormDataEntryValue | null): GuestCartSelectionInput[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const items: GuestCartSelectionInput[] = [];

    for (const item of parsedValue) {
      if (!item || typeof item !== "object") {
        return [];
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

      if (
        !isProductSize(selectedSize) ||
        !isProductColor(selectedColor) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return [];
      }

      items.push({
        selectedSize,
        selectedColor,
        quantity,
      });
    }

    return items;
  } catch {
    return [];
  }
}

function getRequiredSelectedSize(value: FormDataEntryValue | null) {
  const selectedSize = getRequiredString(value, "size");

  if (!isProductSize(selectedSize)) {
    throw new Error("Missing size.");
  }

  return selectedSize;
}

function getRequiredSelectedColor(value: FormDataEntryValue | null) {
  const selectedColor = getRequiredString(value, "color");

  if (!isProductColor(selectedColor)) {
    throw new Error("Missing color.");
  }

  return selectedColor;
}

export async function addToCartAction(formData: FormData) {
  const currentMember = await getCurrentMember();

  if (!currentMember) {
    redirect("/cart?login=required");
  }

  const productId = getRequiredString(formData.get("productId"), "productId");
  const lineItems = parseLineItems(formData.get("lineItems"));
  const fallbackSize = formData.get("size");
  const fallbackColor = formData.get("color");
  const fallbackQuantity = parseQuantity(formData.get("quantity"));
  const items =
    lineItems.length > 0
      ? lineItems
      : [
          {
            selectedSize: getRequiredSelectedSize(fallbackSize),
            selectedColor: getRequiredSelectedColor(fallbackColor),
            quantity: fallbackQuantity,
          },
        ];

  await addItemsToGuestCartFromRequest({
    productId,
    items,
  });

  redirect("/cart?status=added");
}
