import "server-only";

import type { PoolClient } from "pg";

import type { BlobAsset } from "@/lib/admin/blob";
import { query, withTransaction } from "@/lib/db";
import type {
  CarouselAdminData,
  CarouselSlide,
  StorefrontCarouselSlide,
} from "@/types/carousel";

const CAROUSEL_SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS carousel_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  image_pathname TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS image_pathname TEXT;

ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS carousel_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  randomize_order BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO carousel_settings (singleton, randomize_order)
VALUES (TRUE, FALSE)
ON CONFLICT (singleton) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_carousel_slides_sort_order
  ON carousel_slides (sort_order ASC, created_at ASC);
`;

const NORMALIZE_CAROUSEL_SORT_ORDER_SQL = `
WITH ordered_slides AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY sort_order ASC, created_at ASC, id ASC
    ) - 1 AS next_sort_order
  FROM carousel_slides
)
UPDATE carousel_slides AS c
SET sort_order = ordered_slides.next_sort_order
FROM ordered_slides
WHERE c.id = ordered_slides.id
  AND c.sort_order IS DISTINCT FROM ordered_slides.next_sort_order;
`;

type CarouselSlideRow = {
  id: string;
  imageUrl: string;
  imagePathname: string;
  sortOrder: number;
  createdAt: Date;
};

let carouselSchemaReady: Promise<void> | null = null;

function getCarouselBlobUrl(pathname: string | null) {
  if (!pathname) {
    return null;
  }

  return `/api/admin/blob?pathname=${encodeURIComponent(pathname)}`;
}

function toCarouselSlide(row: CarouselSlideRow): CarouselSlide {
  return {
    id: row.id,
    imageUrl: getCarouselBlobUrl(row.imagePathname) ?? row.imageUrl,
    pathname: row.imagePathname,
    sortOrder: Number(row.sortOrder),
    createdAt: row.createdAt.toISOString(),
  };
}

function shuffleSlides<T>(items: readonly T[]) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [
      nextItems[swapIndex] as T,
      nextItems[index] as T,
    ];
  }

  return nextItems;
}

export async function ensureCarouselSchema() {
  if (!carouselSchemaReady) {
    carouselSchemaReady = query(CAROUSEL_SCHEMA_SQL)
      .then(async () => {
        await query(NORMALIZE_CAROUSEL_SORT_ORDER_SQL);
      })
      .catch((error) => {
        carouselSchemaReady = null;
        throw error;
      });
  }

  return carouselSchemaReady;
}

async function listCarouselSlides(client?: PoolClient) {
  if (client) {
    const result = await client.query<CarouselSlideRow>(
      `
        SELECT
          id,
          image_url AS "imageUrl",
          image_pathname AS "imagePathname",
          sort_order AS "sortOrder",
          created_at AS "createdAt"
        FROM carousel_slides
        ORDER BY sort_order ASC, created_at ASC, id ASC
      `,
    );

    return result.rows;
  }

  const result = await query<CarouselSlideRow>(
    `
      SELECT
        id,
        image_url AS "imageUrl",
        image_pathname AS "imagePathname",
        sort_order AS "sortOrder",
        created_at AS "createdAt"
      FROM carousel_slides
      ORDER BY sort_order ASC, created_at ASC, id ASC
    `,
  );

  return result.rows;
}

async function getCarouselRandomizeOrder(client?: PoolClient) {
  if (client) {
    const result = await client.query<{ randomizeOrder: boolean }>(
      `
        SELECT randomize_order AS "randomizeOrder"
        FROM carousel_settings
        WHERE singleton = TRUE
        LIMIT 1
      `,
    );

    return Boolean(result.rows[0]?.randomizeOrder);
  }

  const result = await query<{ randomizeOrder: boolean }>(
    `
      SELECT randomize_order AS "randomizeOrder"
      FROM carousel_settings
      WHERE singleton = TRUE
      LIMIT 1
    `,
  );

  return Boolean(result.rows[0]?.randomizeOrder);
}

export async function listAdminCarouselData(): Promise<CarouselAdminData> {
  await ensureCarouselSchema();
  const [slideRows, randomizeOrder] = await Promise.all([
    listCarouselSlides(),
    getCarouselRandomizeOrder(),
  ]);

  return {
    slides: slideRows.map(toCarouselSlide),
    randomizeOrder,
  };
}

export async function listStorefrontCarouselSlides(): Promise<StorefrontCarouselSlide[]> {
  await ensureCarouselSchema();
  const [slideRows, randomizeOrder] = await Promise.all([
    listCarouselSlides(),
    getCarouselRandomizeOrder(),
  ]);
  const slides = slideRows.map((row) => ({
    id: row.id,
    imageUrl: getCarouselBlobUrl(row.imagePathname) ?? row.imageUrl,
  }));

  return randomizeOrder ? shuffleSlides(slides) : slides;
}

interface SaveCarouselInput {
  randomizeOrder: boolean;
  slideOrder: string[];
  deletedSlideIds: string[];
  images: BlobAsset[];
}

export async function saveCarouselData(
  input: SaveCarouselInput,
): Promise<{ removedAssets: string[] }> {
  await ensureCarouselSchema();

  return withTransaction(async (client) => {
    const currentSlides = await listCarouselSlides(client);
    const currentSlideMap = new Map(currentSlides.map((slide) => [slide.id, slide]));
    const orderedTokens = input.slideOrder.length
      ? input.slideOrder
      : input.images.map(() => "new");
    const referencedExistingIds = new Set(
      orderedTokens
        .filter((token) => token.startsWith("existing:"))
        .map((token) => token.slice("existing:".length))
        .filter(Boolean),
    );
    const deletedIds = new Set(input.deletedSlideIds);
    const removedSlides = currentSlides.filter(
      (slide) => deletedIds.has(slide.id) || !referencedExistingIds.has(slide.id),
    );
    const removedAssets = removedSlides.map((slide) => slide.imagePathname);

    if (removedSlides.length) {
      await client.query(
        `
          DELETE FROM carousel_slides
          WHERE id = ANY($1::uuid[])
        `,
        [removedSlides.map((slide) => slide.id)],
      );
    }

    let nextNewImageIndex = 0;
    let nextSortOrder = 0;

    for (const token of orderedTokens) {
      if (token.startsWith("existing:")) {
        const slideId = token.slice("existing:".length);
        const currentSlide = currentSlideMap.get(slideId);

        if (!currentSlide || deletedIds.has(slideId)) {
          continue;
        }

        await client.query(
          `
            UPDATE carousel_slides
            SET
              sort_order = $2,
              updated_at = NOW()
            WHERE id = $1
          `,
          [slideId, nextSortOrder],
        );
        nextSortOrder += 1;
        continue;
      }

      const image = input.images[nextNewImageIndex];
      nextNewImageIndex += 1;

      if (!image) {
        continue;
      }

      await client.query(
        `
          INSERT INTO carousel_slides (
            image_url,
            image_pathname,
            sort_order
          )
          VALUES ($1, $2, $3)
        `,
        [image.url, image.pathname, nextSortOrder],
      );
      nextSortOrder += 1;
    }

    for (; nextNewImageIndex < input.images.length; nextNewImageIndex += 1) {
      const image = input.images[nextNewImageIndex];

      if (!image) {
        continue;
      }

      await client.query(
        `
          INSERT INTO carousel_slides (
            image_url,
            image_pathname,
            sort_order
          )
          VALUES ($1, $2, $3)
        `,
        [image.url, image.pathname, nextSortOrder],
      );
      nextSortOrder += 1;
    }

    await client.query(
      `
        INSERT INTO carousel_settings (
          singleton,
          randomize_order,
          updated_at
        )
        VALUES (TRUE, $1, NOW())
        ON CONFLICT (singleton)
        DO UPDATE SET
          randomize_order = EXCLUDED.randomize_order,
          updated_at = NOW()
      `,
      [input.randomizeOrder],
    );

    await client.query(NORMALIZE_CAROUSEL_SORT_ORDER_SQL);

    return { removedAssets };
  });
}
