import Link from "next/link";

import {
  cancelOrderAction,
  updateOrderPaymentStatusAction,
} from "@/app/admin/orders/actions";
import { formatDateTime, formatPrice } from "@/lib/admin/format";
import {
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  type OrderListItem,
} from "@/types/order";
import { PRODUCT_COLOR_LABELS } from "@/types/product";

interface OrderListTableProps {
  items: OrderListItem[];
  returnTo: string;
}

function getPaymentBadgeClass(paymentStatus: OrderListItem["paymentStatus"]) {
  return paymentStatus === "confirmed"
    ? "border-[#b8d7a6] bg-[#f2f8ed] text-[#315c23]"
    : "border-[#efd7a8] bg-[#fff8ea] text-[#8a5a17]";
}

function getOrderBadgeClass(orderStatus: OrderListItem["orderStatus"]) {
  return orderStatus === "canceled"
    ? "border-[#efc4c4] bg-[#fff6f6] text-[#a13c3c]"
    : "border-[#cfd7e3] bg-[#f7f8fa] text-[#435167]";
}

export function OrderListTable({ items, returnTo }: OrderListTableProps) {
  if (!items.length) {
    return (
      <div className="border border-[#d9dde3] bg-white px-4 py-16 text-center text-sm text-[#6b7280]">
        조회된 주문이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#d9dde3] bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-[#f7f8fa] text-[#374151]">
          <tr>
            <th className="border-b border-[#d9dde3] px-4 py-3 text-left font-medium">
              주문일시
            </th>
            <th className="border-b border-[#d9dde3] px-4 py-3 text-left font-medium">
              주문 정보
            </th>
            <th className="border-b border-[#d9dde3] px-4 py-3 text-left font-medium">
              주문자 정보
            </th>
            <th className="border-b border-[#d9dde3] px-4 py-3 text-left font-medium">
              금액 / 옵션
            </th>
            <th className="border-b border-[#d9dde3] px-4 py-3 text-left font-medium">
              입금 상태
            </th>
            <th className="border-b border-[#d9dde3] px-4 py-3 text-left font-medium">
              주문 상태
            </th>
            <th className="border-b border-[#d9dde3] px-4 py-3 text-left font-medium">
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const nextPaymentStatus =
              item.paymentStatus === "confirmed"
                ? "awaiting_deposit"
                : "confirmed";
            const paymentAction = updateOrderPaymentStatusAction.bind(
              null,
              item.id,
              nextPaymentStatus,
              returnTo,
            );
            const cancelAction = cancelOrderAction.bind(null, item.id, returnTo);

            return (
              <tr key={item.id} className="align-top">
                <td className="border-b border-[#e5e7eb] px-4 py-4 text-[#4b5563]">
                  <div className="space-y-1">
                    <p className="font-medium text-[#111827]">
                      {formatDateTime(item.createdAt)}
                    </p>
                    <p className="text-xs text-[#6b7280]">{item.orderCode}</p>
                  </div>
                </td>
                <td className="border-b border-[#e5e7eb] px-4 py-4">
                  <div className="space-y-1">
                    {item.productId ? (
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-medium text-[#111827] hover:text-[#2f6fed]"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="font-medium text-[#111827]">{item.productName}</p>
                    )}
                    <p className="text-xs text-[#6b7280]">
                      옵션: {item.selectedSize} / {PRODUCT_COLOR_LABELS[item.selectedColor]}
                    </p>
                    <p className="text-xs text-[#6b7280]">수량: {item.quantity}개</p>
                  </div>
                </td>
                <td className="border-b border-[#e5e7eb] px-4 py-4">
                  <div className="space-y-1 text-[#4b5563]">
                    <p className="font-medium text-[#111827]">{item.customerName}</p>
                    <p>{item.customerPhone}</p>
                    <p>입금자명: {item.depositorName}</p>
                    {item.note ? (
                      <p className="text-xs leading-5 text-[#6b7280]">
                        요청사항: {item.note}
                      </p>
                    ) : null}
                  </div>
                </td>
                <td className="border-b border-[#e5e7eb] px-4 py-4">
                  <div className="space-y-1">
                    <p className="font-medium text-[#111827]">
                      {formatPrice(item.totalAmount)}
                    </p>
                    <p className="text-xs text-[#6b7280]">
                      단가 {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                </td>
                <td className="border-b border-[#e5e7eb] px-4 py-4">
                  <div className="space-y-2">
                    <span
                      className={[
                        "inline-flex rounded border px-2 py-1 text-xs font-medium",
                        getPaymentBadgeClass(item.paymentStatus),
                      ].join(" ")}
                    >
                      {ORDER_PAYMENT_STATUS_LABELS[item.paymentStatus]}
                    </span>
                    {item.paymentConfirmedAt ? (
                      <p className="text-xs text-[#6b7280]">
                        {formatDateTime(item.paymentConfirmedAt)}
                      </p>
                    ) : null}
                  </div>
                </td>
                <td className="border-b border-[#e5e7eb] px-4 py-4">
                  <div className="space-y-2">
                    <span
                      className={[
                        "inline-flex rounded border px-2 py-1 text-xs font-medium",
                        getOrderBadgeClass(item.orderStatus),
                      ].join(" ")}
                    >
                      {ORDER_STATUS_LABELS[item.orderStatus]}
                    </span>
                    {item.canceledAt ? (
                      <p className="text-xs text-[#6b7280]">
                        {formatDateTime(item.canceledAt)}
                      </p>
                    ) : null}
                  </div>
                </td>
                <td className="border-b border-[#e5e7eb] px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <form action={paymentAction}>
                      <button
                        type="submit"
                        disabled={item.orderStatus === "canceled"}
                        className="inline-flex w-full items-center justify-center rounded border border-[#d9dde3] bg-white px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:text-[#9ca3af]"
                      >
                        {item.paymentStatus === "confirmed"
                          ? "입금 확인 해제"
                          : "입금 확인"}
                      </button>
                    </form>
                    <form action={cancelAction}>
                      <button
                        type="submit"
                        disabled={item.orderStatus === "canceled"}
                        className="inline-flex w-full items-center justify-center rounded border border-[#e5c5c5] bg-[#fff6f6] px-3 py-2 text-xs font-medium text-[#a13c3c] hover:bg-[#ffeaea] disabled:cursor-not-allowed disabled:border-[#e5e7eb] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af]"
                      >
                        주문 취소
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
