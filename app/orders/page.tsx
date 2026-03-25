import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CartOrderCheckoutPage } from "@/components/order/CartOrderCheckoutPage";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { OrderCheckoutPage } from "@/components/order/OrderCheckoutPage";
import { getCurrentMember } from "@/lib/auth";
import { getGuestCartSnapshotFromRequest } from "@/lib/cart";
import { getOrderCheckoutSessionFromRequest } from "@/lib/order-checkout-session";
import {
  formatSalePeriod,
  getProductSaleStatus,
} from "@/lib/product-sale";
import { getCachedStorefrontProductById } from "@/lib/storefront-cache";
import { getTossRecipientInfo } from "@/lib/toss-transfer";
import type { CurrentMember } from "@/types/member";

export const dynamic = "force-dynamic";

interface OrdersLayoutProps {
  currentMember: CurrentMember;
  breadcrumbItems: Array<{
    href?: string;
    label: string;
  }>;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function OrdersLayout({
  currentMember,
  breadcrumbItems,
  eyebrow,
  title,
  description,
  children,
}: OrdersLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentMember={currentMember} />
      <main className="pb-24">
        <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
          <nav className="flex flex-wrap items-center gap-2 text-[13px] text-black/62">
            {breadcrumbItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="contents">
                {index > 0 ? <span>/</span> : null}
                {item.href ? (
                  <Link href={item.href} prefetch={false} className="hover:text-black">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-black/84">{item.label}</span>
                )}
              </div>
            ))}
          </nav>

          <section className="mt-6 border border-black/10 bg-white px-5 py-6 sm:px-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-black/62">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-black">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-black/72">
              {description}
            </p>
          </section>

          <div className="mt-8">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default async function OrdersPage() {
  const [currentMember, checkoutSession, tossRecipientInfo] = await Promise.all([
    getCurrentMember(),
    getOrderCheckoutSessionFromRequest(),
    getTossRecipientInfo(),
  ]);

  if (!currentMember) {
    if (checkoutSession?.mode === "direct") {
      redirect(`/products/${checkoutSession.productId}`);
    }

    redirect("/cart?login=required");
  }

  if (!checkoutSession || checkoutSession.mode === "cart") {
    const fallbackCart = !checkoutSession
      ? await getGuestCartSnapshotFromRequest()
      : null;
    const cart = checkoutSession?.mode === "cart"
      ? checkoutSession.cart
      : fallbackCart
        ? {
            items: fallbackCart.items,
            totalItems: fallbackCart.totalItems,
            subtotal: fallbackCart.subtotal,
          }
        : null;

    return (
      <OrdersLayout
        currentMember={currentMember}
        breadcrumbItems={[
          { href: "/", label: "홈" },
          { href: "/cart", label: "장바구니" },
          { label: "주문서" },
        ]}
        eyebrow="Order Checkout"
        title="주문하기"
        description="선택한 상품을 확인하고 주문자 정보를 입력해 주문을 접수할 수 있습니다."
      >
        {!cart?.items.length ? (
          <section className="border border-black/10 bg-white px-5 py-12 text-center">
            <p className="text-[1.05rem] font-semibold text-black">
              장바구니에 주문할 상품이 없습니다.
            </p>
            <p className="mt-3 text-[15px] leading-7 text-black/72">
              장바구니에서 상품을 담은 뒤 주문을 진행해 주세요.
            </p>
            <Link
              href="/cart"
              className="mt-6 inline-flex h-12 items-center justify-center border border-black/12 px-6 text-[15px] font-medium text-black hover:bg-black/[0.03]"
            >
              장바구니로 돌아가기
            </Link>
          </section>
        ) : (
          <CartOrderCheckoutPage
            cart={cart}
            currentMemberName={currentMember.nickname}
            isSignedIn
            transferRecipientInfo={tossRecipientInfo}
          />
        )}
      </OrdersLayout>
    );
  }

  const product = await getCachedStorefrontProductById(checkoutSession.productId);

  if (!product) {
    notFound();
  }

  const saleStatus = getProductSaleStatus(product);
  const availableItems = checkoutSession.lineItems.filter(
    (item) =>
      product.sizeOptions.includes(item.selectedSize) &&
      product.colorOptions.includes(item.selectedColor),
  );
  const lineItemsError =
    availableItems.length !== checkoutSession.lineItems.length
      ? "현재 판매 중인 옵션 정보와 맞지 않습니다. 상세 페이지에서 다시 선택해 주세요."
      : !saleStatus.canOrder
        ? saleStatus.state === "upcoming"
          ? "아직 주문 접수 기간이 시작되지 않았습니다."
          : "주문 접수 기간이 종료된 상품입니다."
        : null;

  return (
    <OrdersLayout
      currentMember={currentMember}
      breadcrumbItems={[
        { href: "/", label: "홈" },
        { href: "/#new-in", label: "상품" },
        { href: `/products/${product.id}`, label: product.name },
        { label: "주문서" },
      ]}
      eyebrow="Order Checkout"
      title="주문하기"
      description="선택한 상품을 확인하고 주문자 정보를 입력해 주문을 접수할 수 있습니다."
    >
      {lineItemsError ? (
        <section className="border border-black/10 bg-white px-5 py-12 text-center">
          <p className="text-[1.05rem] font-semibold text-black">
            {!saleStatus.canOrder
              ? "현재는 주문을 접수할 수 없습니다."
              : "선택한 주문 옵션을 확인할 수 없습니다."}
          </p>
          <p className="mt-3 text-[15px] leading-7 text-black/72">
            {lineItemsError}
          </p>
          {product.saleMode === "period" ? (
            <p className="mt-2 text-[14px] leading-6 text-black/60">
              설정된 판매 기간:{" "}
              {formatSalePeriod(product.saleStartAt, product.saleEndAt)}
            </p>
          ) : null}
          <Link
            href={`/products/${product.id}`}
            className="mt-6 inline-flex h-12 items-center justify-center border border-black/12 px-6 text-[15px] font-medium text-black hover:bg-black/[0.03]"
          >
            상품 페이지로 돌아가기
          </Link>
        </section>
      ) : (
        <OrderCheckoutPage
          productId={product.id}
          productName={product.name}
          productDescription={product.description}
          productThumbnailUrl={product.thumbnailUrl}
          productPrice={product.price}
          selectedItems={availableItems}
          currentMemberName={currentMember.nickname}
          productHref={`/products/${product.id}`}
          transferRecipientInfo={tossRecipientInfo}
        />
      )}
    </OrdersLayout>
  );
}
