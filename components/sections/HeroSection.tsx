import type { HeroContent } from "@/types/product";

interface HeroSectionProps {
  content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section className="px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.12fr)]">
        <div className="flex min-h-[520px] flex-col rounded-[28px] border border-black/10 bg-white/76 px-6 py-7 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-black/46">
            {content.eyebrow}
          </p>

          <div className="mt-8 space-y-1 sm:mt-12">
            {content.title.map((line) => (
              <h1
                key={line}
                className="text-[clamp(3.15rem,10vw,7.4rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-black"
              >
                {line}
              </h1>
            ))}
          </div>

          <p className="mt-7 max-w-xl text-[15px] leading-7 text-black/66 sm:mt-8 sm:text-[16px]">
            {content.description}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              className="inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-black/84"
              href="#new-in"
            >
              {content.primaryCta}
            </a>
            <a
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-[13px] font-medium text-black transition-colors duration-300 hover:bg-black/4"
              href="#promo"
            >
              {content.secondaryCta}
            </a>
          </div>

          <div className="mt-auto grid gap-3 border-t border-black/10 pt-8 sm:grid-cols-3">
            {content.stats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-black/42">
                  {stat.label}
                </p>
                <p className="text-[1.02rem] font-semibold tracking-[-0.04em] text-black">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[440px] overflow-hidden rounded-[28px] border border-black/10 bg-[#101010] sm:min-h-[520px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(160deg,#202020_0%,#0c0c0c_72%,#060606_100%)]" />
          <div className="absolute left-6 top-6 text-[11px] font-medium uppercase tracking-[0.3em] text-white/42 sm:left-8 sm:top-8">
            urban mood / 2026
          </div>
          <div className="absolute -left-2 top-10 text-[7.5rem] font-semibold leading-none tracking-[-0.1em] text-white/8 sm:text-[10rem] lg:text-[14rem]">
            026
          </div>

          <div className="absolute right-4 top-4 h-[66%] w-[54%] rounded-[26px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_44%,rgba(0,0,0,0.26)_100%)] sm:right-6 sm:top-6" />

          <div className="absolute right-7 top-7 flex h-[58%] w-[46%] flex-col justify-between rounded-[22px] border border-white/8 bg-white/6 p-5 backdrop-blur-sm sm:right-10 sm:top-10 sm:p-6">
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/52">
              Seasonal note
            </span>
            <div>
              <p className="text-[2.1rem] font-semibold leading-none tracking-[-0.07em] text-white sm:text-[2.8rem]">
                MONO
              </p>
              <p className="mt-2 text-[13px] leading-6 text-white/54">
                Sharp lines, softer texture, and a quiet sense of movement.
              </p>
            </div>
          </div>

          <div className="absolute bottom-5 left-5 w-[46%] rounded-[22px] border border-black/10 bg-[#e8e3db] p-5 text-black sm:bottom-6 sm:left-6 sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-black/46">
              Drop 01
            </p>
            <p className="mt-5 text-[1.55rem] font-semibold leading-[1.06] tracking-[-0.06em] sm:text-[1.85rem]">
              Tailored layers
              <br />
              for the city.
            </p>
          </div>

          <div className="absolute bottom-5 right-5 flex w-[40%] flex-col gap-4 rounded-[22px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:bottom-6 sm:right-6 sm:p-5">
            <div className="h-20 rounded-[18px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.03))] sm:h-24" />
            <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.28em] text-white/56">
              <span>Quiet fit</span>
              <span>02</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
