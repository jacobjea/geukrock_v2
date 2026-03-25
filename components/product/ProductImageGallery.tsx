"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { getResizedImageUrl } from "@/lib/image-url";
import type { StorefrontProductImage } from "@/types/product";

interface ProductImageGalleryProps {
  productName: string;
  images: StorefrontProductImage[];
}

export function ProductImageGallery({
  productName,
  images,
}: ProductImageGalleryProps) {
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id ?? null);
  const selectedImage =
    images.find((image) => image.id === selectedImageId) ?? images[0] ?? null;

  if (!selectedImage) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center border border-black/10 bg-white text-sm text-black/40">
        등록된 이미지가 없습니다.
      </div>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[92px_minmax(0,1fr)] lg:items-start">
      <div className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:flex-col">
        {images.map((image, index) => {
          const isSelected = image.id === selectedImage.id;

          return (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedImageId(image.id)}
              className={`relative shrink-0 overflow-hidden border bg-white ${
                isSelected
                  ? "border-black"
                  : "border-black/10 hover:border-black/30"
              }`}
            >
              <img
                src={getResizedImageUrl(image.url, 184) ?? image.url}
                alt={`${productName} 썸네일 ${index + 1}`}
                className="h-20 w-20 object-cover lg:h-[92px] lg:w-[92px]"
                loading="lazy"
                decoding="async"
              />
              <span className="absolute left-2 top-2 bg-black/78 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {image.kind === "thumbnail" ? "대표" : "상세"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="order-1 overflow-hidden border border-black/10 bg-white lg:order-2">
        <div className="relative aspect-[4/5] bg-[#f5f3ee]">
          <img
            src={getResizedImageUrl(selectedImage.url, 1400) ?? selectedImage.url}
            alt={productName}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
