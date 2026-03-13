"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRef, useState } from "react";

import { formatPrice } from "@/lib/admin/format";
import { getResizedImageUrl } from "@/lib/image-url";
import type { GuestCartSnapshot } from "@/types/cart";
import { PRODUCT_COLOR_LABELS } from "@/types/product";

interface CartPageContentProps {
  initialCart: GuestCartSnapshot | null;
  initialStatusMessage: string | null;
}

interface UpdateCartItemResponse {
  status: "updated" | "removed" | "empty" | "missing";
}

interface ProductSyncState {
  inFlight: boolean;
  desiredQuantity: number;
  rollbackCart: GuestCartSnapshot | null;
}

function buildNextCartSnapshot(
  cart: GuestCartSnapshot,
  itemId: string,
  nextQuantity: number,
) {
  const safeQuantity = Math.max(0, Math.min(99, Math.floor(nextQuantity)));
  const nextItems = cart.items
    .map((item) =>
      item.itemId === itemId
        ? {
            ...item,
            quantity: safeQuantity,
            lineTotal: item.price * safeQuantity,
          }
        : item,
    )
    .filter((item) => item.quantity > 0);

  return {
    ...cart,
    items: nextItems,
    totalItems: nextItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: nextItems.reduce((sum, item) => sum + item.lineTotal, 0),
  } satisfies GuestCartSnapshot;
}

function getLocalStatusMessage(status: UpdateCartItemResponse["status"]) {
  switch (status) {
    case "updated":
      return "장바구니 수량을 변경했습니다.";
    case "removed":
      return "상품을 장바구니에서 제거했습니다.";
    case "empty":
      return "장바구니가 비워졌습니다.";
    default:
      return null;
  }
}

