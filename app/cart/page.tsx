import { CartPageContent } from "@/components/cart/CartPageContent";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getGuestCartSnapshotFromRequest } from "@/lib/cart";

export const dynamic = "force-dynamic";

function getStatusMessage(status?: string) {
  switch (status) {
    case "added":
      return "상품을 장바구니에 담았습니다.";
    case "updated":
      return "장바구니 수량을 변경했습니다.";
    case "removed":
      return "상품을 장바구니에서 제거했습니다.";
    case "emptied":
      return "장바구니가 비워졌습니다.";
    default:
      return null;
  }
}

interface CartPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const params = await searchParams;
  const cart = await getGuestCartSnapshotFromRequest();
  const statusMessage = getStatusMessage(params.status);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-24">
        <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
          <section className="border border-black/10 bg-white px-5 py-6 sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/42">
              Guest Cart
            </p>
            <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-black">
              장바구니
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-6 text-black/58">
              비회원 장바구니는 최근 사용 기준 30일 동안 유지됩니다. 수량 변경과
              삭제는 이 페이지에서 바로 반영됩니다.
            </p>
          </section>
          <CartPageContent
            initialCart={cart}
            initialStatusMessage={statusMessage}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
