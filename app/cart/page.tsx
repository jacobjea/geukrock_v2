import { CartPageContent } from "@/components/cart/CartPageContent";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { signInWithKakaoAction } from "@/lib/auth-actions";
import { getCurrentMember } from "@/lib/auth";
import { getGuestCartSnapshotFromRequest } from "@/lib/cart";

export const dynamic = "force-dynamic";

function getLoginMessage(login?: string, error?: string) {
  if (error === "Configuration") {
    return "카카오 로그인 설정에 문제가 있습니다. 인증 설정을 다시 확인해 주세요.";
  }

  if (error) {
    return "카카오 로그인 중 오류가 발생했습니다.";
  }

  switch (login) {
    case "success":
      return "카카오 로그인이 완료되었습니다.";
    case "required":
      return "장바구니는 로그인한 회원만 사용할 수 있습니다.";
    default:
      return null;
  }
}

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
    error?: string;
    login?: string;
    status?: string;
  }>;
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const [params, currentMember] = await Promise.all([
    searchParams,
    getCurrentMember(),
  ]);
  const cart = currentMember ? await getGuestCartSnapshotFromRequest() : null;
  const loginMessage = getLoginMessage(params.login, params.error);
  const statusMessage = getStatusMessage(params.status);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-24">
        <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
          <section className="border border-black/10 bg-white px-5 py-6 sm:px-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-black/62">
              Cart
            </p>
            <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-black">
              장바구니
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-black/72">
              로그인 후 담은 상품을 확인하고 수량을 조절할 수 있습니다. 선택한
              상품은 이 페이지에서 바로 정리할 수 있습니다.
            </p>
          </section>

          {loginMessage ? (
            <div className="mt-5 border border-[#b7d4ff] bg-[#eef5ff] px-4 py-3 text-sm text-[#1d4f91]">
              {loginMessage}
            </div>
          ) : null}

          {!currentMember ? (
            <section className="mt-8 border border-black/10 bg-white px-5 py-12 text-center">
              <p className="text-base font-medium text-black">
                로그인한 회원만 장바구니를 사용할 수 있습니다.
              </p>
              <p className="mt-2 text-[15px] leading-7 text-black/72">
                카카오 로그인 후 담아둔 상품을 확인하고 수량을 조절할 수 있습니다.
              </p>
              <form action={signInWithKakaoAction} className="mt-6">
                <input type="hidden" name="returnTo" value="/cart" />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded border border-[#f2d667] bg-[#fee500] px-5 text-sm font-medium text-[#3b1e1e] hover:bg-[#f8dc3c]"
                >
                  카카오 로그인
                </button>
              </form>
            </section>
          ) : (
            <CartPageContent
              initialCart={cart}
              initialStatusMessage={statusMessage}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
