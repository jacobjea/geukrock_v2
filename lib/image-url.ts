export function getResizedImageUrl(
  url: string | null | undefined,
  width: number,
) {
  if (!url) {
    return null;
  }

  const normalizedWidth = Math.max(1, Math.floor(width));

  if (!Number.isFinite(normalizedWidth)) {
    return url;
  }

  try {
    const isAbsoluteUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);
    const resolvedUrl = new URL(url, "http://localhost");

    if (resolvedUrl.pathname !== "/api/admin/blob") {
      return url;
    }

    resolvedUrl.searchParams.set("w", String(normalizedWidth));
    return isAbsoluteUrl
      ? resolvedUrl.toString()
      : `${resolvedUrl.pathname}${resolvedUrl.search}`;
  } catch {
    return url;
  }
}
