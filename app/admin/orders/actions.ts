"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentAdmin } from "@/lib/auth";
import {
  buildAdminOrdersPageHref,
  cancelOrderRecord,
  updateOrderPaymentStatus,
} from "@/lib/admin/orders";
import type { OrderPaymentStatus } from "@/types/order";

function redirectWithStatus(returnTo: string, status: string) {
  const target = new URL(returnTo, "http://localhost");
  target.searchParams.set("status", status);
  redirect(`${target.pathname}${target.search}`);
}

export async function updateOrderPaymentStatusAction(
  orderId: string,
  nextStatus: OrderPaymentStatus,
  returnTo?: string,
) {
  await requireCurrentAdmin();
  const redirectTo = returnTo || buildAdminOrdersPageHref();

  try {
    const updated = await updateOrderPaymentStatus(orderId, nextStatus);

    if (!updated) {
      redirectWithStatus(redirectTo, "order-action-error");
    }

    revalidatePath("/admin/orders");
    redirectWithStatus(
      redirectTo,
      nextStatus === "confirmed" ? "deposit-confirmed" : "deposit-reset",
    );
  } catch {
    redirectWithStatus(redirectTo, "order-action-error");
  }
}

export async function cancelOrderAction(orderId: string, returnTo?: string) {
  await requireCurrentAdmin();
  const redirectTo = returnTo || buildAdminOrdersPageHref();

  try {
    const canceled = await cancelOrderRecord(orderId);

    if (!canceled) {
      redirectWithStatus(redirectTo, "order-action-error");
    }

    revalidatePath("/admin/orders");
    redirectWithStatus(redirectTo, "order-canceled");
  } catch {
    redirectWithStatus(redirectTo, "order-action-error");
  }
}
