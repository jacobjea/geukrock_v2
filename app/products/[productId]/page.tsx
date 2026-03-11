/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { getStorefrontProductById } from "@/lib/admin/products";

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
  const product = await getStorefrontProductById(productId);

  if (!product) {
    notFound();
  }

  const detailImages = product.images.filter((image) => image.kind === "detail");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-24">
        <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
          <nav className="flex flex-wrap items-center gap-2 text-[12px] text-black/46">
            <Link href="/" className="hover:text-black">
              홈
            </Link>
            <span>/</span>
            <Link href="/#new-in" className="hover:text-black">
              상품
            </Link>
            <span>/</span>
            <span className="text-black/74">{product.name}</span>
          </nav>

          <section className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <ProductImageGallery
              productName={product.name}
              images={product.images}
            />
            <ProductPurchasePanel
              productId={product.id}
              productName={product.name}
              description={product.description}
              price={product.price}
              detailImageCount={detailImages.length}
            />
          </section>

          <div className="sticky top-[76px] z-20 mt-14 border-y border-black/8 bg-background/96 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-6 px-1 py-4 text-sm font-medium text-black/58">
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/42">
                  Product Story
                </p>
                <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.04em] text-black">
                  상품 설명
                </h2>
              </div>
              <div className="border border-black/10 bg-white px-6 py-6 text-[15px] leading-8 text-black/72">
                {product.description ? (
                  <p className="whitespace-pre-line">{product.description}</p>
                ) : (
                  <p>등록된 상품 설명이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-black/10 bg-white px-5 py-5">
                <p className="text-sm font-semibold text-black">상품 기본 정보</p>
                <dl className="mt-4 space-y-3 text-sm text-black/62">
                  <div className="flex items-center justify-between gap-4 border-b border-black/6 pb-3">
                    <dt>대표 이미지</dt>
                    <dd>{product.thumbnailUrl ? "등록됨" : "없음"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-black/6 pb-3">
                    <dt>상세 이미지</dt>
                    <dd>{detailImages.length}장</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt>상품 코드</dt>
                    <dd>{product.id.slice(0, 8)}</dd>
                  </div>
                </dl>
              </div>

              <div className="border border-black/10 bg-[#f7f4ee] px-5 py-5">
                <p className="text-sm font-semibold text-black">안내 문구</p>
                <p className="mt-3 text-sm leading-6 text-black/58">
                  무신사형 패션 상세 페이지 흐름을 참고해 이미지 확인과 구매 정보
                  확인이 먼저 오도록 구성했습니다.
                </p>
              </div>
            </div>
          </section>

          <section id="product-images" className="border-b border-black/8 py-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/42">
                  Detail Images
                </p>
                <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.04em] text-black">
                  상세 이미지
                </h2>
              </div>
              <p className="text-sm text-black/48">
                상세 이미지는 아래로 길게 이어지는 한국형 상품 상세 흐름으로
                배치했습니다.
              </p>
            </div>

            {detailImages.length ? (
              <div className="mx-auto mt-8 flex max-w-[980px] flex-col gap-5">
                {detailImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="overflow-hidden border border-black/10 bg-white"
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} 상세 이미지 ${index + 1}`}
                      className="w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 border border-dashed border-black/12 bg-white/60 px-6 py-14 text-center text-sm text-black/48">
                등록된 상세 이미지가 없습니다.
              </div>
            )}
          </section>

          <section
            id="delivery-info"
            className="grid gap-5 py-12 md:grid-cols-2 xl:grid-cols-3"
          >
            <div className="border border-black/10 bg-white px-5 py-5">
              <p className="text-sm font-semibold text-black">배송 안내</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-black/58">
                <li>결제 확인 후 평균 1~3일 이내 출고됩니다.</li>
                <li>도서산간 및 일부 지역은 추가 배송일이 소요될 수 있습니다.</li>
                <li>주문량 증가 시 출고 일정이 지연될 수 있습니다.</li>
              </ul>
            </div>

            <div className="border border-black/10 bg-white px-5 py-5">
              <p className="text-sm font-semibold text-black">교환/반품 안내</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-black/58">
                <li>수령 후 7일 이내 교환/반품 접수가 가능합니다.</li>
                <li>착용 흔적이나 훼손이 있는 경우 접수가 제한될 수 있습니다.</li>
                <li>상세 이미지와 설명을 충분히 확인한 뒤 주문해 주세요.</li>
              </ul>
            </div>

            <div className="border border-black/10 bg-[#f7f4ee] px-5 py-5">
              <p className="text-sm font-semibold text-black">참고 포인트</p>
              <p className="mt-4 text-sm leading-6 text-black/58">
                상단에서는 이미지와 가격 정보가 먼저 보이고, 하단에서는 긴 상세
                콘텐츠를 이어서 보는 한국 패션 쇼핑몰 방식으로 정리했습니다.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
