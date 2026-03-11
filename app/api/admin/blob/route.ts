import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN.");
  }

  return token;
}

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname");

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

  headers.set(
    "Content-Type",
    result.blob.contentType || "application/octet-stream",
  );
  headers.set("Cache-Control", "private, max-age=60");

  if (result.blob.contentDisposition) {
    headers.set("Content-Disposition", result.blob.contentDisposition);
  }

  if (result.blob.etag) {
    headers.set("ETag", result.blob.etag);
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers,
  });
}
