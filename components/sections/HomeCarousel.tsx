"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import { getResizedImageUrl } from "@/lib/image-url";
import type { StorefrontCarouselSlide } from "@/types/carousel";

interface HomeCarouselProps {
  slides: StorefrontCarouselSlide[];
}

export function HomeCarousel({ slides }: HomeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [slides.length]);

  if (!slides.length) {
    return null;
  }

  const canNavigate = slides.length > 1;

  function moveSlide(direction: "prev" | "next") {
    if (!canNavigate) {
      return;
    }

    setActiveIndex((currentIndex) => {
      if (direction === "prev") {
        return currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
      }

      return (currentIndex + 1) % slides.length;
    });
  }

  return (
    <section className="px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-[#111111]">
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={slide.id} className="relative min-w-full">
                <div className="relative aspect-[16/9] min-h-[340px] sm:min-h-[420px] lg:min-h-[560px]">
                  <img
                    src={getResizedImageUrl(slide.imageUrl, 2200) ?? slide.imageUrl}
                    alt={`홈 캐러셀 이미지 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.28)_75%,rgba(0,0,0,0.42))]" />
                </div>
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 sm:px-7">
            <div className="rounded-full border border-white/12 bg-black/18 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-white/78 backdrop-blur-sm">
              GEUKROCK / CAROUSEL
            </div>
            <div className="rounded-full border border-white/12 bg-black/18 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/78 backdrop-blur-sm">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(slides.length).padStart(2, "0")}
            </div>
          </div>

          {canNavigate ? (
            <>
              <button
                type="button"
                onClick={() => moveSlide("prev")}
                aria-label="이전 캐러셀 이미지"
                className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-black/18 text-white/88 backdrop-blur-sm transition hover:bg-black/34 sm:left-6"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => moveSlide("next")}
                aria-label="다음 캐러셀 이미지"
                className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-black/18 text-white/88 backdrop-blur-sm transition hover:bg-black/34 sm:right-6"
              >
                →
              </button>
            </>
          ) : null}

          {canNavigate ? (
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/12 bg-black/18 px-3 py-2 backdrop-blur-sm">
              {slides.map((slide, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`${index + 1}번 캐러셀 이미지 보기`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isActive ? "w-8 bg-white" : "w-2.5 bg-white/42 hover:bg-white/68"
                    }`}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
