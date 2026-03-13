import "server-only";

import { del, put } from "@vercel/blob";
import sharp from "sharp";

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

function getImageResizePreset(folder: "thumbnails" | "details") {
  return folder === "thumbnails"
    ? {
        width: 1200,
        height: 1200,
        quality: 80,
      }
    : {
        width: 1800,
        height: 2400,
        quality: 84,
      };
}

function shouldOptimizeImage(file: File) {
  return file.type.startsWith("image/") &&
    file.type !== "image/svg+xml" &&
    file.type !== "image/gif";
}

async function prepareProductImageUpload(
  file: File,
  folder: "thumbnails" | "details",
) {
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  if (!shouldOptimizeImage(file)) {
    return {
      body: originalBuffer,
      contentType: file.type || undefined,
      extension: getFileExtension(file),
    };
  }

  try {
    const preset = getImageResizePreset(folder);
    const optimizedBuffer = await sharp(originalBuffer)
      .rotate()
      .resize({
        width: preset.width,
        height: preset.height,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: preset.quality,
        effort: 4,
      })
      .toBuffer();

    return {
      body: optimizedBuffer,
      contentType: "image/webp",
      extension: ".webp",
    };
  } catch (error) {
    console.error("Failed to optimize product image. Uploading original file.", error);

    return {
      body: originalBuffer,
      contentType: file.type || undefined,
      extension: getFileExtension(file),
    };
  }
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
  const optimizedUpload = await prepareProductImageUpload(file, folder);
  const extension = optimizedUpload.extension || getFileExtension(file);
  const pathname = `products/${folder}/${safeName}-${Date.now()}${extension}`;

  const blob = await put(pathname, optimizedUpload.body, {
    access: "private",
    addRandomSuffix: true,
    contentType: optimizedUpload.contentType,
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
