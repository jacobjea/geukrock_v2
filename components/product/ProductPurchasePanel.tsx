"use client";

import { useState } from "react";

import { addToCartAction } from "@/app/cart/actions";
import { CartSubmitButton } from "@/components/cart/CartSubmitButton";
import { formatPrice } from "@/lib/admin/format";
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
}

export function ProductPurchasePanel({
  productId,
  productName,
  description,
  price,
  sizeOptions,
  colorOptions,
}: ProductPurchasePanelProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize>(
    sizeOptions[0] ?? "M",
  );
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    colorOptions[0] ?? "BLACK",
  );
  const [quantity, setQuantity] = useState(1);
  const totalPrice = price * quantity;

  return (
    <aside className="space-y-6 lg:sticky lg:top-28">
      <div className="border border-black/10 bg-white px-6 py-7">
        <div className="space-y-3 border-b border-black/8 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/48">
            GEUKROCK SELECT
          </p>
          <h1 className="text-[1.7rem] font-semibold leading-tight tracking-[-0.04em] text-black">
            {productName}
          </h1>
          <p className="text-[15px] leading-6 text-black/58">
            {description || "상품 설명이 아직 등록되지 않았습니다."}
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
            <span className="text-black/48">배송정보</span>
            <span className="text-right">마감 이후 1~3일 이내 주문 제작</span>
          </div>
          <div className="flex items-start justify-between gap-6 border-t border-black/8 pt-3">
            <span className="text-black/48">회원 혜택</span>
            <span className="text-right">회원 등급별 혜택은 준비 중입니다.</span>
          </div>
        </div>

        <div className="space-y-4 border-t border-black/8 pt-5">
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
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-black/48">수량</span>
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
                onClick={() => setQuantity((current) => current + 1)}
                className="flex h-10 w-10 items-center justify-center text-lg text-black/72 hover:bg-black/[0.03]"
                aria-label="수량 증가"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-dashed border-black/10 pt-4">
            <span className="text-sm text-black/48">총 상품 금액</span>
            <strong className="text-[1.2rem] font-semibold text-black">
              {formatPrice(totalPrice)}
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <form action={addToCartAction}>
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="size" value={selectedSize} />
              <input type="hidden" name="color" value={selectedColor} />
              <input type="hidden" name="quantity" value={quantity} />
              <CartSubmitButton
                idleLabel="장바구니 담기"
                pendingLabel="담는 중..."
                className="inline-flex h-12 w-full items-center justify-center border border-black/12 bg-[#f6f4ef] text-sm font-medium text-black/78 hover:bg-[#ece9e2] disabled:cursor-not-allowed disabled:text-black/42"
              />
            </form>
            <button
              type="button"
              disabled
              className="inline-flex h-12 items-center justify-center bg-black text-sm font-medium text-white/78"
            >
              바로 구매 준비 중
            </button>
          </div>

          <p className="text-xs leading-5 text-black/42">
            주문/결제 기능은 아직 연결되지 않았습니다. 현재는 상품 정보 확인용
            상세 페이지입니다.
          </p>
        </div>
      </div>

      <div className="border border-black/10 bg-[#f7f4ee] px-6 py-5">
        <p className="text-sm font-semibold text-black">구매 안내</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-black/58">
          <li>상품 색상은 촬영 환경과 모니터 설정에 따라 차이가 있을 수 있습니다.</li>
          <li>상세 이미지와 설명을 먼저 확인한 뒤 주문해 주세요.</li>
          <li>교환/반품 안내는 페이지 하단 배송 안내 영역에서 확인할 수 있습니다.</li>
        </ul>
      </div>
    </aside>
  );
}
