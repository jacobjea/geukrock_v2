/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";

import type {
  ProductDetail,
  ProductFormState,
} from "@/types/admin-product";
import { initialProductFormState } from "@/types/admin-product";

import { SubmitButton } from "./SubmitButton";

interface ProductFormProps {
  mode: "create" | "edit";
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  initialProduct?: ProductDetail;
}

function normalizePriceInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.replace(/^0+(?=\d)/, "");
}

function formatPriceInput(value: string) {
  const normalized = normalizePriceInput(value);

  if (!normalized) {
    return "";
  }

  return Number(normalized).toLocaleString("ko-KR");
}

export function ProductForm({
  mode,
  action,
  initialProduct,
}: ProductFormProps) {
  const [state, formAction] = useActionState(action, initialProductFormState);
  const thumbnailInputId = useId();
  const detailInputId = useId();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialProduct?.thumbnailUrl ?? null,
  );
  const [detailPreviews, setDetailPreviews] = useState<string[]>([]);
  const [thumbnailFileName, setThumbnailFileName] = useState("");
  const [detailFileCount, setDetailFileCount] = useState(0);
  const [priceInput, setPriceInput] = useState(() =>
    initialProduct?.price !== undefined
      ? formatPriceInput(String(initialProduct.price))
      : "",
  );

  useEffect(() => {
    return () => {
      detailPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [detailPreviews]);

  return (
    <form action={formAction} className="space-y-6">
      <section className="border border-[#d9dde3] bg-white">
        <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-5 py-3 text-sm font-medium">
          기본 정보
        </div>
        <div className="divide-y divide-[#e5e7eb]">
          <div className="grid gap-3 px-5 py-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
            <div className="pt-2 text-sm font-medium text-[#374151]">
              상품명
            </div>
            <div>
              <input
                name="name"
                type="text"
                defaultValue={initialProduct?.name ?? ""}
                placeholder="상품명을 입력하세요"
                className="w-full rounded border border-[#cfd5dd] px-3 py-2 text-sm outline-none focus:border-[#2f6fed]"
              />
              {state.fieldErrors.name ? (
                <p className="mt-2 text-sm text-[#d9534f]">
                  {state.fieldErrors.name}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 px-5 py-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
            <div className="pt-2 text-sm font-medium text-[#374151]">
              판매가
            </div>
            <div>
              <input
                name="price"
                type="hidden"
                value={normalizePriceInput(priceInput)}
                readOnly
              />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={priceInput}
                onChange={(event) => {
                  setPriceInput(formatPriceInput(event.target.value));
                }}
                placeholder="숫자만 입력"
                className="w-full rounded border border-[#cfd5dd] px-3 py-2 text-sm outline-none focus:border-[#2f6fed]"
              />
              {state.fieldErrors.price ? (
                <p className="mt-2 text-sm text-[#d9534f]">
                  {state.fieldErrors.price}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 px-5 py-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
            <div className="pt-2 text-sm font-medium text-[#374151]">
              상품 설명
            </div>
            <div>
              <textarea
                name="description"
                defaultValue={initialProduct?.description ?? ""}
                rows={8}
                placeholder="상품 설명을 입력하세요"
                className="w-full rounded border border-[#cfd5dd] px-3 py-2 text-sm outline-none focus:border-[#2f6fed]"
              />
              {state.fieldErrors.description ? (
                <p className="mt-2 text-sm text-[#d9534f]">
                  {state.fieldErrors.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="border border-[#d9dde3] bg-white">
        <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-5 py-3 text-sm font-medium">
          썸네일 이미지
        </div>
        <div className="grid gap-4 px-5 py-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
          <div className="pt-2 text-sm font-medium text-[#374151]">
            대표 이미지
          </div>
          <div className="space-y-3">
            <input
              id={thumbnailInputId}
              name="thumbnail"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  setThumbnailFileName("");
                  setThumbnailPreview(initialProduct?.thumbnailUrl ?? null);
                  return;
                }

                setThumbnailFileName(file.name);
                setThumbnailPreview(URL.createObjectURL(file));
              }}
            />

            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor={thumbnailInputId}
                className="inline-flex cursor-pointer items-center rounded border border-[#c7ccd4] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f7f8fa]"
              >
                대표 이미지 선택
              </label>
              {thumbnailFileName ? (
                <span className="text-sm text-[#4b5563]">{thumbnailFileName}</span>
              ) : null}
            </div>

            <div className="flex h-40 w-40 items-center justify-center overflow-hidden border border-[#d9dde3] bg-[#f9fafb]">
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="썸네일 미리보기"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-[#9ca3af]">미리보기 없음</span>
              )}
            </div>

            {initialProduct?.thumbnailUrl ? (
              <label className="flex items-center gap-2 text-sm text-[#4b5563]">
                <input
                  name="removeThumbnail"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#cfd5dd]"
                />
                기존 썸네일 삭제
              </label>
            ) : null}

            {state.fieldErrors.thumbnail ? (
              <p className="text-sm text-[#d9534f]">
                {state.fieldErrors.thumbnail}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border border-[#d9dde3] bg-white">
        <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-5 py-3 text-sm font-medium">
          상세 이미지
        </div>
        <div className="space-y-5 px-5 py-4">
          <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
            <div className="pt-2 text-sm font-medium text-[#374151]">
              이미지 추가
            </div>
            <div>
              <input
                id={detailInputId}
                name="detailImages"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  detailPreviews.forEach((preview) => URL.revokeObjectURL(preview));

                  const files = Array.from(event.target.files ?? []);
                  const previews = files.map((file) => URL.createObjectURL(file));

                  setDetailFileCount(files.length);
                  setDetailPreviews(previews);
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor={detailInputId}
                  className="inline-flex cursor-pointer items-center rounded border border-[#c7ccd4] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f7f8fa]"
                >
                  상세 이미지 선택
                </label>
                {detailFileCount > 0 ? (
                  <span className="text-sm text-[#4b5563]">
                    {detailFileCount}개 선택됨
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[#6b7280]">
                여러 장을 선택하면 한 번에 업로드됩니다.
              </p>
              {state.fieldErrors.detailImages ? (
                <p className="mt-2 text-sm text-[#d9534f]">
                  {state.fieldErrors.detailImages}
                </p>
              ) : null}
            </div>
          </div>

          {initialProduct?.images.length ? (
            <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
              <div className="pt-2 text-sm font-medium text-[#374151]">
                등록된 이미지
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {initialProduct.images.map((image) => (
                  <label
                    key={image.id}
                    className="space-y-2 border border-[#d9dde3] bg-white p-3"
                  >
                    <img
                      src={image.url}
                      alt={`${initialProduct.name} 상세 이미지`}
                      className="aspect-[4/5] w-full border border-[#e5e7eb] object-cover"
                    />
                    <span className="flex items-center gap-2 text-sm text-[#4b5563]">
                      <input
                        name="deletedImageIds"
                        type="checkbox"
                        value={image.id}
                        className="h-4 w-4 rounded border-[#cfd5dd]"
                      />
                      삭제
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {detailPreviews.length ? (
            <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
              <div className="pt-2 text-sm font-medium text-[#374151]">
                새 이미지 미리보기
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {detailPreviews.map((preview, index) => (
                  <img
                    key={preview}
                    src={preview}
                    alt={`새 상세 이미지 ${index + 1}`}
                    className="aspect-[4/5] w-full border border-[#d9dde3] object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {state.status === "error" && state.message ? (
        <div className="border border-[#f1c5c4] bg-[#fff5f5] px-4 py-3 text-sm text-[#d9534f]">
          {state.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d9dde3] pt-4">
        <Link
          href="/admin"
          className="inline-flex items-center rounded border border-[#c7ccd4] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f7f8fa]"
        >
          목록으로
        </Link>
        <SubmitButton
          idleLabel={mode === "create" ? "상품 등록" : "수정 저장"}
          pendingLabel={mode === "create" ? "등록 중..." : "저장 중..."}
        />
      </div>
    </form>
  );
}