export function CartPageContent({
  initialCart,
  initialStatusMessage,
}: CartPageContentProps) {
  const [cart, setCart] = useState(initialCart);
  const [statusMessage, setStatusMessage] = useState(initialStatusMessage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cartRef = useRef(initialCart);
  const syncStateRef = useRef<Record<string, ProductSyncState>>({});

  const hasItems = Boolean(cart?.items.length);

  function updateCartSnapshot(
    nextCart:
      | GuestCartSnapshot
      | null
      | ((current: GuestCartSnapshot | null) => GuestCartSnapshot | null),
  ) {
    setCart((current) => {
      const resolvedCart = typeof nextCart === "function" ? nextCart(current) : nextCart;
      cartRef.current = resolvedCart;
      return resolvedCart;
    });
  }

  async function flushProductQuantity(itemId: string) {
    const syncState = syncStateRef.current[itemId];

    if (!syncState || syncState.inFlight) {
      return;
    }

    syncState.inFlight = true;
    const quantityToSend = syncState.desiredQuantity;

    try {
      const response = await fetch("/api/cart/items", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          cartItemId: itemId,
          quantity: quantityToSend,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to update cart item.");
      }

      const result = (await response.json()) as UpdateCartItemResponse;

      if (result.status === "missing") {
        updateCartSnapshot(syncState.rollbackCart);
        setStatusMessage(null);
        setErrorMessage("장바구니 상태가 달라졌습니다. 새로고침 후 다시 시도해 주세요.");
        delete syncStateRef.current[itemId];
        return;
      }

      setStatusMessage(getLocalStatusMessage(result.status));
      setErrorMessage(null);

      const latestSyncState = syncStateRef.current[itemId];

      if (!latestSyncState) {
        return;
      }

      if (latestSyncState.desiredQuantity !== quantityToSend) {
        latestSyncState.inFlight = false;
        await flushProductQuantity(itemId);
        return;
      }

      delete syncStateRef.current[itemId];
    } catch {
      updateCartSnapshot(syncState.rollbackCart);
      setStatusMessage(null);
      setErrorMessage("장바구니 변경에 실패했습니다. 다시 시도해 주세요.");
      delete syncStateRef.current[itemId];
    }
  }

  function queueItemQuantityUpdate(itemId: string, nextQuantity: number) {
    const currentCart = cartRef.current;

    if (!currentCart) {
      return;
    }

    const syncState = syncStateRef.current[itemId];
    const rollbackCart = syncState?.rollbackCart ?? currentCart;
    const optimisticCart = buildNextCartSnapshot(currentCart, itemId, nextQuantity);

    syncStateRef.current[itemId] = {
      inFlight: syncState?.inFlight ?? false,
      desiredQuantity: Math.max(0, Math.min(99, Math.floor(nextQuantity))),
      rollbackCart,
    };

    updateCartSnapshot(optimisticCart);
    setStatusMessage(
      nextQuantity <= 0
        ? "상품을 장바구니에서 제거했습니다."
        : "장바구니 수량을 변경했습니다.",
    );
    setErrorMessage(null);
    void flushProductQuantity(itemId);
  }

  function changeItemQuantity(itemId: string, delta: number) {
    const currentCart = cartRef.current;

    if (!currentCart) {
      return;
    }

    const currentItem = currentCart.items.find((item) => item.itemId === itemId);

    if (!currentItem) {
      return;
    }

    queueItemQuantityUpdate(itemId, currentItem.quantity + delta);
  }

  function removeItem(itemId: string) {
    queueItemQuantityUpdate(itemId, 0);
  }

  if (!hasItems || !cart) {
    return (
      <>
        {statusMessage ? (
          <div className="mt-5 border border-[#b7d4ff] bg-[#eef5ff] px-4 py-3 text-sm text-[#1d4f91]">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 border border-[#f0c7c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318]">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-8 border border-dashed border-black/12 bg-white/70 px-6 py-16 text-center">
          <p className="text-[1.1rem] font-semibold text-black">
            장바구니가 비어 있습니다.
          </p>
          <p className="mt-3 text-[15px] leading-7 text-black/72">
            상세 페이지에서 상품을 담으면 이곳에서 수량을 조절하고 금액을 확인할
            수 있습니다.
          </p>
          <Link
            href="/#new-in"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full border border-black/12 bg-white px-6 text-[15px] font-medium text-black/84 hover:bg-black/[0.03]"
          >
            상품 보러가기
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      {statusMessage ? (
        <div className="mt-5 border border-[#b7d4ff] bg-[#eef5ff] px-4 py-3 text-sm text-[#1d4f91]">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 border border-[#f0c7c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318]">
          {errorMessage}
        </div>
      ) : null}

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {cart.items.map((item) => {
            return (
              <article
                key={item.itemId}
                className="border border-black/10 bg-white px-4 py-4 sm:px-5"
              >
                <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <Link
                    href={`/products/${item.productId}`}
                    className="overflow-hidden border border-black/10 bg-[#f5f3ee]"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={getResizedImageUrl(item.thumbnailUrl, 480) ?? item.thumbnailUrl}
                        alt={item.productName}
                        className="aspect-[4/5] h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] items-center justify-center text-sm text-black/40">
                        No Image
                      </div>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-black/62">
                          GEUKROCK SELECT
                        </p>
                        <Link
                          href={`/products/${item.productId}`}
                          className="mt-2 block text-[1.12rem] font-semibold leading-7 text-black hover:opacity-70"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.12em] text-black/62">
                          {item.selectedSize} / {PRODUCT_COLOR_LABELS[item.selectedColor]}
                        </p>
                        <p className="mt-2 line-clamp-2 text-[15px] leading-7 text-black/72">
                          {item.productDescription ||
                            "등록된 상품 설명이 없습니다."}
                        </p>
                      </div>

                      <div className="shrink-0 text-[15px] text-black/62">
                        개당 {formatPrice(item.price)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-black/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex w-fit items-center border border-black/10">
                        <button
                          type="button"
                          onClick={() => changeItemQuantity(item.itemId, -1)}
                          aria-label={`${item.productName} 수량 감소`}
                          className="flex h-10 w-10 items-center justify-center text-lg text-black/72 hover:bg-black/[0.03]"
                        >
                          -
                        </button>
                        <span className="flex h-10 min-w-12 items-center justify-center border-x border-black/10 text-sm font-medium text-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeItemQuantity(item.itemId, 1)}
                          aria-label={`${item.productName} 수량 증가`}
                          className="flex h-10 w-10 items-center justify-center text-lg text-black/72 hover:bg-black/[0.03]"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <strong className="text-[1.02rem] font-semibold text-black">
                          {formatPrice(item.lineTotal)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => removeItem(item.itemId)}
                          className="inline-flex h-10 items-center justify-center rounded-full border border-black/12 px-4 text-[15px] font-medium text-black/72 hover:bg-black/[0.03]"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28">
          <div className="border border-black/10 bg-white px-5 py-6">
            <p className="text-[15px] font-semibold text-black">주문 예상 금액</p>
            <div className="mt-5 space-y-3 text-[15px] text-black/72">
              <div className="flex items-center justify-between gap-4">
                <span>상품 수</span>
                <span>{cart.totalItems}개</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>상품 금액</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>배송비</span>
                <span>추후 계산 예정</span>
              </div>
            </div>

            <div className="mt-5 border-t border-dashed border-black/10 pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[15px] text-black/62">총 예상 금액</span>
                <strong className="text-[1.2rem] font-semibold text-black">
                  {formatPrice(cart.subtotal)}
                </strong>
              </div>
            </div>

            <form action="/orders/start" method="post" className="mt-5">
              <input type="hidden" name="checkoutMode" value="cart" />
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center bg-black text-[15px] font-medium text-white hover:bg-black/92"
              >
                주문하기
              </button>
            </form>

            <Link
              href="/#new-in"
              className="mt-3 inline-flex h-12 w-full items-center justify-center border border-black/12 bg-[#f6f4ef] text-[15px] font-medium text-black/84"
            >
              쇼핑 계속하기
            </Link>
          </div>

          <div className="border border-black/10 bg-[#f7f4ee] px-5 py-5">
            <p className="text-[15px] font-semibold text-black">보관 정책</p>
            <p className="mt-3 text-[15px] leading-7 text-black/72">
              장바구니 상품은 마지막 조회 또는 수정 시점부터 30일 동안 유지되고,
              만료된 정보는 정리 작업에서 자동 삭제됩니다.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
