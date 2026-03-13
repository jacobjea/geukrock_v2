"use client";

import { useEffect, useState } from "react";

import { addToCartAction } from "@/app/cart/actions";
import { formatPrice } from "@/lib/admin/format";
import { signInWithKakaoAction } from "@/lib/auth-actions";
import {
  calculateOrderTotalPrice,
  serializeOrderLineItems,
} from "@/lib/order-line-items";
import {
  formatCountdown,
  formatSalePeriod,
  getProductSaleStatus,
} from "@/lib/product-sale";
import { type OrderLineItemInput } from "@/types/order";
import {
  PRODUCT_COLOR_LABELS,
  PRODUCT_COLOR_SWATCHES,
  type ProductColor,
  type ProductSaleMode,
  type ProductSize,
} from "@/types/product";

interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  description: string | null;
  price: number;
  sizeOptions: ProductSize[];
  colorOptions: ProductColor[];
  saleMode: ProductSaleMode;
  saleStartAt: string | null;
  saleEndAt: string | null;
  initialNowIso: string;
  loginReturnTo: string;
  isSignedIn: boolean;
}

interface SelectedOrderLineItem extends OrderLineItemInput {
  id: string;
}

function createSelectedLineItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function SelectIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ProductPurchasePanel({
  productId,
  productName,
  description,
  price,
  sizeOptions,
  colorOptions,
  saleMode,
  saleStartAt,
  saleEndAt,
  initialNowIso,
  loginReturnTo,
  isSignedIn,
}: ProductPurchasePanelProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | "">("");
  const [selectedColor, setSelectedColor] = useState<ProductColor | "">("");
  const [selectedItems, setSelectedItems] = useState<SelectedOrderLineItem[]>([]);
  const [nowMs, setNowMs] = useState(() => new Date(initialNowIso).getTime());
  const hasSelectedItems = selectedItems.length > 0;
  const totalPrice = calculateOrderTotalPrice(selectedItems, price);
  const serializedLineItems = serializeOrderLineItems(selectedItems);
  const saleStatus = getProductSaleStatus(
    {
      saleMode,
      saleStartAt,
      saleEndAt,
    },
    new Date(nowMs),
  );
  const countdownText = saleStatus.countdownTarget
    ? formatCountdown(new Date(saleStatus.countdownTarget).getTime() - nowMs)
    : null;
  const canPurchase = saleStatus.canOrder;

  useEffect(() => {
    if (saleMode !== "period" || saleStatus.state === "ended") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [saleMode, saleStatus.state]);

  function appendSelectedItem(nextSize: ProductSize, nextColor: ProductColor) {
    setSelectedItems((current) => [
      ...current,
      {
        id: createSelectedLineItemId(),
        selectedSize: nextSize,
        selectedColor: nextColor,
        quantity: 1,
      },
    ]);
    setSelectedSize("");
    setSelectedColor("");
  }

  function updateSelectedItemQuantity(
    itemId: string,
    direction: "decrease" | "increase",
  ) {
    setSelectedItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const nextQuantity =
          direction === "decrease"
            ? Math.max(1, item.quantity - 1)
            : Math.min(20, item.quantity + 1);

        return {
          ...item,
          quantity: nextQuantity,
        };
      }),
    );
  }

  function removeSelectedItem(itemId: string) {
    setSelectedItems((current) => current.filter((item) => item.id !== itemId));
  }

  function handleColorChange(value: string) {
    const nextColor = value as ProductColor | "";

    if (!nextColor) {
      setSelectedColor("");
      return;
    }

    if (selectedSize) {
      appendSelectedItem(selectedSize, nextColor);
      return;
    }

    setSelectedColor(nextColor);
  }

  function handleSizeChange(value: string) {
    const nextSize = value as ProductSize | "";

    if (!nextSize) {
      setSelectedSize("");
      return;
    }

    if (selectedColor) {
      appendSelectedItem(nextSize, selectedColor);
      return;
    }

    setSelectedSize(nextSize);
  }
  return (
    <aside className="space-y-6 lg:sticky lg:top-28">
      <div className="border border-black/10 bg-white px-6 py-7">
        <div className="space-y-3 border-b border-black/8 pb-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-black/62">
            GEUKROCK ORDER
          </p>
          <h1 className="text-[1.7rem] font-semibold leading-tight tracking-[-0.04em] text-black">
            {productName}
          </h1>
          <p className="text-[16px] leading-7 text-black/72">
            {description || "등록된 상품 설명이 없습니다."}
          </p>
        </div>

        <div className="space-y-3 py-5 text-[15px] text-black/84">
          <div className="flex items-start justify-between gap-6">
            <span className="font-semibold text-black/78">판매가</span>
            <strong className="text-[1.45rem] font-semibold text-black">
              {formatPrice(price)}
            </strong>
          </div>
          <div className="flex items-start justify-between gap-6 border-t border-black/8 pt-3">
            <span className="font-semibold text-black/78">주문 방식</span>
            <span className="text-right font-medium text-black/88">
              주문 접수 후 계좌이체
            </span>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-[#ead9d7] bg-[#fdf4f3] px-4 py-4">
          <p className="text-[1.08rem] font-semibold leading-7 text-[#6f2b2b]">
            {saleStatus.state === "always"
              ? "상시 판매 중인 상품입니다."
              : saleStatus.state === "active"
                ? "주문 접수 마감까지 남은 시간"
                : saleStatus.state === "upcoming"
                  ? "주문 접수 시작까지 남은 시간"
                  : "주문 접수 기간이 종료되었습니다."}
          </p>

          <p className="mt-2 text-[15px] leading-7 text-[#8a5a56]">
            {saleMode === "always"
              ? "기간 제한 없이 상시 주문을 받을 수 있습니다."
              : formatSalePeriod(saleStartAt, saleEndAt)}
          </p>

          {countdownText ? (
            <strong className="mt-3 inline-flex min-w-[15ch] whitespace-nowrap tabular-nums text-[0.98rem] font-semibold tracking-[0.04em] text-[#b23b3b]">
              {countdownText}
            </strong>
          ) : null}

          {saleStatus.state === "upcoming" ? (
            <p className="mt-2 text-[13px] leading-6 text-[#976763]">
              판매 시작 전에는 장바구니와 주문 접수가 비활성화됩니다.
            </p>
          ) : null}
          {saleStatus.state === "ended" ? (
            <p className="mt-2 text-[13px] leading-6 text-[#976763]">
              판매 기간이 끝나 현재는 주문을 받을 수 없습니다.
            </p>
          ) : null}
        </div>

        {isSignedIn ? (
          <div className="mb-4 border border-[#d7e4ff] bg-[#f5f8ff] px-4 py-3 text-sm text-[#32508a]">
            주문 시 마이페이지에서 내 주문 내역을 바로 확인할 수 있습니다.
          </div>
        ) : (
          <div className="mb-4 border border-[#e5e7eb] bg-[#f7f8fa] px-4 py-3 text-sm text-[#4b5563]">
            주문과 장바구니는 로그인 후 이용할 수 있습니다.{" "}
            <form action={signInWithKakaoAction} className="inline">
              <input type="hidden" name="returnTo" value={loginReturnTo} />
              <button type="submit" className="font-medium text-[#2f6fed]">
                카카오 로그인
              </button>
            </form>
            후 주문 내역을 마이페이지에서 확인할 수 있습니다.
          </div>
        )}

        <div className="space-y-4 border-t border-black/8 pt-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-black/62">컬러</span>
              <span className="font-medium text-black">
                {selectedColor ? PRODUCT_COLOR_LABELS[selectedColor] : "선택 안 됨"}
              </span>
            </div>
            <div className="relative">
              <label htmlFor="selectedColor" className="sr-only">
                색상 선택
              </label>
              <select
                id="selectedColor"
                value={selectedColor}
                onChange={(event) => handleColorChange(event.target.value)}
                className="h-12 w-full appearance-none border border-black/12 bg-white px-3 pr-10 text-[15px] text-black outline-none transition-colors focus:border-black"
              >
                <option value="">컬러를 선택해 주세요</option>
                {colorOptions.map((color) => (
                  <option key={color} value={color}>
                    {PRODUCT_COLOR_LABELS[color]}
                  </option>
                ))}
              </select>
              <SelectIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/56" />
            </div>
          </div>

          <div className="space-y-2 border-t border-black/8 pt-4">
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-black/62">사이즈</span>
              <span className="font-medium text-black">
                {selectedSize || "선택 안 됨"}
              </span>
            </div>
            <div className="relative">
              <label htmlFor="selectedSize" className="sr-only">
                사이즈 선택
              </label>
              <select
                id="selectedSize"
                value={selectedSize}
                onChange={(event) => handleSizeChange(event.target.value)}
                className="h-12 w-full appearance-none border border-black/12 bg-white px-3 pr-10 text-[15px] text-black outline-none transition-colors focus:border-black"
              >
                <option value="">사이즈를 선택해 주세요</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <SelectIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/56" />
            </div>
          </div>

          <div className="space-y-2 border-t border-black/8 pt-4">
            <div className="rounded-2xl border border-dashed border-black/12 bg-[#faf9f6] px-4 py-4 text-[15px] leading-7 text-black/72">
              옵션을 모두 선택하면 주문 상품 카드가 아래에 추가됩니다.
            </div>

            {selectedItems.length > 0 ? (
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-3.5 w-3.5 rounded-full border border-black/10"
                            style={{
                              backgroundColor:
                                PRODUCT_COLOR_SWATCHES[item.selectedColor],
                            }}
                          />
                          <p className="truncate text-[15px] font-semibold text-black">
                            {PRODUCT_COLOR_LABELS[item.selectedColor]}, {item.selectedSize}
                          </p>
                        </div>
                        <p className="mt-1 text-[14px] text-black/68">
                          선택한 옵션이 주문 항목에 반영됩니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedItem(item.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-black/42 transition-colors duration-200 hover:bg-black/[0.05] hover:text-black"
                        aria-label="선택 옵션 삭제"
                      >
                        ×
                      </button>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-black/56">
                          Quantity
                        </p>
                        <div className="inline-flex items-center border border-black/10 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedItemQuantity(item.id, "decrease")
                            }
                            className="flex h-10 w-10 items-center justify-center text-lg text-black/72 hover:bg-black/[0.03]"
                            aria-label="수량 감소"
                          >
                            -
                          </button>
                          <span className="flex h-10 min-w-12 items-center justify-center border-x border-black/10 text-sm font-medium text-black">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedItemQuantity(item.id, "increase")
                            }
                            className="flex h-10 w-10 items-center justify-center text-lg text-black/72 hover:bg-black/[0.03]"
                            aria-label="수량 증가"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/56">
                          Total
                        </p>
                        <strong className="mt-2 block text-[1.25rem] font-semibold text-black">
                          {formatPrice(price * item.quantity)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-dashed border-black/10 pt-4">
            <span className="text-[15px] text-black/62">총 주문 금액</span>
            {hasSelectedItems ? (
              <strong className="text-[1.2rem] font-semibold text-black">
                {formatPrice(totalPrice)}
              </strong>
            ) : (
              <span className="text-[15px] font-medium text-black/58">
                옵션 선택 후 확인
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {isSignedIn ? (
              <>
                <form action={addToCartAction}>
                  <input type="hidden" name="productId" value={productId} />
                  <input type="hidden" name="lineItems" value={serializedLineItems} />
                  <button
                    type="submit"
                    disabled={!hasSelectedItems || !canPurchase}
                    className="inline-flex h-12 w-full items-center justify-center border border-black/12 bg-[#f6f4ef] text-[15px] font-medium text-black hover:bg-[#efebe3] disabled:cursor-not-allowed disabled:border-black/8 disabled:bg-black/[0.04] disabled:text-black/38"
                  >
                    {canPurchase
                      ? hasSelectedItems
                        ? "장바구니 담기"
                        : "옵션 선택 후 담기"
                      : saleStatus.state === "upcoming"
                        ? "판매 시작 전"
                        : "판매 종료"}
                  </button>
                </form>

                <form action="/orders/start" method="post">
                  <input type="hidden" name="checkoutMode" value="direct" />
                  <input type="hidden" name="productId" value={productId} />
                  <input type="hidden" name="lineItems" value={serializedLineItems} />
                  <button
                    type="submit"
                    disabled={!hasSelectedItems || !canPurchase}
                    className="inline-flex h-12 w-full items-center justify-center bg-black text-[15px] font-medium text-white hover:bg-black/92 disabled:cursor-not-allowed disabled:bg-black/45"
                  >
                    {canPurchase
                      ? hasSelectedItems
                        ? "주문하기"
                        : "옵션을 선택 후 주문"
                      : saleStatus.state === "upcoming"
                        ? "판매 시작 전"
                        : "판매 종료"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <form action={signInWithKakaoAction}>
                  <input type="hidden" name="returnTo" value={loginReturnTo} />
                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center border border-black/12 bg-[#f6f4ef] text-[15px] font-medium text-black hover:bg-[#efebe3]"
                  >
                    로그인 후 장바구니 담기
                  </button>
                </form>

                <form action={signInWithKakaoAction}>
                  <input type="hidden" name="returnTo" value={loginReturnTo} />
                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center bg-black text-[15px] font-medium text-white hover:bg-black/92"
                  >
                    로그인 후 주문하기
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-[13px] leading-6 text-black/58">
            {canPurchase
              ? isSignedIn
                ? "주문하기 버튼을 누르면 주문 페이지로 이동하고, 접수 후 안내된 계좌로 입금해 주시면 관리자 페이지에서 입금 확인 처리합니다."
                : "로그인 후 주문 페이지와 장바구니 기능을 이용할 수 있습니다."
              : "설정된 판매 기간 안에서만 장바구니와 주문 접수가 가능합니다."}
          </p>
        </div>
      </div>

      <div className="border border-black/10 bg-[#f7f4ee] px-6 py-5">
        <p className="text-[15px] font-semibold text-black">주문 안내</p>
        <ul className="mt-3 space-y-2 text-[15px] leading-7 text-black/72">
          <li>전자결제 대신 주문 접수 후 계좌이체 방식으로 운영됩니다.</li>
          <li>입금자명은 실제 송금하실 이름으로 정확히 입력해 주세요.</li>
          <li>마이페이지에서 주문 내역을 확인할 수 있습니다.</li>
        </ul>
      </div>
    </aside>
  );
}
