import Link from "next/link";

import {
  ORDER_DATE_PRESET_LABELS,
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  type OrderListFilters,
} from "@/types/order";

interface OrderFilterFormProps {
  filters: OrderListFilters;
}

export function OrderFilterForm({ filters }: OrderFilterFormProps) {
  return (
    <form
      method="get"
      className="grid gap-4 border border-[#d9dde3] bg-white px-4 py-4 sm:grid-cols-2 lg:grid-cols-[180px_160px_160px_160px_160px_auto]"
    >
      <div>
        <label
          htmlFor="datePreset"
          className="mb-2 block text-xs font-medium text-[#4b5563]"
        >
          조회 기간
        </label>
        <select
          id="datePreset"
          name="datePreset"
          defaultValue={filters.datePreset}
          className="h-10 w-full rounded border border-[#d9dde3] bg-white px-3 text-sm outline-none focus:border-[#2f6fed]"
        >
          {Object.entries(ORDER_DATE_PRESET_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="startDate"
          className="mb-2 block text-xs font-medium text-[#4b5563]"
        >
          시작일
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={filters.startDate}
          className="h-10 w-full rounded border border-[#d9dde3] bg-white px-3 text-sm outline-none focus:border-[#2f6fed]"
        />
      </div>

      <div>
        <label
          htmlFor="endDate"
          className="mb-2 block text-xs font-medium text-[#4b5563]"
        >
          종료일
        </label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={filters.endDate}
          className="h-10 w-full rounded border border-[#d9dde3] bg-white px-3 text-sm outline-none focus:border-[#2f6fed]"
        />
      </div>

      <div>
        <label
          htmlFor="paymentStatus"
          className="mb-2 block text-xs font-medium text-[#4b5563]"
        >
          입금 상태
        </label>
        <select
          id="paymentStatus"
          name="paymentStatus"
          defaultValue={filters.paymentStatus}
          className="h-10 w-full rounded border border-[#d9dde3] bg-white px-3 text-sm outline-none focus:border-[#2f6fed]"
        >
          <option value="all">전체</option>
          {Object.entries(ORDER_PAYMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="orderStatus"
          className="mb-2 block text-xs font-medium text-[#4b5563]"
        >
          주문 상태
        </label>
        <select
          id="orderStatus"
          name="orderStatus"
          defaultValue={filters.orderStatus}
          className="h-10 w-full rounded border border-[#d9dde3] bg-white px-3 text-sm outline-none focus:border-[#2f6fed]"
        >
          <option value="all">전체</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded border border-[#2f6fed] bg-[#2f6fed] px-4 text-sm font-medium text-white hover:bg-[#255fce]"
        >
          조회
        </button>
        <Link
          href="/admin/orders"
          className="inline-flex h-10 items-center justify-center rounded border border-[#d9dde3] bg-white px-4 text-sm hover:bg-[#f7f8fa]"
        >
          초기화
        </Link>
      </div>
    </form>
  );
}
