"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
} from "react";

import { saveCarouselAction } from "@/app/admin/carousel/actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import {
  initialCarouselFormState,
  type CarouselSlide,
} from "@/types/carousel";

type CarouselImageFormItem =
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

interface CarouselManagerProps {
  slides: CarouselSlide[];
  randomizeOrder: boolean;
}

function createImageKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `carousel-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildInitialSlideItems(slides: CarouselSlide[]): CarouselImageFormItem[] {
  return slides.map((slide, index) => ({
    key: slide.id,
    kind: "existing" as const,
    imageId: slide.id,
    url: slide.imageUrl,
    label: `캐러셀 이미지 ${index + 1}`,
  }));
}

function isNewSlideItem(
  item: CarouselImageFormItem,
): item is Extract<CarouselImageFormItem, { kind: "new" }> {
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

function reorderItems(
  items: CarouselImageFormItem[],
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

export function CarouselManager({
  slides,
  randomizeOrder,
}: CarouselManagerProps) {
  const [formState, formAction] = useActionState(
    saveCarouselAction,
    initialCarouselFormState,
  );
  const imageInputId = useId();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadDropDepthRef = useRef(0);
  const slideItemsRef = useRef<CarouselImageFormItem[]>(
    buildInitialSlideItems(slides),
  );
  const [slideItems, setSlideItems] = useState<CarouselImageFormItem[]>(
    () => buildInitialSlideItems(slides),
  );
  const [deletedSlideIds, setDeletedSlideIds] = useState<string[]>([]);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [isUploadDragActive, setIsUploadDragActive] = useState(false);
  const [isRandomOrder, setIsRandomOrder] = useState(randomizeOrder);

  useEffect(() => {
    slideItemsRef.current = slideItems;
  }, [slideItems]);

  useEffect(() => {
    return () => {
      slideItemsRef.current.forEach((item) => {
        if (isNewSlideItem(item)) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  function syncInputFiles(items: CarouselImageFormItem[]) {
    const input = imageInputRef.current;

    if (!input || typeof DataTransfer === "undefined") {
      return;
    }

    const dataTransfer = new DataTransfer();

    items.forEach((item) => {
      if (isNewSlideItem(item)) {
        dataTransfer.items.add(item.file);
      }
    });

    input.files = dataTransfer.files;
  }

  function applySlideItems(nextItems: CarouselImageFormItem[]) {
    setSlideItems(nextItems);
    syncInputFiles(nextItems);
  }

  function handleAddImages(files: File[]) {
    const imageFiles = files.filter((file) => isImageFile(file));

    if (!imageFiles.length) {
      return;
    }

    const nextItems = imageFiles.map((file) => ({
      key: createImageKey(),
      kind: "new" as const,
      file,
      url: URL.createObjectURL(file),
      label: getFileSortKey(file),
    }));

    applySlideItems([...slideItems, ...nextItems]);
  }

  function handleRemoveSlide(itemKey: string) {
    const target = slideItems.find((item) => item.key === itemKey);

    if (!target) {
      return;
    }

    if (isNewSlideItem(target)) {
      URL.revokeObjectURL(target.url);
    } else {
      setDeletedSlideIds((current) =>
        current.includes(target.imageId)
          ? current
          : [...current, target.imageId],
      );
    }

    applySlideItems(slideItems.filter((item) => item.key !== itemKey));
    setDraggingKey(null);
    setDropTargetKey(null);
  }

  function handleDragStart(itemKey: string) {
    setDraggingKey(itemKey);
    setDropTargetKey(itemKey);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, itemKey: string) {
    event.preventDefault();

    if (!draggingKey || draggingKey === itemKey) {
      return;
    }

    setDropTargetKey(itemKey);
  }

  function handleDrop(itemKey: string) {
    if (!draggingKey || draggingKey === itemKey) {
      setDropTargetKey(null);
      return;
    }

    applySlideItems(reorderItems(slideItems, draggingKey, itemKey));
    setDraggingKey(null);
    setDropTargetKey(null);
  }

  function resetDragState() {
    setDraggingKey(null);
    setDropTargetKey(null);
  }

  function activateUploadDropZone() {
    uploadDropDepthRef.current += 1;
    setIsUploadDragActive(true);
  }

  function deactivateUploadDropZone(force = false) {
    uploadDropDepthRef.current = force
      ? 0
      : Math.max(0, uploadDropDepthRef.current - 1);
    setIsUploadDragActive(uploadDropDepthRef.current > 0);
  }

  function handleUploadDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    activateUploadDropZone();
  }

  function handleUploadDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleUploadDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    deactivateUploadDropZone();
  }

  async function handleUploadDrop(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    deactivateUploadDropZone(true);

    const droppedFiles = await collectDroppedImageFiles(event.dataTransfer);

    if (!droppedFiles.length) {
      return;
    }

    handleAddImages(droppedFiles);
  }

  return (
    <form action={formAction} className="space-y-6">
      <section className="border border-[#d9dde3] bg-white">
        <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">캐러셀 관리</h2>
              <p className="mt-1 text-sm leading-6 text-[#6b7280]">
                홈 상단에 노출할 이미지를 등록하고, 카드 드래그로 순서를 바꿀 수
                있습니다.
              </p>
            </div>

            <label className="inline-flex items-center gap-3 rounded border border-[#d9dde3] bg-white px-4 py-3 text-sm text-[#374151]">
              <input
                name="randomizeOrder"
                type="checkbox"
                checked={isRandomOrder}
                onChange={(event) => setIsRandomOrder(event.target.checked)}
                className="h-4 w-4 rounded border-[#cfd5dd]"
              />
              <span className="font-medium">보여지는 이미지 순서를 랜덤으로 섞기</span>
            </label>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <input
            ref={imageInputRef}
            id={imageInputId}
            name="images"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              handleAddImages(Array.from(event.target.files ?? []));
              event.currentTarget.value = "";
            }}
          />

          <div
            onDragEnter={handleUploadDragEnter}
            onDragOver={handleUploadDragOver}
            onDragLeave={handleUploadDragLeave}
            onDrop={handleUploadDrop}
            className={`rounded border border-dashed px-5 py-5 transition ${
              isUploadDragActive
                ? "border-[#2f6fed] bg-[#eef5ff]"
                : "border-[#cfd5dd] bg-[#fafafa]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor={imageInputId}
                className="inline-flex cursor-pointer items-center rounded border border-[#c7ccd4] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f7f8fa]"
              >
                캐러셀 이미지 선택
              </label>
              {slideItems.length ? (
                <span className="text-sm text-[#4b5563]">
                  총 {slideItems.length}장 구성 중
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-[#6b7280]">
              이미지 파일 여러 장이나 이미지가 들어 있는 폴더를 이 영역으로
              바로 드래그해서 추가할 수 있습니다.
            </p>
          </div>

          {formState.status === "error" && formState.message ? (
            <div className="border border-[#f1c5c4] bg-[#fff5f5] px-4 py-3 text-sm text-[#d9534f]">
              {formState.message}
            </div>
          ) : null}

          {formState.fieldErrors.images ? (
            <p className="text-sm text-[#d9534f]">{formState.fieldErrors.images}</p>
          ) : null}

          {deletedSlideIds.map((slideId) => (
            <input
              key={`deleted-${slideId}`}
              type="hidden"
              name="deletedSlideIds"
              value={slideId}
            />
          ))}

          {slideItems.map((item) => (
            <input
              key={`order-${item.key}`}
              type="hidden"
              name="slideOrder"
              value={item.kind === "existing" ? `existing:${item.imageId}` : "new"}
            />
          ))}

          <div className="space-y-3">
            <p className="text-xs text-[#6b7280]">
              카드 자체를 드래그해서 노출 순서를 바꿀 수 있습니다.
            </p>

            {slideItems.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {slideItems.map((item, index) => {
                  const isDragging = draggingKey === item.key;
                  const isDropTarget =
                    dropTargetKey === item.key && draggingKey !== item.key;

                  return (
                    <div
                      key={item.key}
                      draggable
                      onDragStart={() => handleDragStart(item.key)}
                      onDragOver={(event) => handleDragOver(event, item.key)}
                      onDrop={() => handleDrop(item.key)}
                      onDragEnd={resetDragState}
                      className={`overflow-hidden border transition ${
                        isDragging
                          ? "border-[#d9dde3] bg-white opacity-70 shadow-[0_12px_24px_rgba(17,24,39,0.08)]"
                          : isDropTarget
                            ? "border-[#2f6fed] bg-[#eef5ff] ring-2 ring-[#2f6fed] shadow-[0_12px_24px_rgba(47,111,237,0.18)]"
                            : "border-[#d9dde3] bg-white"
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={`${index + 1}번 캐러셀 이미지`}
                        className="aspect-[16/10] w-full border-b border-[#e5e7eb] object-cover"
                      />

                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">
                              {index + 1}번 슬라이드
                            </p>
                            <p className="mt-1 text-xs text-[#6b7280]">
                              {item.kind === "existing" ? "기존 등록분" : "새 이미지"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlide(item.key)}
                            className="inline-flex items-center justify-center rounded border border-[#d9534f] bg-white px-3 py-2 text-xs font-medium text-[#d9534f] hover:bg-[#fff5f5]"
                          >
                            삭제
                          </button>
                        </div>

                        <p className="truncate text-xs text-[#4b5563]">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-[#d9dde3] bg-[#fafafa] px-5 py-12 text-center text-sm text-[#6b7280]">
                아직 등록된 캐러셀 이미지가 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d9dde3] pt-4">
        <p className="text-sm leading-6 text-[#6b7280]">
          저장하면 홈 상단 캐러셀에 바로 반영됩니다.
        </p>
        <SubmitButton idleLabel="캐러셀 저장" pendingLabel="저장 중..." />
      </div>
    </form>
  );
}
