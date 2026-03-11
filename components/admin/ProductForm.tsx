/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
} from "react";

import type { ProductDetail, ProductFormState } from "@/types/admin-product";
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

type DetailImageFormItem =
  | {
      key: string;
      kind: "existing";
      imageId: string;
      url: string;
      label: string;
    }
  | {
      key: string;
      kind: "new";
      file: File;
      url: string;
      label: string;
    };

function createImageKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `detail-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isNewDetailImage(
  item: DetailImageFormItem,
): item is Extract<DetailImageFormItem, { kind: "new" }> {
  return item.kind === "new";
}

function buildInitialDetailImageItems(initialProduct?: ProductDetail) {
  return (
    initialProduct?.images.map((image) => ({
      key: image.id,
      kind: "existing" as const,
      imageId: image.id,
      url: image.url,
      label: `기존 이미지 ${image.sortOrder + 1}`,
    })) ?? []
  );
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

function reorderItems(
  items: DetailImageFormItem[],
  draggedKey: string,
  targetKey: string,
) {
  const fromIndex = items.findIndex((item) => item.key === draggedKey);
  const toIndex = items.findIndex((item) => item.key === targetKey);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

export function ProductForm({
  mode,
  action,
  initialProduct,
}: ProductFormProps) {
  const [state, formAction] = useActionState(action, initialProductFormState);
  const thumbnailInputId = useId();
  const detailInputId = useId();
  const detailInputRef = useRef<HTMLInputElement>(null);
  const thumbnailObjectUrlRef = useRef<string | null>(null);
  const detailImageItemsRef = useRef<DetailImageFormItem[]>(
    buildInitialDetailImageItems(initialProduct),
  );
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialProduct?.thumbnailUrl ?? null,
  );
  const [thumbnailFileName, setThumbnailFileName] = useState("");
  const [detailImageItems, setDetailImageItems] = useState<DetailImageFormItem[]>(
    () => buildInitialDetailImageItems(initialProduct),
  );
  const [draggingDetailKey, setDraggingDetailKey] = useState<string | null>(null);
  const [dropTargetDetailKey, setDropTargetDetailKey] = useState<string | null>(
    null,
  );
  const [deletedExistingImageIds, setDeletedExistingImageIds] = useState<string[]>(
    [],
  );
  const [priceInput, setPriceInput] = useState(() =>
    initialProduct?.price !== undefined
      ? formatPriceInput(String(initialProduct.price))
      : "",
  );

  useEffect(() => {
    detailImageItemsRef.current = detailImageItems;
  }, [detailImageItems]);

  useEffect(() => {
    return () => {
      if (thumbnailObjectUrlRef.current) {
        URL.revokeObjectURL(thumbnailObjectUrlRef.current);
      }

      detailImageItemsRef.current.forEach((item) => {
        if (isNewDetailImage(item)) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  function syncDetailInputFiles(items: DetailImageFormItem[]) {
    const input = detailInputRef.current;

    if (!input || typeof DataTransfer === "undefined") {
      return;
    }

    const dataTransfer = new DataTransfer();

    items.forEach((item) => {
      if (isNewDetailImage(item)) {
        dataTransfer.items.add(item.file);
      }
    });

    input.files = dataTransfer.files;
  }

  function applyDetailImageItems(nextItems: DetailImageFormItem[]) {
    setDetailImageItems(nextItems);
    syncDetailInputFiles(nextItems);
  }

  function handleAddDetailImages(files: File[]) {
    if (!files.length) {
      return;
    }

    const nextItems: DetailImageFormItem[] = files.map((file) => ({
      key: createImageKey(),
      kind: "new",
      file,
      url: URL.createObjectURL(file),
      label: file.name,
    }));

    applyDetailImageItems([...detailImageItems, ...nextItems]);
  }

  function handleRemoveDetailImage(itemKey: string) {
    const target = detailImageItems.find((item) => item.key === itemKey);

    if (!target) {
      return;
    }

    if (isNewDetailImage(target)) {
      URL.revokeObjectURL(target.url);
    } else {
      setDeletedExistingImageIds((current) =>
        current.includes(target.imageId)
          ? current
          : [...current, target.imageId],
      );
    }

    applyDetailImageItems(detailImageItems.filter((item) => item.key !== itemKey));
    setDraggingDetailKey(null);
    setDropTargetDetailKey(null);
  }

  function handleDragStart(itemKey: string) {
    setDraggingDetailKey(itemKey);
    setDropTargetDetailKey(itemKey);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, itemKey: string) {
    event.preventDefault();

    if (!draggingDetailKey || draggingDetailKey === itemKey) {
      return;
    }

    setDropTargetDetailKey(itemKey);
  }

  function handleDrop(itemKey: string) {
    if (!draggingDetailKey || draggingDetailKey === itemKey) {
      setDropTargetDetailKey(null);
      return;
    }

    applyDetailImageItems(
      reorderItems(detailImageItems, draggingDetailKey, itemKey),
    );
    setDraggingDetailKey(null);
    setDropTargetDetailKey(null);
  }

  function resetDragState() {
    setDraggingDetailKey(null);
    setDropTargetDetailKey(null);
  }

  return (
    <form action={formAction} className="space-y-6">
      <section className="border border-[#d9dde3] bg-white">
        <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-5 py-3 text-sm font-medium">
          기본 정보
        </div>
        <div className="divide-y divide-[#e5e7eb]">
          <div className="grid gap-3 px-5 py-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
            <div className="pt-2 text-sm font-medium text-[#374151]">상품명</div>
            <div>
              <input
                name="name"
                type="text"
                defaultValue={initialProduct?.name ?? ""}
                placeholder="상품명을 입력해 주세요."
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
            <div className="pt-2 text-sm font-medium text-[#374151]">판매가</div>
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
                placeholder="상품 설명을 입력해 주세요."
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
                  if (thumbnailObjectUrlRef.current) {
                    URL.revokeObjectURL(thumbnailObjectUrlRef.current);
                    thumbnailObjectUrlRef.current = null;
                  }

                  setThumbnailFileName("");
                  setThumbnailPreview(initialProduct?.thumbnailUrl ?? null);
                  return;
                }

                if (thumbnailObjectUrlRef.current) {
                  URL.revokeObjectURL(thumbnailObjectUrlRef.current);
                }

                const previewUrl = URL.createObjectURL(file);
                thumbnailObjectUrlRef.current = previewUrl;
                setThumbnailFileName(file.name);
                setThumbnailPreview(previewUrl);
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
                기존 대표 이미지 삭제
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
            <div className="space-y-2">
              <input
                ref={detailInputRef}
                id={detailInputId}
                name="detailImages"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  handleAddDetailImages(Array.from(event.target.files ?? []));
                }}
              />

              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor={detailInputId}
                  className="inline-flex cursor-pointer items-center rounded border border-[#c7ccd4] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f7f8fa]"
                >
                  {detailImageItems.length
                    ? "상세 이미지 추가"
                    : "상세 이미지 선택"}
                </label>
                {detailImageItems.length ? (
                  <span className="text-sm text-[#4b5563]">
                    총 {detailImageItems.length}장 등록 예정
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-[#6b7280]">
                이미 선택한 이미지가 있어도 계속 추가할 수 있습니다. 카드 자체를
                드래그해서 순서를 바꾸고, 개별 삭제도 가능합니다.
              </p>

              {state.fieldErrors.detailImages ? (
                <p className="text-sm text-[#d9534f]">
                  {state.fieldErrors.detailImages}
                </p>
              ) : null}
            </div>
          </div>

          {deletedExistingImageIds.map((imageId) => (
            <input
              key={`deleted-${imageId}`}
              type="hidden"
              name="deletedImageIds"
              value={imageId}
            />
          ))}

          {detailImageItems.map((item) => (
            <input
              key={`order-${item.key}`}
              type="hidden"
              name="detailImageOrder"
              value={item.kind === "existing" ? `existing:${item.imageId}` : "new"}
            />
          ))}

          <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
            <div className="pt-2 text-sm font-medium text-[#374151]">
              이미지 목록
            </div>
            <div className="space-y-3">
              <p className="text-xs text-[#6b7280]">
                드래그 후 원하는 이미지 카드 위에 놓으면 순서가 변경됩니다.
              </p>

              {detailImageItems.length ? (
                <div className="flex flex-wrap gap-4">
                  {detailImageItems.map((item, index) => {
                    const isDragging = draggingDetailKey === item.key;
                    const isDropTarget =
                      dropTargetDetailKey === item.key &&
                      draggingDetailKey !== item.key;
                    const isHighlighted = isDragging || isDropTarget;

                    return (
                      <div
                        key={item.key}
                        draggable
                        onDragStart={() => handleDragStart(item.key)}
                        onDragOver={(event) => handleDragOver(event, item.key)}
                        onDrop={() => handleDrop(item.key)}
                        onDragEnd={resetDragState}
                        className={`w-40 overflow-hidden border transition ${
                          isDragging
                            ? "border-[#d9dde3] bg-white opacity-70 shadow-[0_12px_24px_rgba(17,24,39,0.08)]"
                            : isDropTarget
                              ? "border-[#2f6fed] bg-[#eef5ff] ring-2 ring-[#2f6fed] shadow-[0_12px_24px_rgba(47,111,237,0.18)]"
                              : "border-[#d9dde3] bg-white"
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={`${index + 1}번 상세 이미지`}
                          className={`h-40 w-40 border-b object-cover ${
                            isHighlighted
                              ? "border-[#b7d4ff]"
                              : "border-[#e5e7eb]"
                          }`}
                        />

                        <div
                          className={`space-y-3 p-3 ${
                            isHighlighted ? "bg-[#eef5ff]" : "bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#111827]">
                                {index + 1}번 이미지
                              </p>
                              <p className="mt-1 text-xs text-[#6b7280]">
                                {item.kind === "existing"
                                  ? "기존 이미지"
                                  : "새 이미지"}
                              </p>
                            </div>
                          </div>

                          <p className="truncate text-xs text-[#4b5563]">
                            {item.label}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[#6b7280]">
                              {item.kind === "existing"
                                ? "기존 등록분"
                                : "이번 추가분"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDetailImage(item.key)}
                              className="inline-flex items-center justify-center rounded border border-[#d9534f] bg-white px-3 py-2 text-xs font-medium text-[#d9534f] hover:bg-[#fff5f5]"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-[#d9dde3] bg-[#fafafa] px-5 py-10 text-center text-sm text-[#6b7280]">
                  아직 선택한 상세 이미지가 없습니다.
                </div>
              )}
            </div>
          </div>
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
