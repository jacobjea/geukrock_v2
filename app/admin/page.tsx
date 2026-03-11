import Link from "next/link";

import { Pagination } from "@/components/admin/Pagination";
import { ProductListTable } from "@/components/admin/ProductListTable";
import { listProducts } from "@/lib/admin/products";

export const dynamic = "force-dynamic";

function getStatusMessage(status?: string) {
  switch (status) {
    case "created":
      return "상품이 등록되었습니다.";
    case "updated":
      return "상품 정보가 수정되었습니다.";
    case "deleted":
      return "상품이 삭제되었습니다.";
    case "reordered":
      return "상품 진열순서가 변경되었습니다.";
    default:
      return null;
  }
}

interface AdminProductsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const productPage = await listProducts(page);
  const statusMessage = getStatusMessage(params.status);

  return (
    <div className="space-y-6">
      <section className="border border-[#d9dde3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4">
          <div>
            <h2 className="text-xl font-bold">상품 목록</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              등록된 상품을 조회하고 수정, 삭제, 진열순서 변경까지 할 수
              있습니다.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center rounded border border-[#2f6fed] bg-[#2f6fed] px-4 py-2 text-sm font-medium text-white hover:bg-[#255fce]"
          >
            상품 등록
          </Link>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 px-5 py-4 text-sm text-[#4b5563]">
          <span>전체 상품 수: {productPage.totalItems}개</span>
          <span>페이지당 노출 수: {productPage.pageSize}개</span>
          <span>
            현재 페이지: {productPage.page} / {productPage.totalPages}
          </span>
        </div>
      </section>

      {statusMessage ? (
        <div className="border border-[#b7d4ff] bg-[#eef5ff] px-4 py-3 text-sm text-[#1d4f91]">
          {statusMessage}
        </div>
      ) : null}

      <ProductListTable
        key={`${productPage.page}-${productPage.items
          .map((item) => `${item.id}-${item.updatedAt}`)
          .join("-")}`}
        items={productPage.items}
        currentPage={productPage.page}
        pageSize={productPage.pageSize}
      />

      <div className="flex items-center justify-center">
        <Pagination
          currentPage={productPage.page}
          totalPages={productPage.totalPages}
        />
      </div>
    </div>
  );
}
