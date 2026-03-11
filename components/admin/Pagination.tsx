import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

function getPageHref(page: number) {
  return page <= 1 ? "/admin" : `/admin?page=${page}`;
}

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

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

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const tokens = getPaginationTokens(currentPage, totalPages);

  return (
    <nav aria-label="상품 목록 페이지 이동" className="flex flex-wrap items-center gap-1">
      <Link
        href={getPageHref(Math.max(1, currentPage - 1))}
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
              href={getPageHref(token)}
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
        href={getPageHref(Math.min(totalPages, currentPage + 1))}
        className="rounded border border-[#d9dde3] bg-white px-3 py-2 text-sm hover:bg-[#f7f8fa]"
      >
        다음
      </Link>
    </nav>
  );
}
