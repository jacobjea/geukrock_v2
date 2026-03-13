export type VisualTone =
  | "obsidian"
  | "graphite"
  | "steel"
  | "ash"
  | "mist"
  | "concrete"
  | "smoke"
  | "chalk";

export type PromoTone = "night" | "paper";

export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "2XL"] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

export const PRODUCT_COLORS = ["BLACK", "WHITE"] as const;
export type ProductColor = (typeof PRODUCT_COLORS)[number];

export const PRODUCT_SALE_MODES = ["always", "period"] as const;
export type ProductSaleMode = (typeof PRODUCT_SALE_MODES)[number];

export const PRODUCT_COLOR_LABELS: Record<ProductColor, string> = {
  BLACK: "블랙",
  WHITE: "화이트",
};

export const PRODUCT_COLOR_SWATCHES: Record<ProductColor, string> = {
  BLACK: "#111111",
  WHITE: "#f5f5f5",
};

export function isProductSize(value: string): value is ProductSize {
  return PRODUCT_SIZES.includes(value as ProductSize);
}

export function isProductColor(value: string): value is ProductColor {
  return PRODUCT_COLORS.includes(value as ProductColor);
}

export function isProductSaleMode(value: string): value is ProductSaleMode {
  return PRODUCT_SALE_MODES.includes(value as ProductSaleMode);
}

export function normalizeProductSizes(
  values: readonly string[] | null | undefined,
): ProductSize[] {
  const normalized = (values ?? []).filter(isProductSize);
  return normalized.length ? normalized : [...PRODUCT_SIZES];
}

export function normalizeProductColors(
  values: readonly string[] | null | undefined,
): ProductColor[] {
  const normalized = (values ?? []).filter(isProductColor);
  return normalized.length ? normalized : ["BLACK"];
}

export interface NavigationItem {
  label: string;
  href: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface HeroStat {
  label: string;
  value: string;
}

export interface HeroContent {
  eyebrow: string;
  title: string[];
  description: string;
  primaryCta: string;
  secondaryCta: string;
  stats: HeroStat[];
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  price: number;
  discountRate: number;
  tone: VisualTone;
  badge?: string;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  thumbnailUrl: string | null;
  saleMode: ProductSaleMode;
  saleStartAt: string | null;
  saleEndAt: string | null;
}

export interface StorefrontProductImage {
  id: string;
  url: string;
  kind: "thumbnail" | "detail";
}

export interface StorefrontProductDetail extends StorefrontProduct {
  images: StorefrontProductImage[];
  sizeOptions: ProductSize[];
  colorOptions: ProductColor[];
}

export interface PromoBanner {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  secondaryCta?: string;
  accent: string;
  tone: PromoTone;
}

export interface EditorPick {
  id: string;
  category: string;
  title: string;
  description: string;
  meta: string;
  tone: VisualTone;
}
