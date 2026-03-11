import { ProductForm } from "@/components/admin/ProductForm";

import { createProductAction } from "../actions";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <section className="border border-[#d9dde3] bg-white px-5 py-4">
        <h2 className="text-xl font-bold">상품 등록</h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          상품 기본 정보와 이미지를 입력한 뒤 저장하세요.
        </p>
      </section>

      <ProductForm mode="create" action={createProductAction} />
    </div>
  );
}
