import "server-only";

import { cookies } from "next/headers";
import type { PoolClient } from "pg";

import { ensureProductSchema } from "@/lib/admin/products";
import { query, withTransaction } from "@/lib/db";
import {
  isProductColor,
  isProductSize,
} from "@/types/product";
import type {
  GuestCartItem,
  GuestCartSelectionInput,
  GuestCartSnapshot,
} from "@/types/cart";

export const GUEST_CART_COOKIE_NAME = "guestCartId";
export const GUEST_CART_TTL_DAYS = 30;
export const GUEST_CART_TTL_SECONDS = GUEST_CART_TTL_DAYS * 24 * 60 * 60;

export const GUEST_CART_SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS guest_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guest_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES guest_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  selected_size TEXT NOT NULL DEFAULT 'M',
  selected_color TEXT NOT NULL DEFAULT 'BLACK',
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guest_cart_items
  ADD COLUMN IF NOT EXISTS selected_size TEXT;

ALTER TABLE guest_cart_items
  ADD COLUMN IF NOT EXISTS selected_color TEXT;

UPDATE guest_cart_items
SET selected_size = 'M'
WHERE selected_size IS NULL;

UPDATE guest_cart_items
SET selected_color = 'BLACK'
WHERE selected_color IS NULL;

ALTER TABLE guest_cart_items
  ALTER COLUMN selected_size SET NOT NULL;

ALTER TABLE guest_cart_items
  ALTER COLUMN selected_color SET NOT NULL;

ALTER TABLE guest_cart_items
  ALTER COLUMN selected_size SET DEFAULT 'M';

ALTER TABLE guest_cart_items
  ALTER COLUMN selected_color SET DEFAULT 'BLACK';

DROP INDEX IF EXISTS idx_guest_cart_items_cart_product;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_cart_items_cart_product_option
  ON guest_cart_items (cart_id, product_id, selected_size, selected_color);

CREATE INDEX IF NOT EXISTS idx_guest_carts_expires_at
  ON guest_carts (expires_at);

