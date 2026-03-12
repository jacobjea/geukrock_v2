import type { ProductColor, ProductSize } from "./product";

export interface ProductImageRecord {
  id: string;
  url: string;
  pathname: string;
  sortOrder: number;
  createdAt: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sortOrder: number;
  thumbnailUrl: string | null;
  detailImageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sizeOptions: ProductSize[];
  colorOptions: ProductColor[];
  sortOrder: number;
  thumbnailUrl: string | null;
  thumbnailPathname: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProductImageRecord[];
}

export interface PaginatedProducts {
  items: ProductListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type ProductFormField =
  | "name"
  | "price"
  | "sizes"
  | "colors"
  | "description"
  | "thumbnail"
  | "detailImages";

export interface ProductFormState {
  status: "idle" | "error";
  message?: string;
  fieldErrors: Partial<Record<ProductFormField, string>>;
}

export interface ProductSortActionResult {
  status: "success" | "error";
  message?: string;
}

export const initialProductFormState: ProductFormState = {
  status: "idle",
  fieldErrors: {},
};
