import type { PromoBanner } from "@/types/product";

interface PromoSectionProps {
  banners: PromoBanner[];
}

const toneStyles = {
  night: {
    container: "bg-[#111111] text-white",
    eyebrow: "text-white/42",
    description: "text-white/62",
    outline: "border-white/10 bg-white/5",
    button: "bg-white text-black hover:bg-white/88",
    secondary: "border-white/12 text-white hover:bg-white/6",
    accent: "text-white/16",
  },
  paper: {
    container: "bg-[#e6e1d9] text-black",
    eyebrow: "text-black/44",
    description: "text-black/60",
    outline: "border-black/8 bg-white/30",
    button: "bg-black text-white hover:bg-black/84",
    secondary: "border-black/10 text-black hover:bg-black/4",
    accent: "text-black/10",
  },
} as const;

export function PromoSection({ banners }: PromoSectionProps) {
  return (
    <section className="px-5 pt-20 sm:px-8 sm:pt-24 lg:px-12" id="promo">
      <div className="mx-auto max-w-[1440px]">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-black/46">
            Promotion Banner
          </p>
          <h2 className="text-[2rem] font-semibold leading-[1.02] tracking-[-0.07em] text-black sm:text-[2.7rem]">
            에디토리얼처럼 보이도록 정리한 프로모션 배너
          </h2>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          {banners.map((banner) => {
            const tone = toneStyles[banner.tone];

            return (
              <article
                key={banner.id}
                className={`relative min-h-[360px] overflow-hidden rounded-[28px] border border-black/10 ${tone.container}`}
              >
                <div
                  className={`absolute -right-2 top-8 text-[5.7rem] font-semibold leading-none tracking-[-0.1em] ${tone.accent} sm:text-[7rem]`}
                >
                  EDIT
                </div>

                <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <div className="max-w-[23rem] space-y-4">
                    <p
                      className={`text-[11px] font-medium uppercase tracking-[0.3em] ${tone.eyebrow}`}
                    >
                      {banner.eyebrow}
                    </p>
                    <h3 className="max-w-[12ch] text-[2rem] font-semibold leading-[0.98] tracking-[-0.08em] sm:text-[2.5rem]">
                      {banner.title}
                    </h3>
                    <p className={`max-w-md text-[14px] leading-6 ${tone.description}`}>
                      {banner.description}
                    </p>
                  </div>

                  <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-wrap gap-3">
                      <a
                        className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-[13px] font-medium transition-colors duration-300 ${tone.button}`}
                        href="#"
                      >
                        {banner.cta}
                      </a>
                      <a
                        className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-[13px] font-medium transition-colors duration-300 ${tone.secondary}`}
                        href="#"
                      >
                        {banner.secondaryCta}
                      </a>
                    </div>

                    <p
                      className={`text-[10px] font-medium uppercase tracking-[0.32em] ${tone.eyebrow}`}
                    >
                      {banner.accent}
                    </p>
                  </div>
                </div>

                <div
                  className={`absolute right-5 top-5 h-[42%] w-[34%] rounded-[24px] border ${tone.outline} sm:right-6 sm:top-6`}
                />
                <div
                  className={`absolute bottom-6 right-6 h-[28%] w-[42%] rounded-[24px] border ${tone.outline}`}
                />
                <div
                  className={`absolute bottom-24 right-16 h-[10px] w-[22%] rounded-full ${banner.tone === "night" ? "bg-white/20" : "bg-black/12"}`}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