CREATE INDEX IF NOT EXISTS idx_guest_carts_last_accessed_at
  ON guest_carts (last_accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_cart_items_cart_id
  ON guest_cart_items (cart_id);
`;

type GuestCartRow = {
  id: string;
  expiresAt: Date;
  lastAccessedAt: Date;
};

type GuestCartItemRow = {
  itemId: string;
  productId: string;
  productName: string;
  productDescription: string | null;
  selectedSize: string;
  selectedColor: string;
  price: number;
  quantity: number;
  thumbnailUrl: string | null;
  thumbnailPathname: string | null;
};

let cartSchemaReady: Promise<void> | null = null;

function clampCartQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(99, Math.max(1, Math.floor(value)));
}

function getValidProductSize(value: string) {
  if (!isProductSize(value)) {
    throw new Error("선택 가능한 사이즈를 확인해 주세요.");
  }

  return value;
}

function getValidProductColor(value: string) {
  if (!isProductColor(value)) {
    throw new Error("선택 가능한 색상을 확인해 주세요.");
  }

  return value;
}

function getGuestCartCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_CART_TTL_SECONDS,
  };
}

function getStorefrontBlobUrl(pathname: string | null) {
  if (!pathname) {
    return null;
  }

  return `/api/admin/blob?pathname=${encodeURIComponent(pathname)}`;
}

function toGuestCartItem(row: GuestCartItemRow): GuestCartItem {
  return {
    itemId: row.itemId,
    productId: row.productId,
    productName: row.productName,
    productDescription: row.productDescription,
    selectedSize: isProductSize(row.selectedSize) ? row.selectedSize : "M",
    selectedColor: isProductColor(row.selectedColor)
      ? row.selectedColor
      : "BLACK",
    price: Number(row.price),
    quantity: Number(row.quantity),
    lineTotal: Number(row.price) * Number(row.quantity),
    thumbnailUrl:
      getStorefrontBlobUrl(row.thumbnailPathname) ?? row.thumbnailUrl,
  };
}

function toGuestCartSnapshot(
  cartRow: GuestCartRow,
  itemRows: GuestCartItemRow[],
): GuestCartSnapshot {
  const items = itemRows.map(toGuestCartItem);

  return {
    cartId: cartRow.id,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    expiresAt: cartRow.expiresAt.toISOString(),
    lastAccessedAt: cartRow.lastAccessedAt.toISOString(),
  };
}

async function getCurrentGuestCartId() {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;
}

async function setGuestCartCookie(cartId: string) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_CART_COOKIE_NAME, cartId, getGuestCartCookieOptions());
}

export async function clearGuestCartCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_CART_COOKIE_NAME);
}

async function createGuestCart(client: PoolClient) {
  const result = await client.query<GuestCartRow>(
    `
      INSERT INTO guest_carts DEFAULT VALUES
      RETURNING
        id,
        expires_at AS "expiresAt",
        last_accessed_at AS "lastAccessedAt"
    `,
  );

  const cartRow = result.rows[0];

  if (!cartRow) {
    throw new Error("Failed to create a guest cart.");
  }

  return cartRow;
}

async function getActiveGuestCartForUpdate(
  client: PoolClient,
  cartId: string,
): Promise<GuestCartRow | null> {
  const cartResult = await client.query<GuestCartRow>(
    `
      SELECT
        id,
        expires_at AS "expiresAt",
        last_accessed_at AS "lastAccessedAt"
      FROM guest_carts
      WHERE id = $1
        AND expires_at > NOW()
      FOR UPDATE
    `,
    [cartId],
  );

  if (!cartResult.rows[0]) {
    await client.query(
      `
        DELETE FROM guest_carts
        WHERE id = $1
          AND expires_at <= NOW()
      `,
      [cartId],
    );
    return null;
  }

  const touchResult = await client.query<GuestCartRow>(
    `
      UPDATE guest_carts
      SET
        last_accessed_at = NOW(),
        expires_at = NOW() + INTERVAL '30 days',
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        expires_at AS "expiresAt",
        last_accessed_at AS "lastAccessedAt"
    `,
    [cartId],
  );

  return touchResult.rows[0] ?? null;
}

export async function ensureCartSchema() {
  if (!cartSchemaReady) {
    cartSchemaReady = ensureProductSchema()
      .then(() => query(GUEST_CART_SCHEMA_SQL))
      .then(() => undefined)
      .catch((error) => {
        cartSchemaReady = null;
        throw error;
      });
  }

  return cartSchemaReady;
}

export async function cleanupExpiredGuestCarts() {
  await ensureCartSchema();

  const result = await query<{ deletedCount: string }>(
    `
      WITH deleted AS (
        DELETE FROM guest_carts
        WHERE expires_at <= NOW()
        RETURNING id
      )
      SELECT COUNT(*)::text AS "deletedCount"
      FROM deleted
    `,
  );

  return Number(result.rows[0]?.deletedCount ?? 0);
}

export async function getGuestCartSnapshot(cartId: string | null) {
  if (!cartId) {
    return null;
  }

  await ensureCartSchema();

  const cartResult = await query<GuestCartRow>(
    `
      UPDATE guest_carts
      SET
        last_accessed_at = NOW(),
        expires_at = NOW() + INTERVAL '30 days',
        updated_at = NOW()
      WHERE id = $1
        AND expires_at > NOW()
      RETURNING
        id,
        expires_at AS "expiresAt",
        last_accessed_at AS "lastAccessedAt"
    `,
    [cartId],
  );

  const cartRow = cartResult.rows[0];

  if (!cartRow) {
    await query(
      `
        DELETE FROM guest_carts
        WHERE id = $1
          AND expires_at <= NOW()
      `,
      [cartId],
    );
    return null;
  }

  const itemResult = await query<GuestCartItemRow>(
    `
      SELECT
        gci.id AS "itemId",
        gci.product_id AS "productId",
        p.name AS "productName",
        p.description AS "productDescription",
        gci.selected_size AS "selectedSize",
        gci.selected_color AS "selectedColor",
        p.price,
        gci.quantity,
        p.thumbnail_url AS "thumbnailUrl",
        p.thumbnail_pathname AS "thumbnailPathname"
      FROM guest_cart_items gci
      INNER JOIN products p
        ON p.id = gci.product_id
      WHERE gci.cart_id = $1
      ORDER BY gci.updated_at DESC, gci.created_at DESC, p.created_at DESC
    `,
    [cartId],
  );

  return toGuestCartSnapshot(cartRow, itemResult.rows);
}

export async function getGuestCartSnapshotFromRequest() {
  const cartId = await getCurrentGuestCartId();
  return getGuestCartSnapshot(cartId);
}

export async function addItemsToGuestCartFromRequest(input: {
  productId: string;
  items: GuestCartSelectionInput[];
}) {
  await ensureCartSchema();

  if (!input.items.length) {
    throw new Error("장바구니에 담을 옵션을 선택해 주세요.");
  }

  const normalizedItems = input.items.map((item) => ({
    quantity: clampCartQuantity(item.quantity),
    selectedSize: getValidProductSize(item.selectedSize),
    selectedColor: getValidProductColor(item.selectedColor),
  }));
  const currentCartId = await getCurrentGuestCartId();

  const cartId = await withTransaction(async (client) => {
    const productResult = await client.query<{
      id: string;
      sizeOptions: string[] | null;
      colorOptions: string[] | null;
    }>(
      `
        SELECT
          id,
          size_options AS "sizeOptions",
          color_options AS "colorOptions"
        FROM products
        WHERE id = $1
      `,
      [input.productId],
    );

    const product = productResult.rows[0];

    if (!product) {
      throw new Error("Product not found.");
    }

    const sizeOptions = product.sizeOptions?.filter(isProductSize) ?? [];
    const colorOptions = product.colorOptions?.filter(isProductColor) ?? [];
    const cart =
      (currentCartId
        ? await getActiveGuestCartForUpdate(client, currentCartId)
        : null) ?? (await createGuestCart(client));

    for (const item of normalizedItems) {
      if (!sizeOptions.includes(item.selectedSize)) {
        throw new Error("선택한 사이즈는 현재 판매 중이 아닙니다.");
      }

      if (!colorOptions.includes(item.selectedColor)) {
        throw new Error("선택한 색상은 현재 판매 중이 아닙니다.");
      }

      await client.query(
        `
          INSERT INTO guest_cart_items (
            cart_id,
            product_id,
            selected_size,
            selected_color,
            quantity
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (cart_id, product_id, selected_size, selected_color)
          DO UPDATE
          SET
            quantity = LEAST(99, guest_cart_items.quantity + EXCLUDED.quantity),
            updated_at = NOW()
        `,
        [
          cart.id,
          input.productId,
          item.selectedSize,
          item.selectedColor,
          item.quantity,
        ],
      );
    }

    return cart.id;
  });

  await setGuestCartCookie(cartId);

  return {
    cartId,
  };
}

export async function addItemToGuestCartFromRequest(input: {
  productId: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}) {
  return addItemsToGuestCartFromRequest({
    productId: input.productId,
    items: [
      {
        quantity: input.quantity,
        selectedSize: getValidProductSize(input.selectedSize),
        selectedColor: getValidProductColor(input.selectedColor),
      },
    ],
  });
}

export async function updateGuestCartItemQuantityFromRequest(input: {
  cartItemId: string;
  quantity: number;
}) {
  await ensureCartSchema();

  const currentCartId = await getCurrentGuestCartId();

  if (!currentCartId) {
    await clearGuestCartCookie();
    return { status: "missing" as const };
  }

  const quantity = Math.max(0, Math.min(99, Math.floor(input.quantity)));

  const result = await withTransaction(async (client) => {
    const cart = await getActiveGuestCartForUpdate(client, currentCartId);

    if (!cart) {
      return { status: "missing" as const };
    }

    let touchedItem = false;

    if (quantity <= 0) {
      const deleteResult = await client.query(
        `
          DELETE FROM guest_cart_items
          WHERE cart_id = $1
            AND id = $2
        `,
        [cart.id, input.cartItemId],
      );

      touchedItem = Number(deleteResult.rowCount ?? 0) > 0;
    } else {
      const updateResult = await client.query(
        `
          UPDATE guest_cart_items
          SET
            quantity = $3,
            updated_at = NOW()
          WHERE cart_id = $1
            AND id = $2
        `,
        [cart.id, input.cartItemId, quantity],
      );

      touchedItem = Number(updateResult.rowCount ?? 0) > 0;
    }

    const remainingResult = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM guest_cart_items
        WHERE cart_id = $1
      `,
      [cart.id],
    );

    const remainingCount = Number(remainingResult.rows[0]?.count ?? 0);

    if (remainingCount <= 0) {
      await client.query(
        `
          DELETE FROM guest_carts
          WHERE id = $1
        `,
        [cart.id],
      );

      return { status: "empty" as const };
    }

    if (!touchedItem) {
      return { status: "missing" as const };
    }

    return {
      status: quantity <= 0 ? ("removed" as const) : ("updated" as const),
      cartId: cart.id,
    };
  });

  if (result.status === "missing" || result.status === "empty") {
    await clearGuestCartCookie();
    return result;
  }

  await setGuestCartCookie(result.cartId);
  return result;
}

export async function clearGuestCartItemsFromRequest() {
  await ensureCartSchema();

  const currentCartId = await getCurrentGuestCartId();

  if (!currentCartId) {
    await clearGuestCartCookie();
    return { status: "empty" as const };
  }

  const result = await withTransaction(async (client) => {
    const cart = await getActiveGuestCartForUpdate(client, currentCartId);

    if (!cart) {
      return { status: "missing" as const };
    }

    await client.query(
      `
        DELETE FROM guest_cart_items
        WHERE cart_id = $1
      `,
      [cart.id],
    );

    await client.query(
      `
        DELETE FROM guest_carts
        WHERE id = $1
      `,
      [cart.id],
    );

    return { status: "cleared" as const };
  });

  await clearGuestCartCookie();
  return result;
}
