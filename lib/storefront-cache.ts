import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { listStorefrontCarouselSlides } from "@/lib/admin/carousel";
import {
  getStorefrontProductById as getStorefrontProductByIdFromDb,
  listStorefrontProducts,
} from "@/lib/admin/products";

const STOREFRONT_REVALIDATE_SECONDS = 60;

const getCachedStorefrontProductsBase = unstable_cache(
  async () => listStorefrontProducts(),
  ["storefront-products"],
  { revalidate: STOREFRONT_REVALIDATE_SECONDS },
);

const getCachedStorefrontCarouselSlidesBase = unstable_cache(
  async () => listStorefrontCarouselSlides(),
  ["storefront-carousel-slides"],
  { revalidate: STOREFRONT_REVALIDATE_SECONDS },
);

const getCachedStorefrontProductByIdBase = unstable_cache(
  async (productId: string) => getStorefrontProductByIdFromDb(productId),
  ["storefront-product-detail"],
  { revalidate: STOREFRONT_REVALIDATE_SECONDS },
);

export const getCachedStorefrontProducts = cache(async () =>
  getCachedStorefrontProductsBase(),
);

export const getCachedStorefrontCarouselSlides = cache(async () =>
  getCachedStorefrontCarouselSlidesBase(),
);

export const getCachedStorefrontProductById = cache(async (productId: string) =>
  getCachedStorefrontProductByIdBase(productId),
);
