"use server";

import { redirect } from "next/navigation";

import { addItemToGuestCartFromRequest } from "@/lib/cart";

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

export async function addToCartAction(formData: FormData) {
  const productId = getRequiredString(formData.get("productId"), "productId");
  const selectedSize = getRequiredString(formData.get("size"), "size");
  const selectedColor = getRequiredString(formData.get("color"), "color");
  const quantity = parseQuantity(formData.get("quantity"));

  await addItemToGuestCartFromRequest({
    productId,
    selectedSize,
    selectedColor,
    quantity,
  });

  redirect("/cart?status=added");
}
