/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import type { StorefrontProduct } from "@/types/product";

interface ProductSectionProps {
  products: StorefrontProduct[];
}

const priceFormatter = new Intl.NumberFormat("ko-KR");

function ProductCard({ product }: { product: StorefrontProduct }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block focus:outline-none"
    >
      <article className="flex flex-col gap-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-black/10 bg-black/[0.04] transition-transform duration-300 group-hover:-translate-y-1">
          {product.thumbnailUrl ? (
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-black/40">
              No Image
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/46">
            GEUKROCK SELECT
          </p>
          <h3 className="text-[15px] leading-6 text-black/88">{product.name}</h3>
          <p className="line-clamp-2 min-h-10 text-[13px] leading-5 text-black/58">
            {product.description || "등록된 상품 설명이 없습니다."}
          </p>
          <div className="flex items-center gap-2 text-[15px]">
            <span className="font-semibold text-black">
              {priceFormatter.format(product.price)}원
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ProductSection({ products }: ProductSectionProps) {
  return (
    <section className="px-5 pt-20 sm:px-8 sm:pt-24 lg:px-12" id="new-in">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-black/46">
              New In
            </p>
            <h2 className="text-[2rem] font-semibold leading-[1.02] tracking-[-0.07em] text-black sm:text-[2.7rem]">
              최근 등록된 상품
            </h2>
          </div>
          <p className="max-w-lg text-[14px] leading-6 text-black/58">
            관리자 화면에서 등록한 상품이 이 영역과 상세 페이지에 바로
            반영됩니다.
          </p>
        </div>

        {products.length ? (
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-9 rounded-[18px] border border-dashed border-black/14 bg-white/55 px-6 py-14 text-center text-[14px] text-black/58">
            아직 등록된 상품이 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
