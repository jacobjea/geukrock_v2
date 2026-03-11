import "server-only";

import type { PoolClient } from "pg";

import { query, withTransaction } from "@/lib/db";
import type {
  PaginatedProducts,
  ProductDetail,
  ProductImageRecord,
  ProductListItem,
} from "@/types/admin-product";
import type {
  StorefrontProduct,
  StorefrontProductDetail,
  StorefrontProductImage,
} from "@/types/product";

export const PRODUCTS_PAGE_SIZE = 8;

export const ADMIN_PRODUCT_SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  thumbnail_url TEXT,
  thumbnail_pathname TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_pathname TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_sort_order
  ON products (sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images (product_id, sort_order);
`;

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sortOrder: number;
  thumbnailUrl: string | null;
  thumbnailPathname: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProductListRow = ProductRow & {
  detailImageCount: number | string;
};

type ProductImageRow = {
  id: string;
  url: string;
  pathname: string;
  sortOrder: number;
  createdAt: Date;
};

export interface ProductAssetInput {
  pathname: string;
  url: string;
}

export interface CreateProductInput {
  name: string;
  description: string | null;
  price: number;
  thumbnail: ProductAssetInput | null;
  detailImages: ProductAssetInput[];
}

export interface UpdateProductInput extends CreateProductInput {
  productId: string;
  deletedImageIds: string[];
  detailImageOrder: string[];
  removeThumbnail: boolean;
}

export interface ProductMutationResult {
  productId: string;
  removedAssets: string[];
}

let schemaReady: Promise<void> | null = null;

const NORMALIZE_PRODUCT_SORT_ORDER_SQL = `
WITH ordered_products AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY sort_order ASC, created_at DESC, id ASC
    ) - 1 AS next_sort_order
  FROM products
)
UPDATE products AS p
SET sort_order = ordered_products.next_sort_order
FROM ordered_products
WHERE p.id = ordered_products.id
  AND p.sort_order IS DISTINCT FROM ordered_products.next_sort_order;
