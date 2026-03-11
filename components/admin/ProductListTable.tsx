"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteProductAction,
  reorderProductsAction,
} from "@/app/admin/products/actions";
import { formatDate, formatPrice } from "@/lib/admin/format";
import type { ProductListItem } from "@/types/admin-product";

import { ProductDeleteButton } from "./ProductDeleteButton";

interface ProductListTableProps {
  items: ProductListItem[];
  currentPage: number;
  pageSize: number;
}

function reorderItems(
  items: ProductListItem[],
  draggedId: string,
  targetId: string,
) {
  const fromIndex = items.findIndex((item) => item.id === draggedId);
  const toIndex = items.findIndex((item) => item.id === targetId);

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

function isSameOrder(left: ProductListItem[], right: ProductListItem[]) {
  return (
    left.length === right.length &&
    left.every((item, index) => item.id === right[index]?.id)
  );
}

export function ProductListTable({
  items,
  currentPage,
  pageSize,
}: ProductListTableProps) {
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [sortError, setSortError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!items.length) {
    return (
      <div className="border border-[#d9dde3] bg-white px-6 py-10 text-center">
        <p className="text-base font-semibold text-[#111827]">
          등록된 상품이 없습니다.
        </p>
        <p className="mt-2 text-sm text-[#6b7280]">
          상품을 먼저 등록해 주세요.
        </p>
        <Link
          href="/admin/products/new"
          className="mt-5 inline-flex items-center rounded border border-[#2f6fed] bg-[#2f6fed] px-4 py-2 text-sm font-medium text-white"
        >
          상품 등록
        </Link>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * pageSize;

  function updateOrder(nextItems: ProductListItem[]) {
    setOrderedItems(nextItems);
    setIsDirty(!isSameOrder(nextItems, items));
    setSortError(null);
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDropTargetId(null);
      return;
    }

    updateOrder(reorderItems(orderedItems, draggingId, targetId));
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleReset() {
    setOrderedItems(items);
    setDraggingId(null);
    setDropTargetId(null);
    setIsDirty(false);
    setSortError(null);
  }

  function handleSaveOrder() {
    if (!isDirty || isPending) {
      return;
    }

    const orderedProductIds = orderedItems.map((item) => item.id);

    startTransition(async () => {
      const result = await reorderProductsAction(currentPage, orderedProductIds);

      if (result.status === "error") {
        setSortError(result.message ?? "상품 진열순서 저장에 실패했습니다.");
        return;
      }

      setIsDirty(false);
      setSortError(null);
      router.replace(`/admin?page=${currentPage}&status=reordered`);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden border border-[#d9dde3] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
        <p className="text-sm text-[#4b5563]">
          행을 드래그해서 현재 페이지의 상품 진열순서를 바꾼 뒤 저장할 수
          있습니다.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {isDirty ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              className="inline-flex items-center rounded border border-[#c7ccd4] bg-white px-3 py-2 text-sm font-medium text-[#374151] hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-55"
            >
              순서 되돌리기
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={!isDirty || isPending}
            className="inline-flex min-w-28 items-center justify-center rounded border border-[#2f6fed] bg-[#2f6fed] px-4 py-2 text-sm font-medium text-white hover:bg-[#255fce] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isPending ? "저장 중..." : "순서 저장"}
          </button>
        </div>
      </div>

      {sortError ? (
        <div className="border-b border-[#f0c7c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318]">
          {sortError}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[#f8f9fb] text-sm text-[#374151]">
            <tr>
              <th className="border-b border-[#e5e7eb] px-4 py-3 font-medium">
                순서
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 font-medium">
                상품 정보
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 font-medium">
                판매가
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 font-medium">
                상세 이미지
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 font-medium">
                등록일
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 font-medium">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {orderedItems.map((item, index) => {
              const isDragging = draggingId === item.id;
              const isDropTarget = dropTargetId === item.id && !isDragging;
              const isHighlighted = isDragging || isDropTarget;
              const rowCellClass = isHighlighted
                ? "border-b border-[#e5e7eb] bg-[#eef5ff]"
                : "border-b border-[#e5e7eb] bg-white";
              const firstCellHighlightClass = isDropTarget
                ? "shadow-[inset_2px_0_0_#2f6fed,inset_0_2px_0_#2f6fed,inset_0_-2px_0_#2f6fed]"
                : "";
              const middleCellHighlightClass = isDropTarget
                ? "shadow-[inset_0_2px_0_#2f6fed,inset_0_-2px_0_#2f6fed]"
                : "";
              const lastCellHighlightClass = isDropTarget
                ? "shadow-[inset_-2px_0_0_#2f6fed,inset_0_2px_0_#2f6fed,inset_0_-2px_0_#2f6fed]"
                : "";

              return (
                <tr
                  key={item.id}
                  draggable={!isPending}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingId(item.id);
                    setDropTargetId(item.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggingId && draggingId !== item.id) {
                      setDropTargetId(item.id);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDrop(item.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDropTargetId(null);
                  }}
                  className={`align-middle text-sm text-[#111827] ${
                    isDragging ? "opacity-70" : ""
                  }`}
                >
                  <td className={`${rowCellClass} ${firstCellHighlightClass} px-4 py-4`}>
                    <div className="flex items-center gap-2 text-[#4b5563]">
                      <span
                        className={`inline-flex h-7 w-7 cursor-grab items-center justify-center rounded border text-xs font-semibold active:cursor-grabbing ${
                          isHighlighted
                            ? "border-[#2f6fed] bg-white text-[#2f6fed]"
                            : "border-[#d1d5db] bg-[#f8f9fb] text-[#6b7280]"
                        }`}
                      >
                        ↕
                      </span>
                      <span className="font-medium text-[#111827]">
                        {startIndex + index + 1}
                      </span>
                    </div>
                  </td>
                  <td className={`${rowCellClass} ${middleCellHighlightClass} px-4 py-4`}>
                    <div className="flex min-w-72 items-center gap-3">
                      <div
                        className={`flex h-16 w-16 items-center justify-center overflow-hidden border bg-[#f9fafb] ${
                          isHighlighted ? "border-[#b7d4ff]" : "border-[#e5e7eb]"
                        }`}
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] text-[#9ca3af]">없음</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="max-w-xl text-xs text-[#6b7280]">
                          {item.description || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`${rowCellClass} ${middleCellHighlightClass} px-4 py-4 font-medium`}
                  >
                    {formatPrice(item.price)}
                  </td>
                  <td
                    className={`${rowCellClass} ${middleCellHighlightClass} px-4 py-4 text-[#4b5563]`}
                  >
                    {item.detailImageCount}장
                  </td>
                  <td
                    className={`${rowCellClass} ${middleCellHighlightClass} px-4 py-4 text-[#4b5563]`}
                  >
                    {formatDate(item.createdAt)}
                  </td>
                  <td className={`${rowCellClass} ${lastCellHighlightClass} px-4 py-4`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/admin/products/${item.id}/edit`}
                        className="inline-flex items-center rounded border border-[#c7ccd4] bg-white px-3 py-2 text-xs font-medium hover:bg-[#f7f8fa]"
                      >
                        수정
                      </Link>
                      <ProductDeleteButton
                        action={deleteProductAction.bind(null, item.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
