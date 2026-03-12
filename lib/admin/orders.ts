import "server-only";

import { query } from "@/lib/db";
import { ensureProductSchema } from "@/lib/admin/products";
import {
  normalizeProductColors,
  normalizeProductSizes,
  type ProductColor,
  type ProductSize,
} from "@/types/product";
import type {
  CreateOrderInput,
  CreatedOrderResult,
  OrderBankAccountInfo,
  OrderDatePreset,
  OrderListFilters,
  OrderListItem,
  OrderPaymentStatus,
  OrderPaymentStatusFilter,
  OrderStatus,
  OrderStatusFilter,
  PaginatedOrders,
} from "@/types/order";

export const ORDERS_PAGE_SIZE = 10;

export const ADMIN_ORDER_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  member_user_id UUID,
  product_name TEXT NOT NULL,
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selected_size TEXT NOT NULL,
  selected_color TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  depositor_name TEXT NOT NULL,
  note TEXT,
  payment_status TEXT NOT NULL DEFAULT 'awaiting_deposit'
    CHECK (payment_status IN ('awaiting_deposit', 'confirmed')),
  order_status TEXT NOT NULL DEFAULT 'received'
    CHECK (order_status IN ('received', 'canceled')),
  payment_confirmed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS member_user_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'member_users'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_member_user_id_member_users_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_member_user_id_member_users_fkey
      FOREIGN KEY (member_user_id) REFERENCES member_users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON orders (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_order_status
  ON orders (order_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_member_user_id
  ON orders (member_user_id, created_at DESC);
`;

type ProductOrderRow = {
  id: string;
  name: string;
  price: number;
  sizeOptions: string[] | null;
  colorOptions: string[] | null;
};

type OrderRow = {
  id: string;
  orderCode: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  totalAmount: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  customerName: string;
  customerPhone: string;
  depositorName: string;
  note: string | null;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  paymentConfirmedAt: Date | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface ListOrdersInput {
  page?: number;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  orderStatus?: string;
}

let schemaReady: Promise<void> | null = null;

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getKstDateString(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function addDays(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().slice(0, 10);
}

function normalizeDatePreset(value?: string): OrderDatePreset {
  switch (value) {
    case "today":
    case "7days":
    case "30days":
    case "custom":
      return value;
    default:
      return "all";
  }
}

function normalizePaymentStatus(value?: string): OrderPaymentStatusFilter {
  return value === "awaiting_deposit" || value === "confirmed" ? value : "all";
}

function normalizeOrderStatus(value?: string): OrderStatusFilter {
  return value === "received" || value === "canceled" ? value : "all";
}

function normalizeListFilters(input: ListOrdersInput): OrderListFilters {
  const datePreset = normalizeDatePreset(input.datePreset);
  const rawStartDate = typeof input.startDate === "string" ? input.startDate : "";
  const rawEndDate = typeof input.endDate === "string" ? input.endDate : "";
  const paymentStatus = normalizePaymentStatus(input.paymentStatus);
  const orderStatus = normalizeOrderStatus(input.orderStatus);

  let startDate = isIsoDate(rawStartDate) ? rawStartDate : "";
  let endDate = isIsoDate(rawEndDate) ? rawEndDate : "";

  if (datePreset === "today") {
    startDate = getKstDateString(new Date());
    endDate = startDate;
  }

  if (datePreset === "7days") {
    endDate = getKstDateString(new Date());
    startDate = addDays(endDate, -6);
  }

  if (datePreset === "30days") {
    endDate = getKstDateString(new Date());
    startDate = addDays(endDate, -29);
  }

  if (datePreset === "custom" && startDate && endDate && startDate > endDate) {
    const previousStartDate = startDate;
    startDate = endDate;
    endDate = previousStartDate;
  }

  if (datePreset === "all") {
    startDate = "";
    endDate = "";
  }

  return {
    datePreset,
    startDate,
    endDate,
    paymentStatus,
    orderStatus,
  };
}

function toOrderListItem(row: OrderRow): OrderListItem {
  return {
    id: row.id,
    orderCode: row.orderCode,
    productId: row.productId,
    productName: row.productName,
    unitPrice: Number(row.unitPrice),
    totalAmount: Number(row.totalAmount),
    quantity: Number(row.quantity),
    selectedSize: normalizeProductSizes([row.selectedSize])[0] as ProductSize,
    selectedColor: normalizeProductColors([row.selectedColor])[0] as ProductColor,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    depositorName: row.depositorName,
    note: row.note,
    paymentStatus: row.paymentStatus,
    orderStatus: row.orderStatus,
    paymentConfirmedAt: row.paymentConfirmedAt?.toISOString() ?? null,
    canceledAt: row.canceledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function getWhereClause(filters: OrderListFilters) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.startDate) {
    params.push(filters.startDate);
    clauses.push(
      `DATE(created_at AT TIME ZONE 'Asia/Seoul') >= $${params.length}::date`,
    );
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    clauses.push(
      `DATE(created_at AT TIME ZONE 'Asia/Seoul') <= $${params.length}::date`,
    );
  }

  if (filters.paymentStatus !== "all") {
    params.push(filters.paymentStatus);
    clauses.push(`payment_status = $${params.length}`);
  }

  if (filters.orderStatus !== "all") {
    params.push(filters.orderStatus);
    clauses.push(`order_status = $${params.length}`);
  }

  if (!clauses.length) {
    return {
      params,
      whereSql: "",
    };
  }

  return {
    params,
    whereSql: `WHERE ${clauses.join(" AND ")}`,
  };
}

function generateOrderCode() {
  const date = getKstDateString(new Date()).replaceAll("-", "");
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `GR-${date}-${suffix}`;
}

export function getOrderBankAccountInfo(): OrderBankAccountInfo {
  return {
    bankName: process.env.ORDER_BANK_NAME?.trim() || "은행 정보 미설정",
    accountNumber:
      process.env.ORDER_ACCOUNT_NUMBER?.trim() || "계좌번호를 설정해 주세요",
    accountHolder:
      process.env.ORDER_ACCOUNT_HOLDER?.trim() || "예금주 정보를 설정해 주세요",
  };
}

export async function ensureOrderSchema() {
  if (!schemaReady) {
    schemaReady = ensureProductSchema()
      .then(() => query(ADMIN_ORDER_SCHEMA_SQL))
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }

  return schemaReady;
}

export function buildAdminOrdersPageHref(
  queryValues: Partial<{
    page: number | string;
    datePreset: OrderDatePreset;
    startDate: string;
    endDate: string;
    paymentStatus: OrderPaymentStatusFilter;
    orderStatus: OrderStatusFilter;
    status: string;
  }> = {},
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(queryValues)) {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (key === "page" && String(value) === "1")
    ) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/orders?${queryString}` : "/admin/orders";
}

export async function createOrderRecord(
  input: CreateOrderInput,
): Promise<CreatedOrderResult> {
  await ensureOrderSchema();

  const productResult = await query<ProductOrderRow>(
    `
      SELECT
        id,
        name,
        price,
        size_options AS "sizeOptions",
        color_options AS "colorOptions"
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [input.productId],
  );
  const product = productResult.rows[0];

  if (!product) {
    throw new Error("주문할 상품을 찾을 수 없습니다.");
  }

  const sizeOptions = normalizeProductSizes(product.sizeOptions);
  const colorOptions = normalizeProductColors(product.colorOptions);

  if (!sizeOptions.includes(input.selectedSize)) {
    throw new Error("선택한 사이즈를 다시 확인해 주세요.");
  }

  if (!colorOptions.includes(input.selectedColor)) {
    throw new Error("선택한 색상을 다시 확인해 주세요.");
  }

  const orderCode = generateOrderCode();
  const totalAmount = Number(product.price) * input.quantity;
  const bankInfo = getOrderBankAccountInfo();
  const insertResult = await query<{ id: string }>(
    `
      INSERT INTO orders (
        order_code,
        product_id,
        member_user_id,
        product_name,
        unit_price,
        total_amount,
        quantity,
        selected_size,
        selected_color,
        customer_name,
        customer_phone,
        depositor_name,
        note
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING id
    `,
    [
      orderCode,
      product.id,
      input.memberUserId ?? null,
      product.name,
      Number(product.price),
      totalAmount,
      input.quantity,
      input.selectedSize,
      input.selectedColor,
      input.customerName,
      input.customerPhone,
      input.depositorName,
      input.note,
    ],
  );

  return {
    orderId: insertResult.rows[0].id,
    orderCode,
    productId: product.id,
    totalAmount,
    bankInfo,
  };
}

export async function listOrdersByMemberUserId(
  memberUserId: string,
  limit = 20,
) {
  await ensureOrderSchema();

  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 20;
  const result = await query<OrderRow>(
    `
      SELECT
        id,
        order_code AS "orderCode",
        product_id AS "productId",
        product_name AS "productName",
        unit_price AS "unitPrice",
        total_amount AS "totalAmount",
        quantity,
        selected_size AS "selectedSize",
        selected_color AS "selectedColor",
        customer_name AS "customerName",
        customer_phone AS "customerPhone",
        depositor_name AS "depositorName",
        note,
        payment_status AS "paymentStatus",
        order_status AS "orderStatus",
        payment_confirmed_at AS "paymentConfirmedAt",
        canceled_at AS "canceledAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM orders
      WHERE member_user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT $2
    `,
    [memberUserId, safeLimit],
  );

  return result.rows.map(toOrderListItem);
}

export async function listOrders(
  input: ListOrdersInput = {},
): Promise<PaginatedOrders> {
  await ensureOrderSchema();

  const filters = normalizeListFilters(input);
  const page = Number.isFinite(input.page) && Number(input.page) > 0
    ? Math.floor(Number(input.page))
    : 1;
  const { params, whereSql } = getWhereClause(filters);
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM orders ${whereSql}`,
    params,
  );
  const totalItems = Number(countResult.rows[0]?.count ?? "0");
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / ORDERS_PAGE_SIZE) : 1;
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * ORDERS_PAGE_SIZE;
  const itemParams = [...params, ORDERS_PAGE_SIZE, offset];
  const itemsResult = await query<OrderRow>(
    `
      SELECT
        id,
        order_code AS "orderCode",
        product_id AS "productId",
        product_name AS "productName",
        unit_price AS "unitPrice",
        total_amount AS "totalAmount",
        quantity,
        selected_size AS "selectedSize",
        selected_color AS "selectedColor",
        customer_name AS "customerName",
        customer_phone AS "customerPhone",
        depositor_name AS "depositorName",
        note,
        payment_status AS "paymentStatus",
        order_status AS "orderStatus",
        payment_confirmed_at AS "paymentConfirmedAt",
        canceled_at AS "canceledAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM orders
      ${whereSql}
      ORDER BY created_at DESC, id DESC
      LIMIT $${itemParams.length - 1}
      OFFSET $${itemParams.length}
    `,
    itemParams,
  );

  return {
    items: itemsResult.rows.map(toOrderListItem),
    page: currentPage,
    pageSize: ORDERS_PAGE_SIZE,
    totalItems,
    totalPages,
    filters,
  };
}

export async function updateOrderPaymentStatus(
  orderId: string,
  nextStatus: OrderPaymentStatus,
) {
  await ensureOrderSchema();

  const result = await query<{ id: string }>(
    `
      UPDATE orders
      SET
        payment_status = $2,
        payment_confirmed_at = CASE
          WHEN $2 = 'confirmed' THEN NOW()
          ELSE NULL
        END,
        updated_at = NOW()
      WHERE id = $1
        AND order_status <> 'canceled'
      RETURNING id
    `,
    [orderId, nextStatus],
  );

  return Boolean(result.rows[0]);
}

export async function cancelOrderRecord(orderId: string) {
  await ensureOrderSchema();

  const result = await query<{ id: string }>(
    `
      UPDATE orders
      SET
        order_status = 'canceled',
        canceled_at = COALESCE(canceled_at, NOW()),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [orderId],
  );

  return Boolean(result.rows[0]);
}