`;

function getAdminBlobUrl(pathname: string | null) {
  if (!pathname) {
    return null;
  }

  return `/api/admin/blob?pathname=${encodeURIComponent(pathname)}`;
}

export async function ensureProductSchema() {
  if (!schemaReady) {
    schemaReady = query(ADMIN_PRODUCT_SCHEMA_SQL)
      .then(async () => {
        await query(NORMALIZE_PRODUCT_SORT_ORDER_SQL);
      })
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }

  return schemaReady;
}

function toProductListItem(row: ProductListRow): ProductListItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    sortOrder: Number(row.sortOrder),
    thumbnailUrl: getAdminBlobUrl(row.thumbnailPathname) ?? row.thumbnailUrl,
    detailImageCount: Number(row.detailImageCount),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toProductImage(row: ProductImageRow): ProductImageRecord {
  return {
    id: row.id,
    url: getAdminBlobUrl(row.pathname) ?? row.url,
    pathname: row.pathname,
    sortOrder: Number(row.sortOrder),
    createdAt: row.createdAt.toISOString(),
  };
}

function toStorefrontProductImage(
  id: string,
  url: string | null,
  kind: StorefrontProductImage["kind"],
) {
  if (!url) {
    return null;
  }

  return {
    id,
    url,
    kind,
  } satisfies StorefrontProductImage;
}

function toProductDetail(
  productRow: ProductRow,
  imageRows: ProductImageRow[],
): ProductDetail {
  return {
    id: productRow.id,
    name: productRow.name,
    description: productRow.description,
    price: Number(productRow.price),
    sortOrder: Number(productRow.sortOrder),
    thumbnailUrl:
      getAdminBlobUrl(productRow.thumbnailPathname) ?? productRow.thumbnailUrl,
    thumbnailPathname: productRow.thumbnailPathname,
    createdAt: productRow.createdAt.toISOString(),
    updatedAt: productRow.updatedAt.toISOString(),
    images: imageRows.map(toProductImage),
  };
}

function toStorefrontProduct(row: ProductRow): StorefrontProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    thumbnailUrl: getAdminBlobUrl(row.thumbnailPathname) ?? row.thumbnailUrl,
  };
}

function toStorefrontProductDetail(
  productRow: ProductRow,
  imageRows: ProductImageRow[],
): StorefrontProductDetail {
  const thumbnailUrl =
    getAdminBlobUrl(productRow.thumbnailPathname) ?? productRow.thumbnailUrl;
  const images = [
    toStorefrontProductImage(
      `${productRow.id}-thumbnail`,
      thumbnailUrl,
      "thumbnail",
    ),
    ...imageRows.map((row) =>
      toStorefrontProductImage(
        row.id,
        getAdminBlobUrl(row.pathname) ?? row.url,
        "detail",
      ),
    ),
  ].filter((image): image is StorefrontProductImage => Boolean(image));

  return {
    id: productRow.id,
    name: productRow.name,
    description: productRow.description,
    price: Number(productRow.price),
    thumbnailUrl,
    images,
  };
}

async function normalizeProductSortOrderWithClient(client: PoolClient) {
  await client.query(NORMALIZE_PRODUCT_SORT_ORDER_SQL);
}

async function getProductForUpdate(
  client: PoolClient,
  productId: string,
): Promise<ProductDetail | null> {
  const productResult = await client.query<ProductRow>(
    `
      SELECT
        id,
        name,
        description,
        price,
        sort_order AS "sortOrder",
        thumbnail_url AS "thumbnailUrl",
        thumbnail_pathname AS "thumbnailPathname",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM products
      WHERE id = $1
      FOR UPDATE
    `,
    [productId],
  );

  const productRow = productResult.rows[0];

  if (!productRow) {
    return null;
  }

  const imageResult = await client.query<ProductImageRow>(
    `
      SELECT
        id,
        image_url AS "url",
        image_pathname AS "pathname",
        sort_order AS "sortOrder",
        created_at AS "createdAt"
      FROM product_images
      WHERE product_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `,
    [productId],
  );

  return toProductDetail(productRow, imageResult.rows);
}

export async function listProducts(page: number): Promise<PaginatedProducts> {
  await ensureProductSchema();

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const offset = (safePage - 1) * PRODUCTS_PAGE_SIZE;

  const [countResult, productResult] = await Promise.all([
    query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products"),
    query<ProductListRow>(
      `
        SELECT
          p.id,
          p.name,
          p.description,
          p.price,
          p.sort_order AS "sortOrder",
          p.thumbnail_url AS "thumbnailUrl",
          p.thumbnail_pathname AS "thumbnailPathname",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          COUNT(pi.id)::int AS "detailImageCount"
        FROM products p
        LEFT JOIN product_images pi
          ON pi.product_id = p.id
        GROUP BY p.id
        ORDER BY p.sort_order ASC, p.created_at DESC, p.id ASC
        LIMIT $1 OFFSET $2
      `,
      [PRODUCTS_PAGE_SIZE, offset],
    ),
  ]);

  const totalItems = Number(countResult.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / PRODUCTS_PAGE_SIZE));

  return {
    items: productResult.rows.map(toProductListItem),
    page: Math.min(safePage, totalPages),
    pageSize: PRODUCTS_PAGE_SIZE,
    totalItems,
    totalPages,
  };
}

export async function getProductById(productId: string) {
  await ensureProductSchema();

  const productResult = await query<ProductRow>(
    `
      SELECT
        id,
        name,
        description,
        price,
        sort_order AS "sortOrder",
        thumbnail_url AS "thumbnailUrl",
        thumbnail_pathname AS "thumbnailPathname",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM products
      WHERE id = $1
    `,
    [productId],
  );

  const productRow = productResult.rows[0];

  if (!productRow) {
    return null;
  }

  const imageResult = await query<ProductImageRow>(
    `
      SELECT
        id,
        image_url AS "url",
        image_pathname AS "pathname",
        sort_order AS "sortOrder",
        created_at AS "createdAt"
      FROM product_images
      WHERE product_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `,
    [productId],
  );

  return toProductDetail(productRow, imageResult.rows);
}

export async function listStorefrontProducts(): Promise<StorefrontProduct[]> {
  await ensureProductSchema();

  const result = await query<ProductRow>(
    `
      SELECT
        id,
        name,
        description,
        price,
        sort_order AS "sortOrder",
        thumbnail_url AS "thumbnailUrl",
        thumbnail_pathname AS "thumbnailPathname",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM products
      ORDER BY sort_order ASC, created_at DESC, id ASC
    `,
  );

  return result.rows.map(toStorefrontProduct);
}

export async function getStorefrontProductById(
  productId: string,
): Promise<StorefrontProductDetail | null> {
  await ensureProductSchema();

  const productResult = await query<ProductRow>(
    `
      SELECT
        id,
        name,
        description,
        price,
        sort_order AS "sortOrder",
        thumbnail_url AS "thumbnailUrl",
        thumbnail_pathname AS "thumbnailPathname",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM products
      WHERE id = $1
    `,
    [productId],
  );

  const productRow = productResult.rows[0];

  if (!productRow) {
    return null;
  }

  const imageResult = await query<ProductImageRow>(
    `
      SELECT
        id,
        image_url AS "url",
        image_pathname AS "pathname",
        sort_order AS "sortOrder",
        created_at AS "createdAt"
      FROM product_images
      WHERE product_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `,
    [productId],
  );

  return toStorefrontProductDetail(productRow, imageResult.rows);
}

export async function createProductRecord(
  input: CreateProductInput,
): Promise<ProductMutationResult> {
  await ensureProductSchema();

  return withTransaction(async (client) => {
    const sortOrderResult = await client.query<{ nextSortOrder: number }>(
      `
        SELECT COALESCE(MIN(sort_order), 0) - 1 AS "nextSortOrder"
        FROM products
      `,
    );
    const nextSortOrder = Number(sortOrderResult.rows[0]?.nextSortOrder ?? 0);

    const insertedProduct = await client.query<{ id: string }>(
      `
        INSERT INTO products (
          name,
          description,
          price,
          thumbnail_url,
          thumbnail_pathname,
          sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        input.name,
        input.description,
        input.price,
        input.thumbnail?.url ?? null,
        input.thumbnail?.pathname ?? null,
        nextSortOrder,
      ],
    );

    const productId = insertedProduct.rows[0]?.id;

    if (!productId) {
      throw new Error("Failed to create the product.");
    }

    for (const [index, image] of input.detailImages.entries()) {
      await client.query(
        `
          INSERT INTO product_images (
            product_id,
            image_url,
            image_pathname,
            sort_order
          )
          VALUES ($1, $2, $3, $4)
        `,
        [productId, image.url, image.pathname, index],
      );
    }

    await normalizeProductSortOrderWithClient(client);

    return {
      productId,
      removedAssets: [],
    };
  });
}

