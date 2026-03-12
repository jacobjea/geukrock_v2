/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { signInWithKakaoAction, signOutAction } from "@/lib/auth-actions";
import { formatDateTime, formatPrice } from "@/lib/admin/format";
import { listOrdersByMemberUserId } from "@/lib/admin/orders";
import { getCurrentMember } from "@/lib/auth";
import {
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
} from "@/types/order";
import { PRODUCT_COLOR_LABELS } from "@/types/product";

export const dynamic = "force-dynamic";

function getLoginMessage(login?: string, error?: string) {
  if (error) {
    return "카카오 로그인 중 오류가 발생했습니다.";
  }

  switch (login) {
    case "success":
      return "카카오 로그인이 완료되었습니다.";
    case "error":
      return "카카오 로그인 중 오류가 발생했습니다.";
    case "invalid":
      return "로그인 요청을 다시 시도해 주세요.";
    default:
      return null;
  }
}

interface MyPageProps {
  searchParams: Promise<{
    login?: string;
    error?: string;
  }>;
}

export default async function MyPage({ searchParams }: MyPageProps) {
  const [params, currentMember] = await Promise.all([
    searchParams,
    getCurrentMember(),
  ]);
  const loginMessage = getLoginMessage(params.login, params.error);
  const orders = currentMember
    ? await listOrdersByMemberUserId(currentMember.id)
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 pb-20 pt-8 sm:px-8 lg:px-12">
        <section className="border border-black/10 bg-white px-5 py-6 sm:px-7">
          <h1 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-black">
            마이페이지
          </h1>
          <p className="mt-2 text-sm text-black/58">
            카카오 로그인 회원 정보와 주문 내역을 확인할 수 있습니다.
          </p>
        </section>

        {loginMessage ? (
          <div className="mt-5 border border-[#b7d4ff] bg-[#eef5ff] px-4 py-3 text-sm text-[#1d4f91]">
            {loginMessage}
          </div>
        ) : null}

        {process.env.NODE_ENV !== "production" && params.error ? (
          <div className="mt-3 border border-[#f2d2d2] bg-[#fff5f5] px-4 py-3 font-mono text-xs text-[#8a2c2c]">
            {params.error}
          </div>
        ) : null}

        {!currentMember ? (
          <section className="mt-6 border border-black/10 bg-white px-5 py-12 text-center">
            <p className="text-base font-medium text-black">
              로그인한 회원만 주문 내역을 확인할 수 있습니다.
            </p>
            <p className="mt-2 text-sm text-black/58">
              카카오 로그인 후 주문하면 마이페이지에서 접수 내역을 바로 볼 수 있습니다.
            </p>
            <form action={signInWithKakaoAction} className="mt-6">
              <input type="hidden" name="returnTo" value="/mypage" />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded border border-[#f2d667] bg-[#fee500] px-5 text-sm font-medium text-[#3b1e1e] hover:bg-[#f8dc3c]"
              >
                카카오 로그인
              </button>
            </form>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <section className="border border-black/10 bg-white px-5 py-6">
              <div className="flex items-center gap-4">
                {currentMember.profileImageUrl ? (
                  <img
                    src={currentMember.profileImageUrl}
                    alt={currentMember.nickname}
                    className="h-16 w-16 rounded-full border border-black/10 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-[#f4f5f7] text-lg font-semibold text-black/58">
                    {currentMember.nickname.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-black">
                    {currentMember.nickname}
                  </p>
                  <p className="mt-1 break-all text-sm text-black/52">
                    {currentMember.email || "이메일 정보 없음"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm text-black/58">
                <p>로그인 방식: 카카오</p>
                <p>주문 확인: 로그인 상태로 주문 시 자동 연동</p>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/"
                  className="inline-flex h-10 items-center justify-center border border-black/12 px-4 text-sm hover:bg-black/[0.03]"
                >
                  쇼핑 계속하기
                </Link>
                <form action={signOutAction}>
                  <input type="hidden" name="returnTo" value="/" />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center border border-black/12 px-4 text-sm hover:bg-black/[0.03]"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            </section>

            <section className="border border-black/10 bg-white">
              <div className="border-b border-black/8 px-5 py-4">
                <h2 className="text-lg font-semibold text-black">내 주문 내역</h2>
                <p className="mt-1 text-sm text-black/58">
                  최근 주문 20건까지 확인할 수 있습니다.
                </p>
              </div>

              {orders.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-[#f7f8fa] text-[#374151]">
                      <tr>
                        <th className="border-b border-black/8 px-4 py-3 text-left font-medium">
                          주문일시
                        </th>
                        <th className="border-b border-black/8 px-4 py-3 text-left font-medium">
                          상품
                        </th>
                        <th className="border-b border-black/8 px-4 py-3 text-left font-medium">
                          금액
                        </th>
                        <th className="border-b border-black/8 px-4 py-3 text-left font-medium">
                          입금 상태
                        </th>
                        <th className="border-b border-black/8 px-4 py-3 text-left font-medium">
                          주문 상태
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="border-b border-black/8 px-4 py-4 text-black/58">
                            <div className="space-y-1">
                              <p className="font-medium text-black">
                                {formatDateTime(order.createdAt)}
                              </p>
                              <p className="text-xs">{order.orderCode}</p>
                            </div>
                          </td>
                          <td className="border-b border-black/8 px-4 py-4">
                            <div className="space-y-1">
                              {order.productId ? (
                                <Link
                                  href={`/products/${order.productId}`}
                                  className="font-medium text-black hover:text-[#2f6fed]"
                                >
                                  {order.productName}
                                </Link>
                              ) : (
                                <p className="font-medium text-black">{order.productName}</p>
                              )}
                              <p className="text-xs text-black/58">
                                {order.selectedSize} / {PRODUCT_COLOR_LABELS[order.selectedColor]} /{" "}
                                {order.quantity}개
                              </p>
                            </div>
                          </td>
                          <td className="border-b border-black/8 px-4 py-4 text-black">
                            {formatPrice(order.totalAmount)}
                          </td>
                          <td className="border-b border-black/8 px-4 py-4">
                            <span className="inline-flex rounded border border-[#d9dde3] bg-[#f7f8fa] px-2 py-1 text-xs text-[#435167]">
                              {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus]}
                            </span>
                          </td>
                          <td className="border-b border-black/8 px-4 py-4">
                            <span className="inline-flex rounded border border-[#d9dde3] bg-[#f7f8fa] px-2 py-1 text-xs text-[#435167]">
                              {ORDER_STATUS_LABELS[order.orderStatus]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 py-14 text-center text-sm text-black/52">
                  로그인 이후 접수된 주문 내역이 없습니다.
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
