"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createOrderAction } from "@/app/orders/actions";
import { formatPrice } from "@/lib/admin/format";
import { initialOrderFormState } from "@/types/order";
import {
  PRODUCT_COLOR_LABELS,
  PRODUCT_COLOR_SWATCHES,
  type ProductColor,
  type ProductSize,
} from "@/types/product";

interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  description: string | null;
  price: number;
  sizeOptions: ProductSize[];
  colorOptions: ProductColor[];
  loginHref: string;
  currentMemberName?: string | null;
  isSignedIn: boolean;
}

export function ProductPurchasePanel({
  productId,
  productName,
  description,
  price,
  sizeOptions,
  colorOptions,
  loginHref,
  currentMemberName,
  isSignedIn,
}: ProductPurchasePanelProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize>(
    sizeOptions[0] ?? "M",
  );
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    colorOptions[0] ?? "BLACK",
  );
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState(currentMemberName ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [depositorName, setDepositorName] = useState(currentMemberName ?? "");
  const [note, setNote] = useState("");
  const [formState, formAction, isPending] = useActionState(
    createOrderAction,
    initialOrderFormState,
  );
  const totalPrice = price * quantity;

  return (
    <aside className="space-y-6 lg:sticky lg:top-28">
      <div className="border border-black/10 bg-white px-6 py-7">
        <div className="space-y-3 border-b border-black/8 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/48">
            GEUKROCK ORDER
          </p>
          <h1 className="text-[1.7rem] font-semibold leading-tight tracking-[-0.04em] text-black">
            {productName}
          </h1>
          <p className="text-[15px] leading-6 text-black/58">
            {description || "등록된 상품 설명이 없습니다."}
          </p>
        </div>

        <div className="space-y-3 py-5 text-sm text-black/72">
          <div className="flex items-start justify-between gap-6">
            <span className="text-black/48">판매가</span>
            <strong className="text-[1.45rem] font-semibold text-black">
              {formatPrice(price)}
            </strong>
          </div>
          <div className="flex items-start justify-between gap-6 border-t border-black/8 pt-3">
            <span className="text-black/48">주문 방식</span>
            <span className="text-right">주문 접수 후 계좌이체</span>
          </div>
          <div className="flex items-start justify-between gap-6 border-t border-black/8 pt-3">
            <span className="text-black/48">입금 확인</span>
            <span className="text-right">관리자 페이지에서 직접 확인</span>
          </div>
        </div>

        {isSignedIn ? (
          <div className="mb-4 border border-[#d7e4ff] bg-[#f5f8ff] px-4 py-3 text-sm text-[#32508a]">
            카카오 회원으로 로그인되어 있어 주문 시 마이페이지에서 내 주문 내역을 바로
            확인할 수 있습니다.
          </div>
        ) : (
          <div className="mb-4 border border-[#e5e7eb] bg-[#f7f8fa] px-4 py-3 text-sm text-[#4b5563]">
            주문은 로그인 없이도 가능하지만,{" "}
            <Link href={loginHref} className="font-medium text-[#2f6fed]">
              카카오 로그인
            </Link>
            후 주문하면 마이페이지에서 주문 내역을 확인할 수 있습니다.
          </div>
        )}

        <form action={formAction} className="space-y-4 border-t border-black/8 pt-5">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="size" value={selectedSize} />
          <input type="hidden" name="color" value={selectedColor} />
          <input type="hidden" name="quantity" value={quantity} />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/48">사이즈</span>
              <span className="font-medium text-black">{selectedSize}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((size) => {
                const isSelected = selectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={[
                      "inline-flex min-w-12 items-center justify-center border px-3 py-2 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-black/12 bg-white text-black/72 hover:bg-black/[0.03]",
                    ].join(" ")}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {formState.fieldErrors.size ? (
              <p className="text-xs text-[#d14343]">{formState.fieldErrors.size}</p>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-black/8 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/48">색상</span>
              <span className="font-medium text-black">
                {PRODUCT_COLOR_LABELS[selectedColor]}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const isSelected = selectedColor === color;

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={[
                      "inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-black/12 bg-white text-black/72 hover:bg-black/[0.03]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "h-3 w-3 rounded-full border",
                        color === "WHITE" && isSelected
                          ? "border-white/60"
                          : "border-black/15",
                      ].join(" ")}
                      style={{ backgroundColor: PRODUCT_COLOR_SWATCHES[color] }}
                    />
                    {PRODUCT_COLOR_LABELS[color]}
                  </button>
                );
              })}
            </div>
            {formState.fieldErrors.color ? (
              <p className="text-xs text-[#d14343]">{formState.fieldErrors.color}</p>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-black/8 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/48">수량</span>
              <span className="font-medium text-black">{quantity}개</span>
            </div>
            <div className="inline-flex items-center border border-black/10">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="flex h-10 w-10 items-center justify-center text-lg text-black/72 hover:bg-black/[0.03]"
                aria-label="수량 감소"
              >
                -
              </button>
              <span className="flex h-10 min-w-12 items-center justify-center border-x border-black/10 text-sm font-medium text-black">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(20, current + 1))}
                className="flex h-10 w-10 items-center justify-center text-lg text-black/72 hover:bg-black/[0.03]"
                aria-label="수량 증가"
              >
                +
              </button>
            </div>
            {formState.fieldErrors.quantity ? (
              <p className="text-xs text-[#d14343]">{formState.fieldErrors.quantity}</p>
            ) : null}
          </div>

          <div className="space-y-3 border-t border-black/8 pt-4">
            <div>
              <label
                htmlFor="customerName"
                className="mb-2 block text-sm font-medium text-black/72"
              >
                주문자명
              </label>
              <input
                id="customerName"
                name="customerName"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="h-11 w-full border border-black/12 px-3 text-sm outline-none focus:border-black"
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
                className="mb-2 block text-sm font-medium text-black/72"
              >
                연락처
              </label>
              <input
                id="customerPhone"
                name="customerPhone"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="h-11 w-full border border-black/12 px-3 text-sm outline-none focus:border-black"
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
                className="mb-2 block text-sm font-medium text-black/72"
              >
                입금자명
              </label>
              <input
                id="depositorName"
                name="depositorName"
                value={depositorName}
                onChange={(event) => setDepositorName(event.target.value)}
                className="h-11 w-full border border-black/12 px-3 text-sm outline-none focus:border-black"
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
                className="mb-2 block text-sm font-medium text-black/72"
              >
                요청사항
              </label>
              <textarea
                id="note"
                name="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="w-full border border-black/12 px-3 py-3 text-sm outline-none focus:border-black"
                placeholder="남길 내용이 있으면 입력해 주세요"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-dashed border-black/10 pt-4">
            <span className="text-sm text-black/48">총 주문 금액</span>
            <strong className="text-[1.2rem] font-semibold text-black">
              {formatPrice(totalPrice)}
            </strong>
          </div>

          {formState.message ? (
            <div
              aria-live="polite"
              className={[
                "border px-4 py-4 text-sm leading-6",
                formState.status === "success"
                  ? "border-[#b8d7a6] bg-[#f2f8ed] text-[#315c23]"
                  : "border-[#efc4c4] bg-[#fff6f6] text-[#a13c3c]",
              ].join(" ")}
            >
              <p className="font-medium">{formState.message}</p>
              {formState.status === "success" && formState.bankInfo ? (
                <div className="mt-3 space-y-1 text-[13px]">
                  <p>주문번호: {formState.orderCode}</p>
                  <p>입금금액: {formatPrice(formState.totalAmount ?? totalPrice)}</p>
                  <p>은행명: {formState.bankInfo.bankName}</p>
                  <p>계좌번호: {formState.bankInfo.accountNumber}</p>
                  <p>예금주: {formState.bankInfo.accountHolder}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 w-full items-center justify-center bg-black text-sm font-medium text-white hover:bg-black/92 disabled:cursor-not-allowed disabled:bg-black/45"
          >
            {isPending ? "주문 접수 중..." : "주문하기"}
          </button>

          <p className="text-xs leading-5 text-black/42">
            주문 접수 후 안내된 계좌로 입금해 주시면 관리자 페이지에서 입금 확인
            처리합니다.
          </p>
        </form>
      </div>

      <div className="border border-black/10 bg-[#f7f4ee] px-6 py-5">
        <p className="text-sm font-semibold text-black">주문 안내</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-black/58">
          <li>전자결제 대신 주문 접수 후 계좌이체 방식으로 운영됩니다.</li>
          <li>입금자명은 실제 송금하실 이름으로 정확히 입력해 주세요.</li>
          <li>카카오 로그인 회원은 마이페이지에서 주문 내역을 확인할 수 있습니다.</li>
        </ul>
      </div>
    </aside>
  );
}
