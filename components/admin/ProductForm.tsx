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
import {
  formatSaleDateTimeInput,
  formatSalePeriod,
} from "@/lib/product-sale";
import {
  PRODUCT_COLORS,
  PRODUCT_COLOR_LABELS,
  PRODUCT_COLOR_SWATCHES,
  PRODUCT_SIZES,
  type ProductSaleMode,
} from "@/types/product";

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

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function isFileSystemFileEntry(
  entry: FileSystemEntry,
): entry is FileSystemFileEntry {
  return entry.isFile;
}

function isFileSystemDirectoryEntry(
  entry: FileSystemEntry,
): entry is FileSystemDirectoryEntry {
  return entry.isDirectory;
}

function getFileSortKey(file: File) {
  return file.webkitRelativePath || file.name;
}

async function readFileFromEntry(entry: FileSystemFileEntry) {
  return new Promise<File | null>((resolve) => {
    entry.file(
      (file) => resolve(file),
      () => resolve(null),
    );
  });
}

async function readAllDirectoryEntries(reader: FileSystemDirectoryReader) {
  const entries: FileSystemEntry[] = [];

  while (true) {
    const batch = await new Promise<FileSystemEntry[]>((resolve) => {
      reader.readEntries(
        (nextEntries) => resolve(nextEntries),
        () => resolve([]),
      );
    });

    if (!batch.length) {
      return entries;
    }

    entries.push(...batch);
  }
}

async function collectImageFilesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  if (isFileSystemFileEntry(entry)) {
    const file = await readFileFromEntry(entry);
    return file && isImageFile(file) ? [file] : [];
  }

  if (!isFileSystemDirectoryEntry(entry)) {
    return [];
  }

  const entries = await readAllDirectoryEntries(entry.createReader());
  const nestedFiles = await Promise.all(
    entries.map((childEntry) => collectImageFilesFromEntry(childEntry)),
  );

  return nestedFiles.flat();
}

async function collectDroppedImageFiles(dataTransfer: DataTransfer) {
  const items = Array.from(dataTransfer.items ?? []);

  if (!items.length) {
    return Array.from(dataTransfer.files ?? [])
      .filter((file) => isImageFile(file))
      .sort((left, right) =>
        getFileSortKey(left).localeCompare(getFileSortKey(right), "ko-KR", {
          numeric: true,
          sensitivity: "base",
        }),
      );
  }

  const fileLists = await Promise.all(
    items.map(async (item) => {
      if (item.kind !== "file") {
        return [] as File[];
      }

      const webkitEntry = (
        item as DataTransferItem & {
          webkitGetAsEntry?: () => FileSystemEntry | null;
        }
      ).webkitGetAsEntry?.();

      if (webkitEntry) {
        return collectImageFilesFromEntry(webkitEntry);
      }

      const file = item.getAsFile();
      return file && isImageFile(file) ? [file] : [];
    }),
  );

  return fileLists
    .flat()
    .sort((left, right) =>
      getFileSortKey(left).localeCompare(getFileSortKey(right), "ko-KR", {
        numeric: true,
        sensitivity: "base",
      }),
    );
}

function hasDraggedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
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
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);
  const thumbnailObjectUrlRef = useRef<string | null>(null);
  const thumbnailDropDepthRef = useRef(0);
  const detailDropDepthRef = useRef(0);
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
  const [isThumbnailDragActive, setIsThumbnailDragActive] = useState(false);
  const [isDetailDragActive, setIsDetailDragActive] = useState(false);
  const [deletedExistingImageIds, setDeletedExistingImageIds] = useState<string[]>(
    [],
  );
  const [priceInput, setPriceInput] = useState(() =>
    initialProduct?.price !== undefined
      ? formatPriceInput(String(initialProduct.price))
      : "",
  );
  const [saleMode, setSaleMode] = useState<ProductSaleMode>(
    initialProduct?.saleMode ?? "always",
  );
  const [saleStartInput, setSaleStartInput] = useState(() =>
    formatSaleDateTimeInput(initialProduct?.saleStartAt),
  );
  const [saleEndInput, setSaleEndInput] = useState(() =>
    formatSaleDateTimeInput(initialProduct?.saleEndAt),
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

  function syncThumbnailInputFile(file: File | null) {
    const input = thumbnailInputRef.current;

    if (!input || typeof DataTransfer === "undefined") {
      return;
    }

    const dataTransfer = new DataTransfer();

    if (file) {
      dataTransfer.items.add(file);
    }

    input.files = dataTransfer.files;
  }

  function handleThumbnailSelection(file: File | null) {
    if (!file) {
      if (thumbnailObjectUrlRef.current) {
        URL.revokeObjectURL(thumbnailObjectUrlRef.current);
        thumbnailObjectUrlRef.current = null;
      }

      setThumbnailFileName("");
      setThumbnailPreview(initialProduct?.thumbnailUrl ?? null);
      syncThumbnailInputFile(null);
      return;
    }

    if (thumbnailObjectUrlRef.current) {
      URL.revokeObjectURL(thumbnailObjectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    thumbnailObjectUrlRef.current = previewUrl;
    setThumbnailFileName(file.name);
    setThumbnailPreview(previewUrl);
    syncThumbnailInputFile(file);
  }

  function applyDetailImageItems(nextItems: DetailImageFormItem[]) {
    setDetailImageItems(nextItems);
    syncDetailInputFiles(nextItems);
  }

  function handleAddDetailImages(files: File[]) {
    const imageFiles = files.filter((file) => isImageFile(file));

    if (!imageFiles.length) {
      return;
    }

    const nextItems: DetailImageFormItem[] = imageFiles.map((file) => ({
      key: createImageKey(),
      kind: "new",
      file,
      url: URL.createObjectURL(file),
      label: getFileSortKey(file),
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

  function activateDropZone(target: "thumbnail" | "detail") {
    if (target === "thumbnail") {
      thumbnailDropDepthRef.current += 1;
      setIsThumbnailDragActive(true);
      return;
    }

    detailDropDepthRef.current += 1;
    setIsDetailDragActive(true);
  }

  function deactivateDropZone(target: "thumbnail" | "detail", force = false) {
    if (target === "thumbnail") {
      thumbnailDropDepthRef.current = force
        ? 0
        : Math.max(0, thumbnailDropDepthRef.current - 1);
      setIsThumbnailDragActive(thumbnailDropDepthRef.current > 0);
      return;
    }

    detailDropDepthRef.current = force
      ? 0
      : Math.max(0, detailDropDepthRef.current - 1);
    setIsDetailDragActive(detailDropDepthRef.current > 0);
  }

  function handleDropZoneDragEnter(
    target: "thumbnail" | "detail",
    event: DragEvent<HTMLDivElement>,
  ) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    activateDropZone(target);
  }

  function handleDropZoneDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDropZoneDragLeave(
    target: "thumbnail" | "detail",
    event: DragEvent<HTMLDivElement>,
  ) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    deactivateDropZone(target);
  }

  async function handleThumbnailDrop(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    deactivateDropZone("thumbnail", true);

    const droppedFiles = await collectDroppedImageFiles(event.dataTransfer);
    const nextThumbnailFile = droppedFiles[0];

    if (!nextThumbnailFile) {
      return;
    }

    handleThumbnailSelection(nextThumbnailFile);
  }

  async function handleDetailDrop(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    deactivateDropZone("detail", true);

    const droppedFiles = await collectDroppedImageFiles(event.dataTransfer);

    if (!droppedFiles.length) {
      return;
    }

    handleAddDetailImages(droppedFiles);
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
              판매 기간
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-[#cfd5dd] bg-white px-3 py-2 text-sm hover:bg-[#f7f8fa]">
                  <input
                    name="saleMode"
                    type="radio"
                    value="always"
                    checked={saleMode === "always"}
                    onChange={() => setSaleMode("always")}
                    className="h-4 w-4 border-[#cfd5dd]"
                  />
                  <span>상시 판매</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-[#cfd5dd] bg-white px-3 py-2 text-sm hover:bg-[#f7f8fa]">
                  <input
                    name="saleMode"
                    type="radio"
                    value="period"
                    checked={saleMode === "period"}
                    onChange={() => setSaleMode("period")}
                    className="h-4 w-4 border-[#cfd5dd]"
                  />
                  <span>기간 판매</span>
                </label>
              </div>

              {saleMode === "period" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#374151]">
                      판매 시작
                    </label>
                    <input
                      name="saleStartAt"
                      type="datetime-local"
                      value={saleStartInput}
                      onChange={(event) => setSaleStartInput(event.target.value)}
                      className="w-full rounded border border-[#cfd5dd] px-3 py-2 text-sm outline-none focus:border-[#2f6fed]"
                    />
                    {state.fieldErrors.saleStartAt ? (
                      <p className="mt-2 text-sm text-[#d9534f]">
                        {state.fieldErrors.saleStartAt}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#374151]">
                      판매 종료
                    </label>
                    <input
                      name="saleEndAt"
                      type="datetime-local"
                      value={saleEndInput}
                      onChange={(event) => setSaleEndInput(event.target.value)}
                      className="w-full rounded border border-[#cfd5dd] px-3 py-2 text-sm outline-none focus:border-[#2f6fed]"
                    />
                    {state.fieldErrors.saleEndAt ? (
                      <p className="mt-2 text-sm text-[#d9534f]">
                        {state.fieldErrors.saleEndAt}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <input name="saleStartAt" type="hidden" value="" />
                  <input name="saleEndAt" type="hidden" value="" />
                </>
              )}

              <div className="rounded border border-[#e5e7eb] bg-[#f8f9fb] px-3 py-3 text-xs leading-6 text-[#6b7280]">
                {saleMode === "always"
                  ? "상시 판매를 선택하면 주문 가능 시간이 항상 열려 있습니다."
                  : "기간 판매를 선택하면 상세 페이지에 남은 시간이 실시간으로 표시되고, 기간 외에는 주문이 막힙니다."}
                {initialProduct?.saleMode === "period" &&
                initialProduct.saleStartAt &&
                initialProduct.saleEndAt ? (
                  <p className="mt-1 text-[#4b5563]">
                    현재 저장된 기간:{" "}
                    {formatSalePeriod(
                      initialProduct.saleStartAt,
                      initialProduct.saleEndAt,
                    )}
                  </p>
                ) : null}
              </div>

              {state.fieldErrors.saleMode ? (
                <p className="text-sm text-[#d9534f]">
                  {state.fieldErrors.saleMode}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 px-5 py-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
            <div className="pt-2 text-sm font-medium text-[#374151]">
              판매 사이즈
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_SIZES.map((size) => (
                  <label
                    key={size}
                    className="inline-flex cursor-pointer items-center gap-2 rounded border border-[#cfd5dd] bg-white px-3 py-2 text-sm hover:bg-[#f7f8fa]"
                  >
                    <input
                      name="sizes"
                      type="checkbox"
                      value={size}
                      defaultChecked={initialProduct?.sizeOptions.includes(size) ?? false}
                      className="h-4 w-4 rounded border-[#cfd5dd]"
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#6b7280]">
                판매 가능한 사이즈를 모두 선택해 주세요.
              </p>
              {state.fieldErrors.sizes ? (
                <p className="mt-2 text-sm text-[#d9534f]">
                  {state.fieldErrors.sizes}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 px-5 py-4 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
            <div className="pt-2 text-sm font-medium text-[#374151]">
              판매 색상
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_COLORS.map((color) => (
                  <label
                    key={color}
                    className="inline-flex cursor-pointer items-center gap-2 rounded border border-[#cfd5dd] bg-white px-3 py-2 text-sm hover:bg-[#f7f8fa]"
                  >
                    <input
                      name="colors"
                      type="checkbox"
                      value={color}
                      defaultChecked={initialProduct?.colorOptions.includes(color) ?? false}
                      className="h-4 w-4 rounded border-[#cfd5dd]"
                    />
                    <span
                      className="h-3 w-3 rounded-full border border-black/15"
                      style={{ backgroundColor: PRODUCT_COLOR_SWATCHES[color] }}
                    />
                    <span>{PRODUCT_COLOR_LABELS[color]}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#6b7280]">
                상품 상세 페이지에서 선택 가능한 색상을 설정합니다.
              </p>
              {state.fieldErrors.colors ? (
                <p className="mt-2 text-sm text-[#d9534f]">
                  {state.fieldErrors.colors}
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
              ref={thumbnailInputRef}
              id={thumbnailInputId}
              name="thumbnail"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                handleThumbnailSelection(event.target.files?.[0] ?? null);
              }}
            />

            <div
              onDragEnter={(event) => handleDropZoneDragEnter("thumbnail", event)}
              onDragOver={handleDropZoneDragOver}
              onDragLeave={(event) => handleDropZoneDragLeave("thumbnail", event)}
              onDrop={handleThumbnailDrop}
              className={`rounded border border-dashed px-4 py-4 transition ${
                isThumbnailDragActive
                  ? "border-[#2f6fed] bg-[#eef5ff]"
                  : "border-[#cfd5dd] bg-[#fafafa]"
              }`}
            >
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
              <p className="mt-3 text-sm leading-6 text-[#6b7280]">
                이미지 파일을 이 영역으로 바로 드래그해 대표 이미지를 등록할 수
                있습니다.
              </p>
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

              <div
                onDragEnter={(event) => handleDropZoneDragEnter("detail", event)}
                onDragOver={handleDropZoneDragOver}
                onDragLeave={(event) => handleDropZoneDragLeave("detail", event)}
                onDrop={handleDetailDrop}
                className={`rounded border border-dashed px-4 py-4 transition ${
                  isDetailDragActive
                    ? "border-[#2f6fed] bg-[#eef5ff]"
                    : "border-[#cfd5dd] bg-[#fafafa]"
                }`}
              >
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

                <p className="mt-3 text-sm leading-6 text-[#6b7280]">
                  이미지 파일 여러 장은 물론, 이미지가 들어 있는 폴더도 이
                  영역으로 드래그해서 한 번에 추가할 수 있습니다.
                </p>
                <p className="mt-1 text-sm leading-6 text-[#6b7280]">
                  이미 선택한 이미지가 있어도 계속 추가할 수 있고, 카드 자체를
                  드래그해서 순서를 바꾸고 개별 삭제도 가능합니다.
                </p>
              </div>

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
