import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_RESIZE_WIDTH = 2400;

function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN.");
  }

  return token;
}

function getRequestedWidth(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(MAX_RESIZE_WIDTH, Math.floor(parsed));
}

function canResizeImage(contentType: string | null) {
  return Boolean(
    contentType &&
      contentType.startsWith("image/") &&
      contentType !== "image/svg+xml" &&
      contentType !== "image/gif",
  );
}

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname");
  const requestedWidth = getRequestedWidth(request.nextUrl.searchParams.get("w"));

  if (!pathname) {
    return NextResponse.json(
      { message: "pathname query parameter is required." },
      { status: 400 },
    );
  }

  const result = await get(pathname, {
    access: "private",
    token: getBlobToken(),
  });

  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ message: "Blob not found." }, { status: 404 });
  }

  const headers = new Headers();

  headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

  if (result.blob.contentDisposition) {
    headers.set("Content-Disposition", result.blob.contentDisposition);
  }

  if (result.blob.etag && !requestedWidth) {
    headers.set("ETag", result.blob.etag);
  }

  if (!requestedWidth || !canResizeImage(result.blob.contentType ?? null)) {
    headers.set(
      "Content-Type",
      result.blob.contentType || "application/octet-stream",
    );

    return new NextResponse(result.stream, {
      status: 200,
      headers,
    });
  }

  const originalBuffer = Buffer.from(await new Response(result.stream).arrayBuffer());
  try {
    const resizedBuffer = await sharp(originalBuffer)
      .rotate()
      .resize({
        width: requestedWidth,
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        effort: 4,
      })
      .toBuffer();

    headers.set("Content-Type", "image/webp");

    return new NextResponse(new Uint8Array(resizedBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Failed to resize blob image. Returning original image.", error);
    headers.set(
      "Content-Type",
      result.blob.contentType || "application/octet-stream",
    );

    return new NextResponse(new Uint8Array(originalBuffer), {
      status: 200,
      headers,
    });
  }
}
