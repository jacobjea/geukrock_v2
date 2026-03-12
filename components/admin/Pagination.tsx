import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
  query?: Record<string, string | number | undefined>;
  ariaLabel?: string;
}

function getPageHref(
  page: number,
  basePath: string,
  query: Record<string, string | number | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  } else {
    searchParams.delete("page");
  }

  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  for (const page of [...pages]) {
    if (page < 1 || page > totalPages) {
      pages.delete(page);
    }
  }

  return [...pages].sort((left, right) => left - right);
}

function getPaginationTokens(currentPage: number, totalPages: number) {
  const pages = getPageNumbers(currentPage, totalPages);

  return pages.flatMap((page, index) => {
    const previousPage = pages[index - 1];

    if (previousPage && page - previousPage > 1) {
      return ["gap", page] as const;
    }

    return [page] as const;
  });
}

export function Pagination({
  currentPage,
  totalPages,
  basePath = "/admin",
  query = {},
  ariaLabel = "페이지 이동",
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const tokens = getPaginationTokens(currentPage, totalPages);

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center gap-1">
      <Link
        href={getPageHref(Math.max(1, currentPage - 1), basePath, query)}
        className="rounded border border-[#d9dde3] bg-white px-3 py-2 text-sm hover:bg-[#f7f8fa]"
      >
        이전
      </Link>

      {tokens.map((token, index) => {
        if (token === "gap") {
          return (
            <span
              key={`gap-${index}`}
              className="px-2 text-sm text-[#6b7280]"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        return (
          <span key={token} className="contents">
            <Link
              href={getPageHref(token, basePath, query)}
              aria-current={token === currentPage ? "page" : undefined}
              className={[
                "rounded px-3 py-2 text-sm",
                token === currentPage
                  ? "border border-[#2f6fed] bg-[#2f6fed] text-white"
                  : "border border-[#d9dde3] bg-white hover:bg-[#f7f8fa]",
              ].join(" ")}
            >
              {token}
            </Link>
          </span>
        );
      })}

      <Link
        href={getPageHref(Math.min(totalPages, currentPage + 1), basePath, query)}
        className="rounded border border-[#d9dde3] bg-white px-3 py-2 text-sm hover:bg-[#f7f8fa]"
      >
        다음
      </Link>
    </nav>
  );
}
