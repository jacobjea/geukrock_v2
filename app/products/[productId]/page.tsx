/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { getCurrentMember } from "@/lib/auth";
import { getStorefrontProductById } from "@/lib/admin/products";
import { getResizedImageUrl } from "@/lib/image-url";
import { PRODUCT_COLOR_LABELS } from "@/types/product";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getStorefrontProductById(productId);

  if (!product) {
    return {
      title: "상품을 찾을 수 없습니다 | GEUKROCK",
    };
  }

  return {
    title: `${product.name} | GEUKROCK`,
    description: product.description ?? `${product.name} 상품 상세 페이지`,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { productId } = await params;
  const nowIso = new Date().toISOString();
  const [product, currentMember] = await Promise.all([
    getStorefrontProductById(productId),
    getCurrentMember(),
  ]);

  if (!product) {
    notFound();
  }

  const detailImages = product.images.filter((image) => image.kind === "detail");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-24">
        <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
          <nav className="flex flex-wrap items-center gap-2 text-[13px] text-black/62">
            <Link href="/" className="hover:text-black">
              홈
            </Link>
            <span>/</span>
            <Link href="/#new-in" className="hover:text-black">
              상품
            </Link>
            <span>/</span>
            <span className="text-black/84">{product.name}</span>
          </nav>

          <section className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <ProductImageGallery
              productName={product.name}
              images={product.images}
            />
            <ProductPurchasePanel
              key={product.id}
              productId={product.id}
              productName={product.name}
              description={product.description}
              price={product.price}
              sizeOptions={product.sizeOptions}
              colorOptions={product.colorOptions}
              saleMode={product.saleMode}
              saleStartAt={product.saleStartAt}
              saleEndAt={product.saleEndAt}
              initialNowIso={nowIso}
              loginReturnTo={`/products/${product.id}`}
              isSignedIn={Boolean(currentMember)}
            />
          </section>

          <div className="sticky top-[76px] z-20 mt-14 border-y border-black/8 bg-background/96 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-6 px-1 py-4 text-[15px] font-medium text-black/72">
              <a href="#product-info" className="hover:text-black">
                상품 정보
              </a>
              <a href="#product-images" className="hover:text-black">
                상세 이미지
              </a>
              <a href="#delivery-info" className="hover:text-black">
                배송 안내
              </a>
            </div>
          </div>

          <section
            id="product-info"
            className="grid gap-8 border-b border-black/8 py-12 lg:grid-cols-[minmax(0,1fr)_320px]"
          >
            <div className="space-y-6">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-black/62">
                  Product Story
                </p>
                <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-black">
                  상품 설명
                </h2>
              </div>
              <div className="border border-black/10 bg-white px-6 py-6 text-[16px] leading-8 text-black/84">
                {product.description ? (
                  <p className="whitespace-pre-line">{product.description}</p>
                ) : (
                  <p>등록된 상품 설명이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-black/10 bg-white px-5 py-5">
                <p className="text-[15px] font-semibold text-black">상품 기본 정보</p>
                <dl className="mt-4 space-y-3 text-[15px] text-black/72">
                  <div className="flex items-start justify-between gap-4 border-b border-black/6 pb-3">
                    <dt>사이즈</dt>
                    <dd className="text-right">{product.sizeOptions.join(", ")}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt>색상</dt>
                    <dd className="text-right">
                      {product.colorOptions
                        .map((color) => PRODUCT_COLOR_LABELS[color])
                        .join(", ")}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section id="product-images" className="border-b border-black/8 py-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-black/62">
                  Detail Images
                </p>
                <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-black">
                  상세 이미지
                </h2>
              </div>
            </div>

            {detailImages.length ? (
              <div className="mx-auto mt-8 flex max-w-[620px] flex-col gap-5">
                {detailImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="overflow-hidden border border-black/10 bg-white"
                  >
                    <img
                      src={getResizedImageUrl(image.url, 1240) ?? image.url}
                      alt={`${product.name} 상세 이미지 ${index + 1}`}
                      className="w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 border border-dashed border-black/12 bg-white/60 px-6 py-14 text-center text-[15px] text-black/68">
                등록된 상세 이미지가 없습니다.
              </div>
            )}
          </section>

          <section
            id="delivery-info"
            className="grid gap-5 py-12 md:grid-cols-2 xl:grid-cols-3"
          >
            <div className="border border-black/10 bg-white px-5 py-5">
              <p className="text-[15px] font-semibold text-black">배송 안내</p>
              <ul className="mt-4 space-y-2 text-[15px] leading-7 text-black/72">
                <li>접수 마감 후 평균 2~4일 이내에 출고됩니다.</li>
                <li>출고된 물품은 이후 정모 당일에 직접 전달될 예정입니다.</li>
                <li>주문량이 많을 경우 출고 일정이 다소 지연될 수 있습니다.</li>
              </ul>
            </div>

            <div className="border border-black/10 bg-white px-5 py-5">
              <p className="text-[15px] font-semibold text-black">교환/반품 안내</p>
              <ul className="mt-4 space-y-2 text-[15px] leading-7 text-black/72">
                <li>단순 변심으로 인한 환불 및 반품은 어려운 점 양해 부탁드립니다.</li>
                <li>상품 수령 당일에 한해 상품에 이상이 있을 경우 환불 및 반품이 가능합니다.</li>
                <li>주문 전 상세 이미지와 사이즈 규격을 충분히 확인해 주세요.</li>
              </ul>
            </div>

            <div className="border border-black/10 bg-[#f7f4ee] px-5 py-5">
              <p className="text-[15px] font-semibold text-black">참고</p>
              <p className="mt-4 text-[15px] leading-7 text-black/72">
                모든 상품은 하이티에서 제작을 맡기고 있습니다.
                색상 추가 건의 가능합니다. 아래 링크를 참고해주세요.
                <a
                  href="https://hitee.co.kr/shop/view/151781590604"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block underline"
                >
                  하이티 제품 확인 링크
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
