"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useActionState, useState } from "react";

import { createCartOrderAction } from "@/app/orders/actions";
import { TransferPaymentPanel } from "@/components/order/TransferPaymentPanel";
import { formatPrice } from "@/lib/admin/format";
import { serializeCartOrderLineItems } from "@/lib/order-line-items";
import type { CartCheckoutSnapshot } from "@/types/cart";
import {
  initialOrderFormState,
  type CartOrderLineItemInput,
} from "@/types/order";
import {
  PRODUCT_COLOR_LABELS,
} from "@/types/product";

interface TransferRecipientInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface CartOrderCheckoutPageProps {
  cart: CartCheckoutSnapshot;
  currentMemberName?: string | null;
  isSignedIn: boolean;
  transferRecipientInfo?: TransferRecipientInfo | null;
}

function buildCartOrderItems(cart: CartCheckoutSnapshot): CartOrderLineItemInput[] {
  return cart.items.map((item) => ({
    productId: item.productId,
    selectedSize: item.selectedSize,
    selectedColor: item.selectedColor,
    quantity: item.quantity,
  }));
}

export function CartOrderCheckoutPage({
  cart,
  currentMemberName,
  isSignedIn,
  transferRecipientInfo,
}: CartOrderCheckoutPageProps) {
  const [customerName, setCustomerName] = useState(currentMemberName ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [depositorName, setDepositorName] = useState(currentMemberName ?? "");
  const [note, setNote] = useState("");
  const [formState, formAction, isPending] = useActionState(
    createCartOrderAction,
    initialOrderFormState,
  );
  const cartOrderItems = buildCartOrderItems(cart);
  const serializedCartLineItems = serializeCartOrderLineItems(cartOrderItems);
  const submittedOrderCodes =
    formState.orderCodes && formState.orderCodes.length > 0
      ? formState.orderCodes
      : formState.orderCode
        ? [formState.orderCode]
        : [];
  const resolvedTransferInfo =
    transferRecipientInfo ??
    (formState.bankInfo
      ? {
          bankName: formState.bankInfo.bankName,
          accountNumber: formState.bankInfo.accountNumber,
          accountHolder: formState.bankInfo.accountHolder,
        }
      : null);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="border border-black/10 bg-white">
        <div className="border-b border-black/8 px-6 py-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-black/62">
            Order Form
          </p>
          <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-black">
            {formState.status === "success" ? "주문서 작성 완료" : "주문서 작성"}
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-black/72">
            {formState.status === "success"
              ? "주문이 정상적으로 접수되었습니다. 아래 입금 정보를 확인한 뒤 안내된 계좌로 입금해 주세요."
              : "주문자 정보와 입금자명을 입력하면 주문이 접수됩니다. 접수 완료 후 아래 안내 계좌로 입금해 주세요."}
          </p>
        </div>

        <div className="px-6 py-6">
          <div
            className={[
              "border px-4 py-4 text-sm leading-6",
              isSignedIn
                ? "border-[#d7e4ff] bg-[#f5f8ff] text-[#32508a]"
                : "border-[#e5e7eb] bg-[#f7f8fa] text-[#4b5563]",
            ].join(" ")}
          >
            {isSignedIn
              ? "카카오 로그인 상태로 주문하면 마이페이지에서 주문 내역을 바로 확인할 수 있습니다."
              : "비회원 주문도 가능하지만 주문 내역은 마이페이지에 자동 연동되지 않습니다."}
          </div>

          {formState.message ? (
            <div
              aria-live="polite"
              className={[
                "mt-4 border px-4 py-4 text-sm leading-6",
                formState.status === "success"
                  ? "border-[#b8d7a6] bg-[#f2f8ed] text-[#315c23]"
                  : "border-[#efc4c4] bg-[#fff6f6] text-[#a13c3c]",
              ].join(" ")}
            >
              <p className="font-medium">{formState.message}</p>
            </div>
          ) : null}

          {formState.status === "success" && resolvedTransferInfo ? (
            <TransferPaymentPanel
              amount={formState.totalAmount ?? cart.subtotal}
              bankName={resolvedTransferInfo.bankName}
              accountNumber={resolvedTransferInfo.accountNumber}
              accountHolder={resolvedTransferInfo.accountHolder}
              orderCodes={submittedOrderCodes}
            />
          ) : null}

          {formState.status === "success" ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/cart"
                className="inline-flex h-12 w-full items-center justify-center border border-black/12 bg-white text-[15px] font-medium text-black hover:bg-black/[0.03]"
              >
                장바구니 보기
              </Link>
              <Link
                href={isSignedIn ? "/mypage" : "/"}
                className="inline-flex h-12 w-full items-center justify-center bg-black text-[15px] font-medium text-white hover:bg-black/92"
              >
                {isSignedIn ? "마이페이지에서 확인하기" : "메인 홈으로 이동"}
              </Link>
            </div>
          ) : (
            <form action={formAction} className="mt-5 space-y-4">
              <input type="hidden" name="cartLineItems" value={serializedCartLineItems} />

              {formState.fieldErrors.lineItems ? (
                <p className="text-sm text-[#d14343]">
                  {formState.fieldErrors.lineItems}
                </p>
              ) : null}

              <div>
                <label
                  htmlFor="customerName"
                  className="mb-2 block text-[15px] font-medium text-black/84"
                >
                  주문자명
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="h-12 w-full border border-black/12 px-3 text-[15px] outline-none focus:border-black"
                  placeholder="주문자명을 입력해 주세요"
                />
                {formState.fieldErrors.customerName ? (
                  <p className="mt-2 text-xs text-[#d14343]">
                    {formState.fieldErrors.customerName}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="customerPhone"
                  className="mb-2 block text-[15px] font-medium text-black/84"
                >
                  연락처
                </label>
                <input
                  id="customerPhone"
                  name="customerPhone"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  className="h-12 w-full border border-black/12 px-3 text-[15px] outline-none focus:border-black"
                  placeholder="010-0000-0000"
                />
                {formState.fieldErrors.customerPhone ? (
                  <p className="mt-2 text-xs text-[#d14343]">
                    {formState.fieldErrors.customerPhone}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="depositorName"
                  className="mb-2 block text-[15px] font-medium text-black/84"
                >
                  입금자명
                </label>
                <input
                  id="depositorName"
                  name="depositorName"
                  value={depositorName}
                  onChange={(event) => setDepositorName(event.target.value)}
                  className="h-12 w-full border border-black/12 px-3 text-[15px] outline-none focus:border-black"
                  placeholder="실제 송금자명을 입력해 주세요"
                />
                {formState.fieldErrors.depositorName ? (
                  <p className="mt-2 text-xs text-[#d14343]">
                    {formState.fieldErrors.depositorName}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="note"
                  className="mb-2 block text-[15px] font-medium text-black/84"
                >
                  요청사항
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  className="w-full border border-black/12 px-3 py-3 text-[15px] outline-none focus:border-black"
                  placeholder="남길 내용이 있으면 입력해 주세요"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/cart"
                  className="inline-flex h-12 w-full items-center justify-center border border-black/12 bg-white text-[15px] font-medium text-black hover:bg-black/[0.03]"
                >
                  장바구니 보기
                </Link>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-12 w-full items-center justify-center bg-black text-[15px] font-medium text-white hover:bg-black/92 disabled:cursor-not-allowed disabled:bg-black/45"
                >
                  {isPending ? "주문 접수 중..." : "주문 접수하기"}
                </button>
              </div>

              <p className="text-[13px] leading-6 text-black/58">
                주문 접수 후 안내된 계좌로 입금해 주시면 관리자 페이지에서 입금
                확인 처리합니다.
              </p>
            </form>
          )}
        </div>
      </section>

      <aside className="space-y-4 xl:sticky xl:top-28">
        <section className="border border-black/10 bg-white">
          <div className="border-b border-black/8 px-5 py-4">
            <p className="text-[15px] font-semibold text-black">주문 상품 요약</p>
          </div>

          <div className="space-y-3 px-5 py-5">
            {cart.items.map((item) => (
              <div
                key={item.itemId}
                className="flex items-start gap-3 border-b border-black/8 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="h-[72px] w-[72px] shrink-0 overflow-hidden border border-black/10 bg-[#f5f3ee]">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-black/40">
                      No Image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-black">
                    {item.productName}
                  </p>
                  <p className="mt-1 text-[13px] text-black/62">
                    {item.selectedSize} / {PRODUCT_COLOR_LABELS[item.selectedColor]} /{" "}
                    {item.quantity}개
                  </p>
                  <strong className="mt-2 block text-[15px] font-semibold text-black">
                    {formatPrice(item.lineTotal)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-black/10 bg-[#f7f7f5] px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[15px] font-semibold text-black">총 주문 금액</p>
            <strong className="text-[1.15rem] font-semibold text-black">
              {formatPrice(formState.totalAmount ?? cart.subtotal)}
            </strong>
          </div>
          <div className="mt-3 space-y-2 text-[14px] leading-6 text-black/68">
            <p>상품 수량 합계: {cart.totalItems}개</p>
            <p>장바구니 상품을 한 번에 주문서로 접수합니다.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
