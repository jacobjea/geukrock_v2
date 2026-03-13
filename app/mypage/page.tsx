/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CopyableMemberId } from "@/components/mypage/CopyableMemberId";
import { OrderTransferButton } from "@/components/mypage/OrderTransferButton";
import { signInWithKakaoAction } from "@/lib/auth-actions";
import { formatDateTime, formatPrice } from "@/lib/admin/format";
import { listOrdersByMemberUserId } from "@/lib/admin/orders";
import { getCurrentMember } from "@/lib/auth";
import {
  getTossRecipientInfo,
} from "@/lib/toss-transfer";
import {
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
} from "@/types/order";
import { PRODUCT_COLOR_LABELS } from "@/types/product";

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
    case "error":
      return "카카오 로그인 중 오류가 발생했습니다.";
    case "invalid":
      return "로그인 요청을 다시 시도해 주세요.";
    default:
      return null;
  }
}

function getLoginDebugMessage(error?: string) {
  if (error === "Configuration") {
    return "카카오 Redirect URI 뿐 아니라 auth.ts 의 Kakao provider 설정도 확인해 주세요. authorization 설정을 덮어쓸 때 url 이 빠지면 Auth.js가 Invalid URL 로 Configuration 오류를 반환할 수 있습니다.";
  }

  return error ?? null;
}

