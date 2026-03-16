"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

import { getResizedImageUrl } from "@/lib/image-url";
import type { StorefrontCarouselSlide } from "@/types/carousel";

interface HomeCarouselProps {
  slides: StorefrontCarouselSlide[];
}

export function HomeCarousel({ slides }: HomeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || isAutoplayPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isAutoplayPaused, slides.length]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current !== null) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  if (!slides.length) {
    return null;
  }

  const canNavigate = slides.length > 1;

  function clearResumeTimeout() {
    if (resumeTimeoutRef.current !== null) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }

  function pauseAutoplay() {
    clearResumeTimeout();
    setIsAutoplayPaused(true);
  }

  function scheduleAutoplayResume() {
    clearResumeTimeout();
    resumeTimeoutRef.current = window.setTimeout(() => {
      setIsAutoplayPaused(false);
      resumeTimeoutRef.current = null;
    }, 1000);
  }

  function moveSlide(direction: "prev" | "next") {
    if (!canNavigate) {
      return;
    }

    pauseAutoplay();

    setActiveIndex((currentIndex) => {
      if (direction === "prev") {
        return currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
      }

      return (currentIndex + 1) % slides.length;
    });

    scheduleAutoplayResume();
  }

  return (
    <section
      ref={containerRef}
      className="px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12"
      onPointerEnter={pauseAutoplay}
      onPointerLeave={scheduleAutoplayResume}
      onTouchStart={pauseAutoplay}
      onTouchEnd={scheduleAutoplayResume}
      onTouchCancel={scheduleAutoplayResume}
      onFocusCapture={pauseAutoplay}
      onBlurCapture={(event) => {
        const nextFocusedTarget = event.relatedTarget;

        if (
          nextFocusedTarget instanceof Node &&
          containerRef.current?.contains(nextFocusedTarget)
        ) {
          return;
        }

        scheduleAutoplayResume();
      }}
    >
      <div className="mx-auto max-w-[980px]">
        <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-[#090909]">
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={slide.id} className="relative min-w-full">
                <div className="relative aspect-[16/10] min-h-[190px] sm:min-h-[250px] lg:min-h-[320px]">
                  <img
                    src={getResizedImageUrl(slide.imageUrl, 2200) ?? slide.imageUrl}
                    alt={`홈 캐러셀 이미지 ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(9,9,9,0)_0%,rgba(9,9,9,0.3)_100%)] sm:h-32" />
                </div>
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 sm:px-7">
            <div className="rounded-full border border-white/12 bg-black/18 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-white/78 backdrop-blur-sm">
              GEUKROCK Members
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
                    onClick={() => {
                      pauseAutoplay();
                      setActiveIndex(index);
                      scheduleAutoplayResume();
                    }}
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