export async function updateProductRecord(
  input: UpdateProductInput,
): Promise<ProductMutationResult | null> {
  await ensureProductSchema();

  return withTransaction(async (client) => {
    const currentProduct = await getProductForUpdate(client, input.productId);

    if (!currentProduct) {
      return null;
    }

    const removedAssets: string[] = [];
    const deletedImageIds = new Set(input.deletedImageIds);
    const imagesToDelete = currentProduct.images.filter((image) =>
      deletedImageIds.has(image.id),
    );
    const remainingImages = currentProduct.images.filter(
      (image) => !deletedImageIds.has(image.id),
    );

    let thumbnailUrl = currentProduct.thumbnailUrl;
    let thumbnailPathname = currentProduct.thumbnailPathname;

    if (input.thumbnail) {
      if (currentProduct.thumbnailPathname) {
        removedAssets.push(currentProduct.thumbnailPathname);
      }

      thumbnailUrl = input.thumbnail.url;
      thumbnailPathname = input.thumbnail.pathname;
    } else if (input.removeThumbnail) {
      if (currentProduct.thumbnailPathname) {
        removedAssets.push(currentProduct.thumbnailPathname);
      }

      thumbnailUrl = null;
      thumbnailPathname = null;
    }

    if (imagesToDelete.length) {
      removedAssets.push(...imagesToDelete.map((image) => image.pathname));

      await client.query(
        `
          DELETE FROM product_images
          WHERE product_id = $1
            AND id = ANY($2::uuid[])
        `,
        [input.productId, imagesToDelete.map((image) => image.id)],
      );
    }

    const remainingImagesById = new Map(
      remainingImages.map((image) => [image.id, image]),
    );
    const orderedExistingImages: Array<{
      id: string;
      sortOrder: number;
    }> = [];
    const orderedNewImages: Array<{
      image: ProductAssetInput;
      sortOrder: number;
    }> = [];
    let nextSortOrder = 0;
    let nextNewImageIndex = 0;

    for (const token of input.detailImageOrder) {
      if (token.startsWith("existing:")) {
        const imageId = token.slice("existing:".length);
        const image = remainingImagesById.get(imageId);

        if (!image) {
          continue;
        }

        orderedExistingImages.push({
          id: image.id,
          sortOrder: nextSortOrder,
        });
        remainingImagesById.delete(imageId);
        nextSortOrder += 1;
        continue;
      }

      if (token === "new") {
        const image = input.detailImages[nextNewImageIndex];

        if (!image) {
          continue;
        }

        orderedNewImages.push({
          image,
          sortOrder: nextSortOrder,
        });
        nextNewImageIndex += 1;
        nextSortOrder += 1;
      }
    }

    for (const image of remainingImages) {
      if (!remainingImagesById.has(image.id)) {
        continue;
      }

      orderedExistingImages.push({
        id: image.id,
        sortOrder: nextSortOrder,
      });
      remainingImagesById.delete(image.id);
      nextSortOrder += 1;
    }

    for (; nextNewImageIndex < input.detailImages.length; nextNewImageIndex += 1) {
      const image = input.detailImages[nextNewImageIndex];

      if (!image) {
        continue;
      }

      orderedNewImages.push({
        image,
        sortOrder: nextSortOrder,
      });
      nextSortOrder += 1;
    }

    for (const image of orderedExistingImages) {
      await client.query(
        `
          UPDATE product_images
          SET sort_order = $3
          WHERE product_id = $1
            AND id = $2
        `,
        [input.productId, image.id, image.sortOrder],
      );
    }

    for (const { image, sortOrder } of orderedNewImages) {
      await client.query(
        `
          INSERT INTO product_images (
            product_id,
            image_url,
            image_pathname,
            sort_order
          )
          VALUES ($1, $2, $3, $4)
        `,
        [input.productId, image.url, image.pathname, sortOrder],
      );
    }

    await client.query(
      `
        UPDATE products
        SET
          name = $2,
          description = $3,
          price = $4,
          thumbnail_url = $5,
          thumbnail_pathname = $6,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        input.productId,
        input.name,
        input.description,
        input.price,
        thumbnailUrl,
        thumbnailPathname,
      ],
    );

    return {
      productId: input.productId,
      removedAssets,
    };
  });
}

export async function deleteProductRecord(
  productId: string,
): Promise<ProductMutationResult | null> {
  await ensureProductSchema();

  return withTransaction(async (client) => {
    const currentProduct = await getProductForUpdate(client, productId);

    if (!currentProduct) {
      return null;
    }

    await client.query("DELETE FROM products WHERE id = $1", [productId]);
    await normalizeProductSortOrderWithClient(client);

    const removedAssets = [
      currentProduct.thumbnailPathname,
      ...currentProduct.images.map((image) => image.pathname),
    ].filter((value): value is string => Boolean(value));

    return {
      productId,
      removedAssets,
    };
  });
}

export async function reorderProductsForPage(
  page: number,
  orderedProductIds: string[],
): Promise<boolean> {
  await ensureProductSchema();

  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  return withTransaction(async (client) => {
    const productResult = await client.query<{ id: string }>(
      `
        SELECT id
        FROM products
        ORDER BY sort_order ASC, created_at DESC, id ASC
        FOR UPDATE
      `,
    );

    const allProductIds = productResult.rows.map((row) => row.id);

    if (!allProductIds.length) {
      return true;
    }

    const offset = (safePage - 1) * PRODUCTS_PAGE_SIZE;
    const currentPageIds = allProductIds.slice(offset, offset + PRODUCTS_PAGE_SIZE);

    if (!currentPageIds.length) {
      return false;
    }

    if (orderedProductIds.length !== currentPageIds.length) {
      return false;
    }

    const currentPageIdSet = new Set(currentPageIds);
    const submittedIdSet = new Set(orderedProductIds);

    if (
      submittedIdSet.size !== orderedProductIds.length ||
      orderedProductIds.some((productId) => !currentPageIdSet.has(productId))
    ) {
      return false;
    }

    const reorderedIds = [...allProductIds];
    reorderedIds.splice(offset, currentPageIds.length, ...orderedProductIds);

    const values = reorderedIds.flatMap((productId, index) => [productId, index]);
    const placeholders = reorderedIds
      .map(
        (_, index) =>
          `($${index * 2 + 1}::uuid, $${index * 2 + 2}::int)`,
      )
      .join(", ");

    await client.query(
      `
        UPDATE products AS p
        SET sort_order = ordering.sort_order
        FROM (
          VALUES ${placeholders}
        ) AS ordering(id, sort_order)
        WHERE p.id = ordering.id
      `,
      values,
    );

    return true;
  });
}
