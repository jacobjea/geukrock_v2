import { notFound } from "next/navigation";

import { updateProductAction } from "@/app/admin/products/actions";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/lib/admin/products";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="border border-[#d9dde3] bg-white px-4 py-4 sm:px-5">
        <h2 className="break-keep text-lg font-bold sm:text-xl">상품 수정</h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          {product.name} 상품 정보를 수정합니다.
        </p>
      </section>

      <ProductForm
        mode="edit"
        action={updateProductAction.bind(null, productId)}
        initialProduct={product}
      />
    </div>
  );
}
