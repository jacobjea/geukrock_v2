import "server-only";

import { del, put } from "@vercel/blob";

export interface BlobAsset {
  pathname: string;
  url: string;
}

function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN.");
  }

  return token;
}

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function getFileExtension(file: File) {
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";

  return extension.toLowerCase();
}

export async function uploadProductImage(
  file: File,
  folder: "thumbnails" | "details",
  productName: string,
): Promise<BlobAsset> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded.");
  }

  const safeName = sanitizeSegment(productName) || "product";
  const extension = getFileExtension(file);
  const pathname = `products/${folder}/${safeName}-${Date.now()}${extension}`;

  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type || undefined,
    token: getBlobToken(),
  });

  return {
    pathname: blob.pathname,
    url: blob.url,
  };
}

export async function deleteProductImages(pathnames: string[]) {
  const uniquePathnames = [...new Set(pathnames.filter(Boolean))];

  if (!uniquePathnames.length) {
    return;
  }

  await del(uniquePathnames, {
    token: getBlobToken(),
  });
}
