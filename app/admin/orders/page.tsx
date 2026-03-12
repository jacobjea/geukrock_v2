import { Pagination } from "@/components/admin/Pagination";
import { OrderFilterForm } from "@/components/admin/OrderFilterForm";
import { OrderListTable } from "@/components/admin/OrderListTable";
import {
  buildAdminOrdersPageHref,
  listOrders,
} from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

function getStatusMessage(status?: string) {
  switch (status) {
    case "deposit-confirmed":
      return "입금 확인 처리가 완료되었습니다.";
    case "deposit-reset":
      return "입금 확인이 해제되었습니다.";
    case "order-canceled":
      return "주문이 취소되었습니다.";
    case "order-action-error":
      return "주문 상태를 처리하지 못했습니다. 다시 확인해 주세요.";
    default:
      return null;
  }
}

interface AdminOrdersPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    datePreset?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    orderStatus?: string;
  }>;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const orderPage = await listOrders({
    page: Number(params.page ?? "1"),
    datePreset: params.datePreset,
    startDate: params.startDate,
    endDate: params.endDate,
    paymentStatus: params.paymentStatus,
    orderStatus: params.orderStatus,
  });
  const statusMessage = getStatusMessage(params.status);
  const paginationQuery = {
    datePreset: orderPage.filters.datePreset,
    startDate: orderPage.filters.startDate,
    endDate: orderPage.filters.endDate,
    paymentStatus: orderPage.filters.paymentStatus,
    orderStatus: orderPage.filters.orderStatus,
  };
  const returnTo = buildAdminOrdersPageHref({
    page: orderPage.page,
    ...paginationQuery,
  });

  return (
    <div className="space-y-6">
      <section className="border border-[#d9dde3] bg-white">
        <div className="flex flex-col items-start gap-3 border-b border-[#e5e7eb] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="break-keep text-lg font-bold sm:text-xl">주문 접수 목록</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              주문 접수 내역을 조회하고 입금 확인 여부와 주문 취소를 직접 관리할 수
              있습니다.
            </p>
          </div>
        </div>

        <div className="grid gap-2 px-4 py-4 text-sm text-[#4b5563] sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2 sm:px-5">
          <span>전체 주문 수: {orderPage.totalItems}건</span>
          <span>페이지당 노출 수: {orderPage.pageSize}건</span>
          <span>
            현재 페이지: {orderPage.page} / {orderPage.totalPages}
          </span>
        </div>
      </section>

      <OrderFilterForm filters={orderPage.filters} />

      {statusMessage ? (
        <div className="border border-[#b7d4ff] bg-[#eef5ff] px-4 py-3 text-sm text-[#1d4f91]">
          {statusMessage}
        </div>
      ) : null}

      <OrderListTable items={orderPage.items} returnTo={returnTo} />

      <div className="flex items-center justify-center">
        <Pagination
          currentPage={orderPage.page}
          totalPages={orderPage.totalPages}
          basePath="/admin/orders"
          query={paginationQuery}
          ariaLabel="주문 목록 페이지 이동"
        />
      </div>
    </div>
  );
}
