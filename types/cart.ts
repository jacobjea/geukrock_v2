import type { ProductColor, ProductSize } from "./product";

export interface GuestCartSelectionInput {
  selectedSize: ProductSize;
  selectedColor: ProductColor;
  quantity: number;
}

export interface GuestCartItem {
  itemId: string;
  productId: string;
  productName: string;
  productDescription: string | null;
  selectedSize: ProductSize;
  selectedColor: ProductColor;
  price: number;
  quantity: number;
  lineTotal: number;
  thumbnailUrl: string | null;
}

export interface GuestCartSnapshot {
  cartId: string;
  items: GuestCartItem[];
  totalItems: number;
  subtotal: number;
  expiresAt: string;
  lastAccessedAt: string;
}
