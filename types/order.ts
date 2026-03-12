import type { ProductColor, ProductSize } from "./product";

export const ORDER_PAYMENT_STATUSES = [
  "awaiting_deposit",
  "confirmed",
] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_PAYMENT_STATUS_FILTERS = [
  "all",
  ...ORDER_PAYMENT_STATUSES,
] as const;
export type OrderPaymentStatusFilter =
  (typeof ORDER_PAYMENT_STATUS_FILTERS)[number];

export const ORDER_STATUSES = ["received", "canceled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_FILTERS = ["all", ...ORDER_STATUSES] as const;
export type OrderStatusFilter = (typeof ORDER_STATUS_FILTERS)[number];

export const ORDER_DATE_PRESETS = ["all", "today", "7days", "30days", "custom"] as const;
export type OrderDatePreset = (typeof ORDER_DATE_PRESETS)[number];

export const ORDER_PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  awaiting_deposit: "입금 대기",
  confirmed: "입금 확인",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "주문 접수",
  canceled: "주문 취소",
};

export const ORDER_DATE_PRESET_LABELS: Record<OrderDatePreset, string> = {
  all: "전체",
  today: "오늘",
  "7days": "최근 7일",
  "30days": "최근 30일",
  custom: "직접 입력",
};

export interface OrderBankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface CreateOrderInput {
  productId: string;
  memberUserId?: string | null;
  customerName: string;
  customerPhone: string;
  depositorName: string;
  note: string | null;
  quantity: number;
  selectedSize: ProductSize;
  selectedColor: ProductColor;
}

export interface CreatedOrderResult {
  orderId: string;
  orderCode: string;
  productId: string;
  totalAmount: number;
  bankInfo: OrderBankAccountInfo;
}

export interface OrderListItem {
  id: string;
  orderCode: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  totalAmount: number;
  quantity: number;
  selectedSize: ProductSize;
  selectedColor: ProductColor;
  customerName: string;
  customerPhone: string;
  depositorName: string;
  note: string | null;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  paymentConfirmedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListFilters {
  datePreset: OrderDatePreset;
  startDate: string;
  endDate: string;
  paymentStatus: OrderPaymentStatusFilter;
  orderStatus: OrderStatusFilter;
}

export interface PaginatedOrders {
  items: OrderListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  filters: OrderListFilters;
}

export type OrderFormField =
  | "customerName"
  | "customerPhone"
  | "depositorName"
  | "quantity"
  | "size"
  | "color";

export interface OrderFormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors: Partial<Record<OrderFormField, string>>;
  orderCode?: string;
  totalAmount?: number;
  bankInfo?: OrderBankAccountInfo;
}

export const initialOrderFormState: OrderFormState = {
  status: "idle",
  fieldErrors: {},
};