function getPaymentStatusBadgeClass(paymentStatus: "awaiting_deposit" | "confirmed") {
  return paymentStatus === "confirmed"
    ? "border-[#cfe7c8] bg-[#eef8e9] text-[#2f6b2d]"
    : "border-[#f0d7b8] bg-[#fff6ea] text-[#9a5a18]";
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
  const loginDebugMessage = getLoginDebugMessage(params.error);
  const orders = currentMember
    ? await listOrdersByMemberUserId(currentMember.id)
    : [];
  const tossRecipientInfo = getTossRecipientInfo();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-24">
        <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
          <section className="border border-black/10 bg-white px-5 py-6 sm:px-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-black/62">
              My Page
            </p>
            <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-black">
              마이페이지
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-black/72">
              카카오 로그인 회원 정보와 주문 내역을 확인할 수 있습니다.
            </p>
          </section>

          {loginMessage ? (
            <div className="mt-5 border border-[#b7d4ff] bg-[#eef5ff] px-4 py-3 text-sm text-[#1d4f91]">
              {loginMessage}
            </div>
          ) : null}

          {process.env.NODE_ENV !== "production" && loginDebugMessage ? (
            <div className="mt-3 border border-[#f2d2d2] bg-[#fff5f5] px-4 py-3 font-mono text-xs text-[#8a2c2c]">
              {loginDebugMessage}
            </div>
          ) : null}

          {!currentMember ? (
            <section className="mt-8 border border-black/10 bg-white px-5 py-12 text-center">
              <p className="text-base font-medium text-black">
                로그인한 회원만 주문 내역을 확인할 수 있습니다.
              </p>
              <p className="mt-2 text-[15px] leading-7 text-black/72">
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
            <div className="mt-8 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
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
                    {currentMember.kakaoUserId ? (
                      <CopyableMemberId value={currentMember.kakaoUserId} />
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 space-y-2 text-[15px] text-black/72">
                  <p>로그인 방식: 카카오</p>
                  <p>주문 확인: 로그인 상태로 주문 시 자동 연동</p>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href="/"
                    className="inline-flex h-11 items-center justify-center border border-black/12 px-4 text-[15px] hover:bg-black/[0.03]"
                  >
                    쇼핑 계속하기
                  </Link>
                </div>
              </section>

              <section className="border border-black/10 bg-white">
                <div className="border-b border-black/8 px-5 py-4">
                  <h2 className="text-lg font-semibold text-black">내 주문 내역</h2>
                  <p className="mt-1 text-[15px] text-black/72">
                    최근 주문 20건까지 확인할 수 있습니다.
                  </p>
                </div>

                {orders.length ? (
                  <>
                    <div className="divide-y divide-black/8 md:hidden">
                      {orders.map((order) => {
                        const canShowTransferButton =
                          Boolean(tossRecipientInfo) &&
                          order.paymentStatus === "awaiting_deposit" &&
                          order.orderStatus === "received";

                        return (
                          <article key={order.id} className="px-5 py-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-[15px] font-semibold text-black">
                                  {formatDateTime(order.createdAt)}
                                </p>
                                <p className="mt-1 text-[13px] text-black/56">
                                  {order.orderCode}
                                </p>
                              </div>
                              <strong className="shrink-0 text-[1rem] font-semibold text-black">
                                {formatPrice(order.totalAmount)}
                              </strong>
                            </div>

                            <div className="mt-4 space-y-1">
                              {order.productId ? (
                                <Link
                                  href={`/products/${order.productId}`}
                                  className="text-[15px] font-semibold text-black hover:text-[#2f6fed]"
                                >
                                  {order.productName}
                                </Link>
                              ) : (
                                <p className="text-[15px] font-semibold text-black">
                                  {order.productName}
                                </p>
                              )}
                              <p className="text-[14px] leading-6 text-black/68">
                                {order.selectedSize} /{" "}
                                {PRODUCT_COLOR_LABELS[order.selectedColor]} /{" "}
                                {order.quantity}개
                              </p>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span
                                className={[
                                  "inline-flex rounded border px-2 py-1 text-[13px]",
                                  getPaymentStatusBadgeClass(order.paymentStatus),
                                ].join(" ")}
                              >
                                {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus]}
                              </span>
                              <span className="inline-flex rounded border border-[#d9dde3] bg-[#f7f8fa] px-2 py-1 text-[13px] text-[#435167]">
                                {ORDER_STATUS_LABELS[order.orderStatus]}
                              </span>
                            </div>

                            <div className="mt-4">
                              {canShowTransferButton && tossRecipientInfo ? (
                                <OrderTransferButton
                                  amount={order.totalAmount}
                                  bankName={tossRecipientInfo.bankName}
                                  accountNumber={tossRecipientInfo.accountNumber}
                                  accountHolder={tossRecipientInfo.accountHolder}
                                />
                              ) : (
                                <span className="text-[13px] text-black/36">
                                  송금 가능한 주문이 아닙니다.
                                </span>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full border-collapse text-[15px]">
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
                          <th className="border-b border-black/8 px-4 py-3 text-left font-medium">
                            송금
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const canShowTransferButton =
                            Boolean(tossRecipientInfo) &&
                            order.paymentStatus === "awaiting_deposit" &&
                            order.orderStatus === "received";

                          return (
                            <tr key={order.id}>
                              <td className="border-b border-black/8 px-4 py-4 text-black/72">
                                <div className="space-y-1">
                                  <p className="font-medium text-black">
                                    {formatDateTime(order.createdAt)}
                                  </p>
                                  <p className="text-[13px]">{order.orderCode}</p>
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
                                  <p className="text-[13px] text-black/72">
                                    {order.selectedSize} /{" "}
                                    {PRODUCT_COLOR_LABELS[order.selectedColor]} /{" "}
                                    {order.quantity}개
                                  </p>
                                </div>
                              </td>
                              <td className="border-b border-black/8 px-4 py-4 text-black">
                                {formatPrice(order.totalAmount)}
                              </td>
                              <td className="border-b border-black/8 px-4 py-4">
                                <span
                                  className={[
                                    "inline-flex rounded border px-2 py-1 text-[13px]",
                                    getPaymentStatusBadgeClass(order.paymentStatus),
                                  ].join(" ")}
                                >
                                  {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus]}
                                </span>
                              </td>
                              <td className="border-b border-black/8 px-4 py-4">
                                <span className="inline-flex rounded border border-[#d9dde3] bg-[#f7f8fa] px-2 py-1 text-[13px] text-[#435167]">
                                  {ORDER_STATUS_LABELS[order.orderStatus]}
                                </span>
                              </td>
                              <td className="border-b border-black/8 px-4 py-4">
                                {canShowTransferButton && tossRecipientInfo ? (
                                  <OrderTransferButton
                                    amount={order.totalAmount}
                                    bankName={tossRecipientInfo.bankName}
                                    accountNumber={tossRecipientInfo.accountNumber}
                                    accountHolder={tossRecipientInfo.accountHolder}
                                  />
                                ) : (
                                  <span className="text-[13px] text-black/36">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="px-5 py-14 text-center text-[15px] text-black/68">
                    로그인 이후 접수된 주문 내역이 없습니다.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
